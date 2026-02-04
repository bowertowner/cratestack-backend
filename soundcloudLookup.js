const SoundCloud = require('soundcloud-scraper');
const client = new SoundCloud.Client();

async function findSoundCloudUrl(artistName) {
  try {
    const results = await client.search(artistName, 'artist');
    if (results && results.length > 0) {
      return results[0].url;
    }
    return null;
  } catch (error) {
    console.error(`[SoundCloud] Search failed for ${artistName}:`, error.message);
    return null;
  }
}

module.exports = { findSoundCloudUrl };
