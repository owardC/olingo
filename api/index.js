const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'olingo-dev-secret-key-change-in-prod';

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Sign up new user
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email, hash);
    const user_id = result.lastInsertRowid;
    
    // Initialize beginner level for both languages
    const levelStmt = db.prepare('INSERT INTO user_levels (user_id, language, level) VALUES (?, ?, ?)');
    levelStmt.run(user_id, 'vietnamese', 'beginner');
    levelStmt.run(user_id, 'venezuelan_spanish', 'beginner');
    
    const token = jwt.sign({ user_id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user_id, token });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const stmt = db.prepare('SELECT id, password_hash FROM users WHERE email = ?');
    const user = stmt.get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ user_id: user.id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user_id: user.id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user progress
app.get('/api/progress/:language', verifyToken, (req, res) => {
  const { language } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM progress WHERE user_id = ? AND language = ? ORDER BY completed_at DESC');
    const progress = stmt.all(req.user.user_id, language);
    res.json({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user unlocked levels
app.get('/api/user/levels', verifyToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT language, level FROM user_levels WHERE user_id = ? ORDER BY language, level');
    const levels = stmt.all(req.user.user_id);
    res.json({ levels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lessons', (req, res) => {
  const { lang = 'vietnamese' } = req.query;
  const key = lang === 'spanish' || lang === 'venezuelan_spanish' ? 'venezuelan_spanish' : 'vietnamese';
  
  try {
    // Return all 180 lessons in sequence (beginner 1-30, intermediate 31-60, expert 61-90)
    const stmt = db.prepare(`
      SELECT * FROM lessons 
      WHERE language = ? 
      ORDER BY CASE level WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'expert' THEN 3 END, id
    `);
    const rows = stmt.all(key);
    const lessons = rows.map((row, index) => ({
      ...row,
      sequence: index + 1,  // 1-180 for board game display
      phrases: JSON.parse(row.phrases),
      difficulty: Math.ceil((index + 1) / 60)  // 1-3 stars based on position
    }));
    res.json({ lessons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/roadmap', (req, res) => {
  res.json({
    languages: [
      { id: 'vietnamese', name: 'Vietnamese', levels: ['beginner','intermediate','expert'] },
      { id: 'venezuelan_spanish', name: 'Venezuelan Spanish', levels: ['beginner','intermediate','expert'] }
    ]
  });
});

// Get flashcards for a lesson
app.get('/api/flashcards/:lesson_id', (req, res) => {
  const { lesson_id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE lesson_id = ?');
    const cards = stmt.all(lesson_id);
    res.json({ flashcards: cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update flashcard review (spaced repetition)
app.post('/api/flashcard-review', verifyToken, (req, res) => {
  const { flashcard_id, quality } = req.body; // quality: 0-5 (0=fail, 5=perfect)
  if (!flashcard_id || quality === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Get or create progress record
    let progressStmt = db.prepare('SELECT * FROM user_flashcard_progress WHERE user_id = ? AND flashcard_id = ?');
    let progress = progressStmt.get(req.user.user_id, flashcard_id);
    
    if (!progress) {
      // Create new record
      const createStmt = db.prepare('INSERT INTO user_flashcard_progress (user_id, flashcard_id) VALUES (?, ?)');
      createStmt.run(req.user.user_id, flashcard_id);
      progress = progressStmt.get(req.user.user_id, flashcard_id);
    }
    
    // SM-2 algorithm
    const { interval, ease_factor, repetitions } = progress;
    let newInterval = interval;
    let newEase = ease_factor;
    let newReps = repetitions;
    
    if (quality >= 3) {
      newReps = repetitions + 1;
      if (newReps === 1) newInterval = 1;
      else if (newReps === 2) newInterval = 3;
      else newInterval = Math.round(interval * ease_factor);
    } else {
      newInterval = 1;
      newReps = 0;
    }
    
    newEase = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    const nextReview = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
    const updateStmt = db.prepare(`
      UPDATE user_flashcard_progress 
      SET interval = ?, ease_factor = ?, repetitions = ?, next_review = ?, last_reviewed = CURRENT_TIMESTAMP
      WHERE user_id = ? AND flashcard_id = ?
    `);
    updateStmt.run(newInterval, newEase, newReps, nextReview.toISOString(), req.user.user_id, flashcard_id);
    
    // Award XP based on quality
    const xpAward = quality >= 3 ? 5 : 1;
    const xpStmt = db.prepare('UPDATE users SET xp = xp + ?, streak = streak + 1 WHERE id = ?');
    xpStmt.run(xpAward, req.user.user_id);
    
    res.json({ ok: true, interval: newInterval, xp_awarded: xpAward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user stats (XP, streak, level)
app.get('/api/user/stats', verifyToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT xp, streak, email FROM users WHERE id = ?');
    const user = stmt.get(req.user.user_id);
    const level = Math.floor(user.xp / 100) + 1; // Level based on XP
    res.json({ xp: user.xp, streak: user.streak, level, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's due flashcards (for review)
app.get('/api/flashcards-due', verifyToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT fc.* FROM flashcards fc
      JOIN user_flashcard_progress ufp ON fc.id = ufp.flashcard_id
      WHERE ufp.user_id = ? AND ufp.next_review <= CURRENT_TIMESTAMP
      LIMIT 20
    `);
    const cards = stmt.all(req.user.user_id);
    res.json({ flashcards: cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Post progress (requires auth)
app.post('/api/progress', verifyToken, (req, res) => {
  const { lesson_id, language, level } = req.body;
  if (!lesson_id || !language || !level) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO progress (user_id, lesson_id, language, level) VALUES (?, ?, ?, ?)');
    stmt.run(req.user.user_id, lesson_id, language, level);
    
    // Award 10 XP for completing lesson
    const xpStmt = db.prepare('UPDATE users SET xp = xp + 10 WHERE id = ?');
    xpStmt.run(req.user.user_id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Olingo API running on http://localhost:${PORT}`);
});

