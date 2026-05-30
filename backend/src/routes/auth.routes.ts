import { Router, Request, Response } from 'express';
import { getDatabase } from '../database';
import { User, LoginRequest, SignupRequest } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Register/Signup
router.post('/signup', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as SignupRequest;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const db = getDatabase();

    // Check if user exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create user (password would be hashed in production)
    const userId = uuidv4();
    const token = generateToken();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, theme)
      VALUES (?, ?, ?, ?, 'dark')
    `).run(userId, email, password); // TODO: Use bcrypt for real passwords

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, token, expiresAt.toISOString());

    const user: User = { id: userId, email, name, theme: 'dark', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    res.status(201).json({
      data: { user, token, expires_in: 86400 },
      message: 'Account created successfully',
      timestamp: new Date().toISOString(),
    });

    logger.info('User registered', { userId, email });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getDatabase();

    // Find user
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // TODO: Use bcrypt to verify password
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), user.id, token, expiresAt.toISOString());

    res.json({
      data: { user, token, expires_in: 86400 },
      message: 'Logged in successfully',
      timestamp: new Date().toISOString(),
    });

    logger.info('User logged in', { userId: user.id });
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', (_req: Request, res: Response) => {
  try {
    // TODO: Get from auth middleware
    const userId = 'default-user';
    const db = getDatabase();

    const user = db
      .prepare('SELECT id, email, name, avatar_url, theme, created_at, updated_at FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user theme
router.patch('/theme', (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    const userId = 'default-user'; // TODO: Get from auth middleware
    const db = getDatabase();

    if (!['light', 'dark'].includes(theme)) {
      res.status(400).json({ error: 'Invalid theme' });
      return;
    }

    db.prepare('UPDATE users SET theme = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(theme, userId);

    res.json({
      data: { theme },
      message: 'Theme updated',
      timestamp: new Date().toISOString(),
    });

    logger.info('User theme updated', { userId, theme });
  } catch (error) {
    logger.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export default router;
