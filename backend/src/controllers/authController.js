const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { query } = require('../config/database');
const mockDb = require('../utils/mockDb');
const { processInviteAfterRegistration } = require('./groupController');
const logger = require('../utils/logger');

// Validation Schemas
const RegisterSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(1),
  role: z.enum(['candidate', 'mentor', 'teacher', 'hr']),
  invite_token: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Required for sameSite: 'none'
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const register = async (req, res) => {
  const validation = RegisterSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
  }

  const { email, password, full_name, role, invite_token } = validation.data;

  try {
    if (process.env.USE_MOCK_DB === 'true') {
      const existing = await mockDb.findUserByEmail(email.toLowerCase());
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const password_hash = await bcrypt.hash(password, 12);
      const user = await mockDb.createUser({ email: email.toLowerCase(), password_hash, full_name, role });
      await processInviteAfterRegistration(user.id, email.toLowerCase()).catch(() => {});
      const token = generateToken(user);
      setAuthCookie(res, token);
      logger.info(`Mock user registered: ${email} (${role})`);
      return res.status(201).json({ token, user });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email.toLowerCase(), password_hash, full_name, role]
    );
    const user = result.rows[0];

    // Profile initialization
    if (role === 'candidate') {
      await query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);
      await query('INSERT INTO privacy_settings (user_id) VALUES ($1)', [user.id]);
    } else if (role === 'hr') {
      await query('INSERT INTO hr_profiles (user_id) VALUES ($1)', [user.id]);
    }

    await processInviteAfterRegistration(user.id, email.toLowerCase()).catch(() => {});

    const token = generateToken(user);
    setAuthCookie(res, token);
    
    logger.info(`User registered: ${email} (${role})`);
    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const validation = LoginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, password } = validation.data;

  try {
    if (process.env.USE_MOCK_DB === 'true') {
      const user = await mockDb.findUserByEmail(email.toLowerCase());
      if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      await mockDb.updateLastLogin(user.id);
      const token = generateToken(user);
      setAuthCookie(res, token);
      logger.info(`Mock user logged in: ${email}`);
      return res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, photo_url: user.photo_url } });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    
    const token = generateToken(user);
    setAuthCookie(res, token);

    logger.info(`User logged in: ${email}`);
    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, photo_url: user.photo_url }
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  if (process.env.USE_MOCK_DB === 'true') {
    const user = await mockDb.getUserById(req.user.id);
    return res.json({ user });
  }
  const result = await query('SELECT id, email, full_name, role, photo_url, last_login FROM users WHERE id=$1', [req.user.id]);
  res.json({ user: result.rows[0] });
};

module.exports = { register, login, logout, me };
