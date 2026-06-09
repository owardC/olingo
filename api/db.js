const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL,
        level TEXT NOT NULL,
        title TEXT NOT NULL,
        phrases TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        lesson_id TEXT NOT NULL,
        language TEXT NOT NULL,
        level TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_levels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        language TEXT NOT NULL,
        level TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, language, level)
      );
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        audio_url TEXT,
        language TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_flashcard_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        flashcard_id TEXT NOT NULL,
        interval INTEGER DEFAULT 1,
        ease_factor REAL DEFAULT 2.5,
        repetitions INTEGER DEFAULT 0,
        next_review TIMESTAMP DEFAULT NOW(),
        last_reviewed TIMESTAMP,
        UNIQUE(user_id, flashcard_id)
      );
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        ip TEXT,
        city TEXT,
        region TEXT,
        country TEXT,
        lat REAL,
        lng REAL,
        logged_in_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

async function seedLessons() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*) as count FROM lessons');
    if (parseInt(rows[0].count) > 0) return;

    const seedPath = path.join(__dirname, 'data', 'lessons-seed.json');
    if (!fs.existsSync(seedPath)) {
      console.log('No lessons-seed.json found, skipping seed');
      return;
    }
    const lessons = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    for (const lesson of lessons) {
      await client.query(
        'INSERT INTO lessons (id, language, level, title, phrases) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [lesson.id, lesson.language, lesson.level, lesson.title, lesson.phrases]
      );
    }
    console.log(`Seeded ${lessons.length} lessons`);
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDB, seedLessons };
