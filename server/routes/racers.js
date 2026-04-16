const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { pinAuth } = require('../middleware/pinAuth');

const router = express.Router();

const VALID_CATEGORIES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];
const VALID_AGE_GROUPS = ['U30', '30-39', '40-49', '50-59', '60-69', '70+'];
const VALID_DIVISIONS = ['Open', 'Pro'];

async function verifyRacerPin(db, racerId, pin) {
  const racer = db.prepare('SELECT event_id FROM racers WHERE id = ?').get(racerId);
  if (!racer) return { ok: false, status: 404, msg: 'Racer not found' };
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ?').get(racer.event_id);
  if (!event) return { ok: false, status: 404, msg: 'Event not found' };
  const valid = await bcrypt.compare(String(pin), event.pin_hash);
  return valid ? { ok: true, racer } : { ok: false, status: 401, msg: 'Invalid PIN' };
}

// GET /api/events/:id/racers
router.get('/events/:id/racers', (req, res) => {
  const db = getDb();
  const racers = db.prepare(`
    SELECT r.id, r.event_id, r.first_name, r.last_name, r.team_name,
           r.category, r.division, r.age_group, r.bib_number, r.created_at,
           res.finish_time, res.finish_time_seconds, res.dnf, res.dns
    FROM racers r
    LEFT JOIN results res ON res.racer_id = r.id
    WHERE r.event_id = ?
    ORDER BY r.category, r.age_group, r.last_name, r.first_name
  `).all(req.params.id);
  res.json(racers);
});

// POST /api/events/:id/racers
router.post('/events/:id/racers', pinAuth, (req, res) => {
  const { first_name, last_name, team_name, category, division, age_group, bib_number } = req.body;

  if (!category) return res.status(400).json({ error: 'Category is required' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (division && !VALID_DIVISIONS.includes(division)) return res.status(400).json({ error: 'Invalid division' });
  if (age_group && !VALID_AGE_GROUPS.includes(age_group)) return res.status(400).json({ error: 'Invalid age group' });

  const isTeam = ['Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'].includes(category);
  if (isTeam && !team_name) return res.status(400).json({ error: 'Team name required for this category' });
  if (!isTeam && !first_name && !last_name) return res.status(400).json({ error: 'Name required' });

  const db = getDb();
  const event = db.prepare('SELECT id FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const result = db.prepare(`
    INSERT INTO racers (event_id, first_name, last_name, team_name, category, division, age_group, bib_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    first_name || null,
    last_name || null,
    team_name || null,
    category,
    division || null,
    age_group || null,
    bib_number || null
  );

  const racer = db.prepare('SELECT * FROM racers WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(racer);
});

// PUT /api/racers/:id
router.put('/racers/:id', async (req, res) => {
  const db = getDb();
  const pin = req.headers['x-event-pin'];
  if (!pin) return res.status(401).json({ error: 'PIN required' });

  const check = await verifyRacerPin(db, req.params.id, pin);
  if (!check.ok) return res.status(check.status).json({ error: check.msg });

  const { first_name, last_name, team_name, category, division, age_group, bib_number } = req.body;

  db.prepare(`
    UPDATE racers SET
      first_name = COALESCE(?, first_name),
      last_name  = COALESCE(?, last_name),
      team_name  = COALESCE(?, team_name),
      category   = COALESCE(?, category),
      division   = COALESCE(?, division),
      age_group  = COALESCE(?, age_group),
      bib_number = COALESCE(?, bib_number)
    WHERE id = ?
  `).run(first_name, last_name, team_name, category, division, age_group, bib_number, req.params.id);

  const updated = db.prepare('SELECT * FROM racers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/racers/:id
router.delete('/racers/:id', async (req, res) => {
  const db = getDb();
  const pin = req.headers['x-event-pin'];
  if (!pin) return res.status(401).json({ error: 'PIN required' });

  const check = await verifyRacerPin(db, req.params.id, pin);
  if (!check.ok) return res.status(check.status).json({ error: check.msg });

  db.prepare('DELETE FROM racers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
