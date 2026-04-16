const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { parseTimeToSeconds, normalizeTime } = require('../utils/timeUtils');

const router = express.Router();

async function verifyEventPin(db, eventId, pin) {
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ?').get(eventId);
  if (!event) return false;
  return bcrypt.compare(String(pin), event.pin_hash);
}

async function verifyRacerPin(db, racerId, pin) {
  const racer = db.prepare('SELECT event_id FROM racers WHERE id = ?').get(racerId);
  if (!racer) return null;
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ?').get(racer.event_id);
  if (!event) return null;
  const valid = await bcrypt.compare(String(pin), event.pin_hash);
  return valid ? racer : null;
}

// GET /api/events/:id/results
router.get('/events/:id/results', (req, res) => {
  const { category, division, age_group } = req.query;
  const db = getDb();

  let query = `
    SELECT
      r.id, r.first_name, r.last_name, r.team_name,
      r.category, r.division, r.age_group, r.bib_number,
      res.finish_time, res.finish_time_seconds,
      COALESCE(res.dnf, 0) as dnf,
      COALESCE(res.dns, 0) as dns
    FROM racers r
    LEFT JOIN results res ON res.racer_id = r.id
    WHERE r.event_id = ?
  `;
  const params = [req.params.id];

  if (category) { query += ` AND r.category = ?`; params.push(category); }
  if (division) { query += ` AND r.division = ?`; params.push(division); }
  if (age_group) { query += ` AND r.age_group = ?`; params.push(age_group); }

  query += `
    ORDER BY
      CASE WHEN res.dnf = 1 OR res.dns = 1 OR res.finish_time_seconds IS NULL THEN 1 ELSE 0 END,
      res.finish_time_seconds ASC,
      r.last_name, r.first_name
  `;

  const racers = db.prepare(query).all(...params);

  // Assign rank per category+division+age_group
  const counters = {};
  racers.forEach(r => {
    const key = `${r.category}||${r.division||''}||${r.age_group||''}`;
    if (!counters[key]) counters[key] = 0;
    if (r.finish_time_seconds !== null && !r.dnf && !r.dns) {
      counters[key]++;
      r.rank = counters[key];
    } else {
      r.rank = null;
    }
  });

  res.json(racers);
});

// PUT /api/racers/:id/result
router.put('/racers/:id/result', async (req, res) => {
  const db = getDb();
  const pin = req.headers['x-event-pin'];
  if (!pin) return res.status(401).json({ error: 'PIN required' });

  const racer = await verifyRacerPin(db, req.params.id, pin);
  if (!racer) return res.status(401).json({ error: 'Invalid PIN or racer not found' });

  const { finish_time, dnf, dns } = req.body;

  let finish_time_normalized = null;
  let finish_time_seconds = null;

  if (finish_time && !dnf && !dns) {
    finish_time_seconds = parseTimeToSeconds(finish_time);
    if (finish_time_seconds === null) {
      return res.status(400).json({ error: 'Invalid time format. Use MM:SS or HH:MM:SS' });
    }
    finish_time_normalized = normalizeTime(finish_time);
  }

  const existing = db.prepare('SELECT id FROM results WHERE racer_id = ?').get(req.params.id);
  if (existing) {
    db.prepare(`
      UPDATE results SET
        finish_time = ?,
        finish_time_seconds = ?,
        dnf = ?,
        dns = ?,
        updated_at = datetime('now')
      WHERE racer_id = ?
    `).run(finish_time_normalized, finish_time_seconds, dnf ? 1 : 0, dns ? 1 : 0, req.params.id);
  } else {
    db.prepare(`
      INSERT INTO results (racer_id, event_id, finish_time, finish_time_seconds, dnf, dns)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, racer.event_id, finish_time_normalized, finish_time_seconds, dnf ? 1 : 0, dns ? 1 : 0);
  }

  const result = db.prepare('SELECT * FROM results WHERE racer_id = ?').get(req.params.id);
  res.json(result);
});

// POST /api/events/:id/results/bulk
router.post('/events/:id/results/bulk', async (req, res) => {
  const pin = req.headers['x-event-pin'];
  if (!pin) return res.status(401).json({ error: 'PIN required' });

  const db = getDb();
  const valid = await verifyEventPin(db, req.params.id, pin);
  if (!valid) return res.status(401).json({ error: 'Invalid PIN' });

  const { results } = req.body;
  if (!Array.isArray(results)) return res.status(400).json({ error: 'results must be an array' });

  const errors = [];

  db.exec('BEGIN');
  try {
    for (const item of results) {
      const { racer_id, finish_time, dnf, dns } = item;
      const racer = db.prepare('SELECT event_id FROM racers WHERE id = ?').get(racer_id);
      if (!racer || String(racer.event_id) !== String(req.params.id)) {
        errors.push({ racer_id, error: 'Racer not found in this event' });
        continue;
      }

      let finish_time_normalized = null;
      let finish_time_seconds = null;

      if (finish_time && !dnf && !dns) {
        finish_time_seconds = parseTimeToSeconds(finish_time);
        if (finish_time_seconds === null) {
          errors.push({ racer_id, error: 'Invalid time format' });
          continue;
        }
        finish_time_normalized = normalizeTime(finish_time);
      }

      const existing = db.prepare('SELECT id FROM results WHERE racer_id = ?').get(racer_id);
      if (existing) {
        db.prepare(`
          UPDATE results SET finish_time=?, finish_time_seconds=?, dnf=?, dns=?, updated_at=datetime('now')
          WHERE racer_id=?
        `).run(finish_time_normalized, finish_time_seconds, dnf ? 1 : 0, dns ? 1 : 0, racer_id);
      } else {
        db.prepare(`
          INSERT INTO results (racer_id, event_id, finish_time, finish_time_seconds, dnf, dns)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(racer_id, req.params.id, finish_time_normalized, finish_time_seconds, dnf ? 1 : 0, dns ? 1 : 0);
      }
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: e.message });
  }

  res.json({ success: true, errors: errors.length ? errors : undefined });
});

module.exports = router;
