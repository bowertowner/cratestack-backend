const bandcamp = require('bandcamp-scraper');

function findBandcampUrl(artistName) {
  return new Promise((resolve, reject) => {
    bandcamp.search({ query: artistName, page: 1 }, (error, searchResults) => {
      if (error) {
        console.error('Bandcamp search error:', error);
        return reject(error);
      }

      const artistPage = searchResults?.find(result => result.type === 'artist');
      if (artistPage) {
        resolve(artistPage.url);
      } else {
        resolve(null);
      }
    });
  });
}

module.exports = { findBandcampUrl };
