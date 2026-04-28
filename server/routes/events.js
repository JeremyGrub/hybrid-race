const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { pinAuth } = require('../middleware/pinAuth');
const { gymAuth } = require('../middleware/gymAuth');

const router = express.Router();

// Set up multer for waiver uploads
let upload;
try {
  const multer = require('multer');
  const waiverDir = path.join(
    path.dirname(process.env.DB_PATH || path.join(__dirname, '../db/hybrid-race.db')),
    'waivers'
  );
  if (!fs.existsSync(waiverDir)) fs.mkdirSync(waiverDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: waiverDir,
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}.pdf`);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new Error('Only PDF files allowed'));
    },
  });
} catch(e) {
  // multer not installed yet; upload will be undefined
  console.warn('multer not available:', e.message);
}

const VALID_TYPES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];

function parseEventType(event_type) {
  try {
    const parsed = typeof event_type === 'string' ? JSON.parse(event_type) : event_type;
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [event_type];
  }
}

// GET /api/events
router.get('/', (req, res) => {
  const { search, type, date, gym_id } = req.query;
  const db = getDb();

  let query = `
    SELECT e.id, e.gym_id, e.gym_name, e.location, e.event_name, e.description,
           e.event_date, e.event_type, e.price, e.use_divisions, e.use_age_groups,
           e.is_active, e.created_at,
           COUNT(r.id) as racer_count,
           (SELECT COUNT(*) FROM registrations reg WHERE reg.event_id = e.id AND reg.status = 'paid') as registration_count
    FROM events e
    LEFT JOIN racers r ON r.event_id = e.id
    WHERE e.is_active = 1
  `;
  const params = [];

  if (gym_id) { query += ` AND e.gym_id = ?`; params.push(gym_id); }
  if (search) {
    query += ` AND (e.event_name LIKE ? OR e.gym_name LIKE ? OR e.location LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (type) { query += ` AND e.event_type LIKE ?`; params.push(`%${type}%`); }
  if (date) { query += ` AND e.event_date = ?`; params.push(date); }
  query += ` GROUP BY e.id ORDER BY e.event_date DESC`;

  const events = db.prepare(query).all(...params);
  res.json(events);
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const event = db.prepare(`
    SELECT e.id, e.gym_id, e.gym_name, e.location, e.event_name, e.description,
           e.event_date, e.event_type, e.registration_link, e.price,
           e.use_divisions, e.use_age_groups, e.waiver_path,
           e.is_active, e.created_at,
           COUNT(r.id) as racer_count,
           g.gym_name as gym_display_name,
           g.stripe_account_id, g.stripe_onboarding_complete
    FROM events e
    LEFT JOIN racers r ON r.event_id = e.id
    LEFT JOIN gyms g ON g.id = e.gym_id
    WHERE e.id = ? AND e.is_active = 1
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });
  // Don't expose stripe details publicly
  const { stripe_account_id, stripe_onboarding_complete, ...publicEvent } = event;
  res.json(publicEvent);
});

// GET /api/events/:id/waiver
router.get('/:id/waiver', (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT waiver_path FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event || !event.waiver_path) return res.status(404).json({ error: 'No waiver found' });

  const waiverDir = path.join(
    path.dirname(process.env.DB_PATH || path.join(__dirname, '../db/hybrid-race.db')),
    'waivers'
  );
  const filePath = path.join(waiverDir, path.basename(event.waiver_path));

  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Waiver file not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="event-waiver.pdf"');
  fs.createReadStream(filePath).pipe(res);
});

// POST /api/events
router.post('/', gymAuth, (req, res, next) => {
  if (upload) {
    upload.single('waiver')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  const gym = req.gym;
  const {
    event_name, location, event_date, event_type, description,
    price, use_divisions, use_age_groups,
  } = req.body;

  if (!event_name || !location || !event_date || !event_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Parse and validate event types
  let typesArray;
  try {
    typesArray = parseEventType(event_type);
    if (!typesArray.length) return res.status(400).json({ error: 'Select at least one event type' });
    if (!typesArray.every(t => VALID_TYPES.includes(t))) return res.status(400).json({ error: 'Invalid event type' });
  } catch {
    return res.status(400).json({ error: 'Invalid event type' });
  }
  const typesToStore = JSON.stringify(typesArray);

  // Auto-generate 6-digit PIN
  const plainPin = Math.floor(100000 + Math.random() * 900000).toString();
  const pin_hash = await bcrypt.hash(plainPin, 10);

  const priceInCents = Math.round(parseFloat(price || 0) * 100) || 0;
  const waiverPath = req.file ? req.file.filename : null;

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO events (gym_id, gym_name, location, event_name, description, event_date, event_type,
      pin_hash, price, use_divisions, use_age_groups, waiver_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    gym.id,
    gym.gym_name,
    location.trim(),
    event_name.trim(),
    description ? description.trim() : null,
    event_date,
    typesToStore,
    pin_hash,
    priceInCents,
    use_divisions === '1' ? 1 : 0,
    use_age_groups === '1' ? 1 : 0,
    waiverPath
  );

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    event_name: event_name.trim(),
    pin: plainPin,
  });
});

// POST /api/events/:id/verify-pin
router.post('/:id/verify-pin', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  const db = getDb();
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const valid = await bcrypt.compare(String(pin), event.pin_hash);
  res.json({ valid });
});

// PUT /api/events/:id  — requires gym auth; gym must own event
router.put('/:id', gymAuth, (req, res) => {
  const { event_name, location, event_date, event_type, description } = req.body;
  const db = getDb();

  const event = db.prepare('SELECT * FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  let typesToStore = event_type;
  if (event_type) {
    try {
      const arr = parseEventType(event_type);
      if (!arr.length) return res.status(400).json({ error: 'Select at least one event type' });
      if (!arr.every(t => VALID_TYPES.includes(t))) return res.status(400).json({ error: 'Invalid event type' });
      typesToStore = JSON.stringify(arr);
    } catch {
      return res.status(400).json({ error: 'Invalid event type' });
    }
  }

  db.prepare(`
    UPDATE events SET
      location    = COALESCE(?, location),
      event_name  = COALESCE(?, event_name),
      description = COALESCE(?, description),
      event_date  = COALESCE(?, event_date),
      event_type  = COALESCE(?, event_type)
    WHERE id = ?
  `).run(location, event_name, description, event_date, typesToStore, req.params.id);

  const updated = db.prepare(`
    SELECT id, gym_id, gym_name, location, event_name, description, event_date, event_type,
           price, use_divisions, use_age_groups, is_active, created_at
    FROM events WHERE id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/events/:id  — requires gym auth
router.delete('/:id', gymAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT id, gym_id FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  db.prepare('UPDATE events SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
