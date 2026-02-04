// This script generates 10 random 6-digit artist IDs, manually searches Beatport, and provides the artist names for those IDs. 
// This is a temporary test file to ensure we can manually scrape data using Cheerio

const axios = require('axios');
const cheerio = require('cheerio');

// Generate 10 random 6-digit Beatport IDs
function generateIds(count = 10) {
  const ids = new Set();
  while (ids.size < count) {
    const id = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    ids.add(id);
  }
  return Array.from(ids);
}

async function fetchBeatportArtist(id) {
  const url = `https://www.beatport.com/artist/x/${id}`;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Adjust selector if needed — this one grabs the artist name
    const artistName = $('h1').first().text().trim();
    if (artistName) {
      console.log(`✅ ID ${id} → ${artistName}`);
    } else {
      console.log(`❌ ID ${id} → No artist name found`);
    }
  } catch (error) {
    console.log(`❌ ID ${id} → ${error.message}`);
  }
}

async function run() {
  const ids = generateIds();
  for (const id of ids) {
    await fetchBeatportArtist(id);
  }
}

run();
