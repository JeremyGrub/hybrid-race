const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { gymAuth } = require('../middleware/gymAuth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function makeToken(gym) {
  return jwt.sign(
    { gymId: gym.id, email: gym.email, gym_name: gym.gym_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/create-admin  — ONE TIME USE, remove after running
router.post('/create-admin', async (req, res) => {
  const secret = req.headers['x-admin-setup'];
  if (secret !== (process.env.ADMIN_SETUP_SECRET || 'racegrid-setup-2026')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, password } = req.body;
  if (!email || !password || password.length < 10) {
    return res.status(400).json({ error: 'Email and password (min 10 chars) required' });
  }
  const db = getDb();
  const existing = db.prepare('SELECT id, is_admin FROM gyms WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    db.prepare('UPDATE gyms SET is_admin = 1 WHERE id = ?').run(existing.id);
    return res.json({ ok: true, message: 'Existing account promoted to admin' });
  }
  const password_hash = await bcrypt.hash(password, 12);
  db.prepare(`INSERT INTO gyms (email, password_hash, gym_name, location, is_admin) VALUES (?, ?, 'RaceGrid Admin', 'Internal', 1)`)
    .run(email.toLowerCase().trim(), password_hash);
  res.json({ ok: true, message: 'Admin account created' });
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, gym_name, location } = req.body;
  if (!email || !password || !gym_name || !location) {
    return res.status(400).json({ error: 'Email, password, gym name, and location are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM gyms WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const password_hash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO gyms (email, password_hash, gym_name, location) VALUES (?, ?, ?, ?)'
  ).run(email.toLowerCase().trim(), password_hash, gym_name.trim(), location.trim());

  const gym = db.prepare(
    'SELECT id, email, gym_name, location, stripe_account_id, stripe_onboarding_complete, is_admin FROM gyms WHERE id = ?'
  ).get(Number(result.lastInsertRowid));

  const token = makeToken(gym);
  res.status(201).json({ token, gym });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const db = getDb();
  const gym = db.prepare(
    'SELECT id, email, password_hash, gym_name, location, stripe_account_id, stripe_onboarding_complete, is_admin FROM gyms WHERE email = ?'
  ).get(email.toLowerCase().trim());

  if (!gym) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, gym.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const { password_hash, ...gymData } = gym;
  const token = makeToken(gymData);
  res.json({ token, gym: gymData });
});

// GET /api/auth/me
router.get('/me', gymAuth, (req, res) => {
  res.json({ gym: req.gym });
});

// POST /api/auth/stripe/connect
router.post('/stripe/connect', gymAuth, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const db = getDb();
    let accountId = req.gym.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: req.gym.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_profile: { name: req.gym.gym_name },
      });
      accountId = account.id;
      db.prepare('UPDATE gyms SET stripe_account_id = ? WHERE id = ?').run(accountId, req.gym.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/dashboard`,
      return_url: `${APP_URL}/api/auth/stripe/callback?account_id=${accountId}&gym_id=${req.gym.id}`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch(e) {
    console.error('Stripe connect error:', e.message);
    res.status(500).json({ error: 'Failed to create Stripe Connect link' });
  }
});

// GET /api/auth/stripe/callback
router.get('/stripe/callback', async (req, res) => {
  const { gym_id } = req.query;
  if (gym_id) {
    try {
      const db = getDb();
      db.prepare('UPDATE gyms SET stripe_onboarding_complete = 1 WHERE id = ?').run(gym_id);
    } catch(e) {
      console.error('Stripe callback error:', e.message);
    }
  }
  res.redirect('/dashboard');
});

module.exports = router;
