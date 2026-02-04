require('dotenv').config();
const express = require("express");
const querystring = require('querystring');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./artistDatabase');
const { findBandcampUrl } = require('./bandcampLookup');
const { findSoundCloudUrl } = require('./soundcloudLookup');

app.use(express.static('public'));
app.use(cookieParser());

console.log("CrateStack server starting...");
console.log("Current directory:", process.cwd());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/hello", (req, res) => {
  res.send("Hello from CrateStack!");
});

app.get('/login', (req, res) => {
  const scope = [
    'user-library-read',
    'playlist-read-private',
    'user-top-read',
    'user-follow-read'
  ].join(' ');

  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scope
  });

  const authURL = `https://accounts.spotify.com/authorize?${params}`;
  res.redirect(authURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64')
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI
      }).toString()
    });

    const accessToken = response.data.access_token;
    res.cookie('access_token', accessToken, { httpOnly: true });

    res.send(`
      <p>Authorization successful!</p>
      <p><a href="/playlists">View My Playlists</a></p>
    `);

  } catch (error) {
    console.error('Error getting tokens:', error.response?.data || error.message);
    res.send('Failed to get tokens from Spotify');
  }
});

app.get('/playlists', async (req, res) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token missing. Please log in.' });
  }

  let allPlaylists = [];
  let offset = 0;
  const limit = 50;

  try {
    while (true) {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        params: { limit, offset }
      });

      const playlists = response.data.items.map(playlist => ({
        name: playlist.name,
        id: playlist.id
      }));

      allPlaylists = allPlaylists.concat(playlists);

      if (!response.data.next) break;
      offset += limit;
    }

    res.json(allPlaylists);
  } catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

const { findBeatportUrl } = require('./beatportLookup'); // make sure this is declared at the top

app.get('/playlist/:id/tracks', async (req, res) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    return res.status(401).send('Access token missing. Please log in.');
  }

  const playlistId = req.params.id;
  let allTracks = [];
  let offset = 0;
  const limit = 100;
  const seenArtists = new Set();
  const maxScrapesPerRequest = 10;
  let scrapeCount = 0;

  try {
    while (true) {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        params: {
          limit,
          offset
        }
      });

      const tracks = await Promise.all(response.data.items.map(async (item) => {
        const artistNames = item.track.artists.map(artist => artist.name);
        let bandcampUrls = [];
        let soundcloudUrl = null;
        let beatportUrl = null;

        for (const name of artistNames) {
          if (!seenArtists.has(name)) {
            seenArtists.add(name);

            const artist = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM artists WHERE name = ?', [name], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });

            const needsScraping = !artist || !artist.bandcamp_url || !artist.soundcloud_url || !artist.beatport_url;

            if (needsScraping) {
              if (scrapeCount >= maxScrapesPerRequest) {
                continue;
              }

              const bandcampUrl = await findBandcampUrl(name);
              soundcloudUrl = await findSoundCloudUrl(name);
              beatportUrl = await findBeatportUrl(name);
              scrapeCount++;

              const query = `
                INSERT INTO artists (name, bandcamp_url, soundcloud_url, beatport_url)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                  bandcamp_url=excluded.bandcamp_url,
                  soundcloud_url=excluded.soundcloud_url,
                  beatport_url=excluded.beatport_url
              `;
              db.run(query, [name, bandcampUrl, soundcloudUrl, beatportUrl]);

              bandcampUrls.push(bandcampUrl);
            } else {
              bandcampUrls.push(artist.bandcamp_url);
              soundcloudUrl = artist.soundcloud_url;
              beatportUrl = artist.beatport_url;
            }
          }
        }

        return {
          trackName: item.track.name,
          artistNames: artistNames.join(', '),
          albumName: item.track.album.name,
          trackId: item.track.id,
          bandcampUrls: bandcampUrls,
          soundcloudUrl: soundcloudUrl,
          beatportUrl: beatportUrl
        };
      }));

      allTracks = allTracks.concat(tracks);

      if (!response.data.next) break;
      offset += limit;
    }

    res.json(allTracks);
  } catch (error) {
    console.error('Error fetching all tracks:', error.response?.data || error.message);
    res.status(500).send('Failed to fetch tracks');
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`CrateStack backend is running on http://127.0.0.1:${PORT}`);
});