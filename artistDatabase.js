// artistDatabase.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path to the database file
const dbPath = path.resolve(__dirname, 'artist_data.db');

// Connect to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the artist_data SQLite database.');
  }
});

// Create the artists table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    bandcamp_url TEXT,
    beatport_url TEXT,
    website_url TEXT
  )
`, (err) => {
  if (err) {
    console.error('Error creating artists table:', err.message);
  } else {
    console.log('Artists table is ready.');
  }
});

module.exports = db;
