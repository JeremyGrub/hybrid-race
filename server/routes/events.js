const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { pinAuth } = require('../middleware/pinAuth');

const router = express.Router();

// GET /api/events
router.get('/', (req, res) => {
  const { search, type, date } = req.query;
  const db = getDb();

  let query = `
    SELECT e.id, e.gym_name, e.location, e.event_name, e.description,
           e.event_date, e.event_type, e.is_active, e.created_at,
           COUNT(r.id) as racer_count
    FROM events e
    LEFT JOIN racers r ON r.event_id = e.id
    WHERE e.is_active = 1
  `;
  const params = [];

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
    SELECT e.id, e.gym_name, e.location, e.event_name, e.description,
           e.event_date, e.event_type, e.is_active, e.created_at,
           COUNT(r.id) as racer_count
    FROM events e
    LEFT JOIN racers r ON r.event_id = e.id
    WHERE e.id = ? AND e.is_active = 1
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/events
router.post('/', async (req, res) => {
  const { gym_name, location, event_name, description, event_date, event_type, pin } = req.body;

  if (!gym_name || !location || !event_name || !event_date || !event_type || !pin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (String(pin).length < 4 || String(pin).length > 6) {
    return res.status(400).json({ error: 'PIN must be 4-6 digits' });
  }
  if (!/^\d+$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be numeric' });
  }
  const validTypes = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];
  let typesToStore = event_type;
  // Accept either a JSON array string or a plain string
  try {
    const parsed = typeof event_type === 'string' ? JSON.parse(event_type) : event_type;
    if (Array.isArray(parsed)) {
      if (!parsed.length) return res.status(400).json({ error: 'Select at least one event type' });
      if (!parsed.every(t => validTypes.includes(t))) return res.status(400).json({ error: 'Invalid event type' });
      typesToStore = JSON.stringify(parsed);
    } else {
      if (!validTypes.includes(parsed)) return res.status(400).json({ error: 'Invalid event type' });
      typesToStore = JSON.stringify([parsed]);
    }
  } catch {
    if (!validTypes.includes(event_type)) return res.status(400).json({ error: 'Invalid event type' });
    typesToStore = JSON.stringify([event_type]);
  }

  const pin_hash = await bcrypt.hash(String(pin), 10);
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO events (gym_name, location, event_name, description, event_date, event_type, pin_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(gym_name, location, event_name, description || null, event_date, typesToStore, pin_hash);

  res.status(201).json({ id: Number(result.lastInsertRowid), event_name });
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

// PUT /api/events/:id
router.put('/:id', pinAuth, (req, res) => {
  const { gym_name, location, event_name, description, event_date, event_type } = req.body;
  const db = getDb();

  const event = db.prepare('SELECT * FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  db.prepare(`
    UPDATE events SET
      gym_name    = COALESCE(?, gym_name),
      location    = COALESCE(?, location),
      event_name  = COALESCE(?, event_name),
      description = COALESCE(?, description),
      event_date  = COALESCE(?, event_date),
      event_type  = COALESCE(?, event_type)
    WHERE id = ?
  `).run(gym_name, location, event_name, description, event_date, event_type, req.params.id);

  const updated = db.prepare(`
    SELECT id, gym_name, location, event_name, description, event_date, event_type, is_active, created_at
    FROM events WHERE id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/events/:id
router.delete('/:id', pinAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE events SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
