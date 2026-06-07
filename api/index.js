const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool, initializeDB, seedLessons } = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'olingo-dev-secret-key-change-in-prod';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );
    const user_id = result.rows[0].id;
    await pool.query(
      'INSERT INTO user_levels (user_id, language, level) VALUES ($1, $2, $3), ($1, $4, $5)',
      [user_id, 'vietnamese', 'beginner', 'venezuelan_spanish', 'beginner']
    );
    const token = jwt.sign({ user_id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user_id, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ user_id: user.id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user_id: user.id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress/:language', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM progress WHERE user_id = $1 AND language = $2 ORDER BY completed_at DESC',
      [req.user.user_id, req.params.language]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/levels', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT language, level FROM user_levels WHERE user_id = $1 ORDER BY language, level',
      [req.user.user_id]
    );
    res.json({ levels: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lessons', async (req, res) => {
  const { lang = 'vietnamese' } = req.query;
  const key = lang === 'spanish' || lang === 'venezuelan_spanish' ? 'venezuelan_spanish' : 'vietnamese';
  try {
    const result = await pool.query(
      `SELECT * FROM lessons WHERE language = $1 
       ORDER BY CASE level WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'expert' THEN 3 END, id`,
      [key]
    );
    const lessons = result.rows.map((row, index) => ({
      ...row,
      sequence: index + 1,
      phrases: JSON.parse(row.phrases),
      difficulty: Math.ceil((index + 1) / 30)
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

app.get('/api/flashcards/:lesson_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flashcards WHERE lesson_id = $1', [req.params.lesson_id]);
    res.json({ flashcards: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flashcard-review', verifyToken, async (req, res) => {
  const { flashcard_id, quality } = req.body;
  if (!flashcard_id || quality === undefined) return res.status(400).json({ error: 'Missing required fields' });
  try {
    let result = await pool.query(
      'SELECT * FROM user_flashcard_progress WHERE user_id = $1 AND flashcard_id = $2',
      [req.user.user_id, flashcard_id]
    );
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO user_flashcard_progress (user_id, flashcard_id) VALUES ($1, $2)', [req.user.user_id, flashcard_id]);
      result = await pool.query('SELECT * FROM user_flashcard_progress WHERE user_id = $1 AND flashcard_id = $2', [req.user.user_id, flashcard_id]);
    }
    const progress = result.rows[0];
    let newInterval = progress.interval, newEase = progress.ease_factor, newReps = progress.repetitions;
    if (quality >= 3) {
      newReps++;
      if (newReps === 1) newInterval = 1;
      else if (newReps === 2) newInterval = 3;
      else newInterval = Math.round(progress.interval * progress.ease_factor);
    } else { newInterval = 1; newReps = 0; }
    newEase = Math.max(1.3, progress.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    const nextReview = new Date(Date.now() + newInterval * 86400000);
    await pool.query(
      'UPDATE user_flashcard_progress SET interval=$1, ease_factor=$2, repetitions=$3, next_review=$4, last_reviewed=NOW() WHERE user_id=$5 AND flashcard_id=$6',
      [newInterval, newEase, newReps, nextReview.toISOString(), req.user.user_id, flashcard_id]
    );
    const xpAward = quality >= 3 ? 5 : 1;
    await pool.query('UPDATE users SET xp = xp + $1, streak = streak + 1 WHERE id = $2', [xpAward, req.user.user_id]);
    res.json({ ok: true, interval: newInterval, xp_awarded: xpAward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/stats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT xp, streak, email FROM users WHERE id = $1', [req.user.user_id]);
    const user = result.rows[0];
    res.json({ xp: user.xp, streak: user.streak, level: Math.floor(user.xp / 100) + 1, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/flashcards-due', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fc.* FROM flashcards fc JOIN user_flashcard_progress ufp ON fc.id = ufp.flashcard_id
       WHERE ufp.user_id = $1 AND ufp.next_review <= NOW() LIMIT 20`,
      [req.user.user_id]
    );
    res.json({ flashcards: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/progress', verifyToken, async (req, res) => {
  const { lesson_id, language, level } = req.body;
  if (!lesson_id || !language || !level) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await pool.query(
      'INSERT INTO progress (user_id, lesson_id, language, level) VALUES ($1, $2, $3, $4)',
      [req.user.user_id, lesson_id, language, level]
    );
    await pool.query('UPDATE users SET xp = xp + 10 WHERE id = $1', [req.user.user_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await initializeDB();
  await seedLessons();
  app.listen(PORT, () => console.log(`Olingo API running on http://localhost:${PORT}`));
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });
