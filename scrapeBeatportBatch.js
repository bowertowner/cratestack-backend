// scrapeBeatportBatch.js

const axios = require('axios');

const BASE_URL = 'https://www.beatport.com/artist/x/';
const START_ID = 45;
const BATCH_SIZE = 50;

async function scrapeBatch(startId, batchSize) {
  for (let id = startId; id < startId + batchSize; id++) {
    const url = `${BASE_URL}${id}`;
    try {
      const response = await axios.get(url);
      console.log(`✅ ID ${id}: ${url} - Status ${response.status}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`❌ ID ${id}: Not Found`);
      } else {
        console.log(`⚠️  ID ${id}: Error - ${error.message}`);
      }
    }
  }
}

// Run the scraper
scrapeBatch(START_ID, BATCH_SIZE);
