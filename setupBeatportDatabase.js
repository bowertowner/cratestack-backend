// setupBeatportDatabase.js

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupDatabase() {
  const db = await open({
    filename: './beatport_artist_data.db', // This keeps it separate from your main DB
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      beatport_id INTEGER PRIMARY KEY,
      artist_name TEXT NOT NULL,
      beatport_url TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      scraped_from TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      genre_tags TEXT,
      alias TEXT,
      first_seen TEXT NOT NULL
    );
  `);

  console.log("✅ Beatport artist database initialized.");
  await db.close();
}

setupDatabase();
