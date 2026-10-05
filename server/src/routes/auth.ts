import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'youtube-watch-party-secret-key-2026';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = await getDb();
    const existing = await db.get(`SELECT id FROM users WHERE username = ?`, username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const hash = await bcrypt.hash(password, 10);
    const createdAt = Date.now();

    await db.run(
      `INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      userId, username, hash, createdAt
    );

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: userId, username } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = await getDb();
    const user = await db.get(`SELECT * FROM users WHERE username = ?`, username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Guest Login (Instant Join without password)
router.post('/guest', (req, res) => {
  const { username } = req.body;
  const guestName = username?.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
  const userId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const token = jwt.sign({ userId, username: guestName, isGuest: true }, JWT_SECRET, { expiresIn: '1d' });
  return res.json({ token, user: { id: userId, username: guestName, isGuest: true } });
});

export default router;
