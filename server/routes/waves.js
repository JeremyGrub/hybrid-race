const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { gymAuth } = require('../middleware/gymAuth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function validatePin(eventId, pin) {
  if (!pin) return false;
  const db = getDb();
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ? AND is_active = 1').get(eventId);
  if (!event) return false;
  return bcrypt.compare(String(pin), event.pin_hash);
}

function getWaveWithRacers(db, waveId) {
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(waveId);
  if (!wave) return null;
  wave.racers = db.prepare(`
    SELECT r.id, r.first_name, r.last_name, r.team_name, r.category, r.division, r.age_group, r.bib_number,
           res.finish_time, res.finish_time_seconds, res.dnf, res.dns
    FROM wave_racers wr
    JOIN racers r ON r.id = wr.racer_id
    LEFT JOIN results res ON res.racer_id = r.id
    WHERE wr.wave_id = ?
    ORDER BY r.last_name, r.first_name, r.team_name
  `).all(waveId);
  return wave;
}

function formatElapsedSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── Setup routes (gymAuth) ────────────────────────────────────────────────────

// GET /api/events/:id/waves
router.get('/events/:id/waves', gymAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT id, gym_id FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  const waves = db.prepare('SELECT * FROM waves WHERE event_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(waves.map(w => getWaveWithRacers(db, w.id)));
});

// POST /api/events/:id/waves
router.post('/events/:id/waves', gymAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT id, gym_id FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  const { name, scheduled_time } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Wave name required' });

  const result = db.prepare(
    'INSERT INTO waves (event_id, name, scheduled_time) VALUES (?, ?, ?)'
  ).run(req.params.id, name.trim(), scheduled_time || null);

  res.status(201).json(getWaveWithRacers(db, Number(result.lastInsertRowid)));
});

// PUT /api/waves/:id
router.put('/waves/:id', gymAuth, (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  const event = db.prepare('SELECT gym_id FROM events WHERE id = ?').get(wave.event_id);
  if (!event || event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  const { name, scheduled_time } = req.body;
  db.prepare('UPDATE waves SET name = COALESCE(?, name), scheduled_time = ? WHERE id = ?')
    .run(name?.trim() || null, scheduled_time ?? wave.scheduled_time, wave.id);

  res.json(getWaveWithRacers(db, wave.id));
});

// DELETE /api/waves/:id
router.delete('/waves/:id', gymAuth, (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  const event = db.prepare('SELECT gym_id FROM events WHERE id = ?').get(wave.event_id);
  if (!event || event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  db.prepare('DELETE FROM waves WHERE id = ?').run(wave.id);
  res.json({ success: true });
});

// POST /api/waves/:id/racers
router.post('/waves/:id/racers', gymAuth, (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  const event = db.prepare('SELECT gym_id FROM events WHERE id = ?').get(wave.event_id);
  if (!event || event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  const { racer_id } = req.body;
  if (!racer_id) return res.status(400).json({ error: 'racer_id required' });

  try {
    db.prepare('INSERT INTO wave_racers (wave_id, racer_id) VALUES (?, ?)').run(wave.id, racer_id);
  } catch { /* already assigned, ignore */ }

  res.json(getWaveWithRacers(db, wave.id));
});

// DELETE /api/waves/:id/racers/:racerId
router.delete('/waves/:id/racers/:racerId', gymAuth, (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  const event = db.prepare('SELECT gym_id FROM events WHERE id = ?').get(wave.event_id);
  if (!event || event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  db.prepare('DELETE FROM wave_racers WHERE wave_id = ? AND racer_id = ?').run(wave.id, req.params.racerId);
  res.json(getWaveWithRacers(db, wave.id));
});

// ── Race day routes (PIN auth) ────────────────────────────────────────────────

// GET /api/events/:id/waves/raceday  — load all waves + racer results for timing view
router.get('/events/:id/waves/raceday', async (req, res) => {
  const pin = req.headers['x-event-pin'];
  const valid = await validatePin(req.params.id, pin);
  if (!valid) return res.status(403).json({ error: 'Invalid PIN' });

  const db = getDb();
  const waves = db.prepare('SELECT * FROM waves WHERE event_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(waves.map(w => getWaveWithRacers(db, w.id)));
});

// POST /api/waves/:id/start  — start a wave, record server timestamp
router.post('/waves/:id/start', async (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });

  const pin = req.headers['x-event-pin'];
  const valid = await validatePin(wave.event_id, pin);
  if (!valid) return res.status(403).json({ error: 'Invalid PIN' });

  // Idempotent — return existing start time if already started
  if (wave.started_at) return res.json({ started_at: wave.started_at, already_started: true });

  const startedAt = new Date().toISOString();
  db.prepare('UPDATE waves SET started_at = ? WHERE id = ?').run(startedAt, wave.id);
  res.json({ started_at: startedAt });
});

// POST /api/waves/:id/racers/:racerId/finish  — stop athlete timer, save result
router.post('/waves/:id/racers/:racerId/finish', async (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  if (!wave.started_at) return res.status(400).json({ error: 'Wave not started yet' });

  const pin = req.headers['x-event-pin'];
  const valid = await validatePin(wave.event_id, pin);
  if (!valid) return res.status(403).json({ error: 'Invalid PIN' });

  const racerId = req.params.racerId;
  const inWave = db.prepare('SELECT 1 FROM wave_racers WHERE wave_id = ? AND racer_id = ?').get(wave.id, racerId);
  if (!inWave) return res.status(400).json({ error: 'Racer not in this wave' });

  const elapsedMs = Date.now() - new Date(wave.started_at).getTime();
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const finishTime = formatElapsedSeconds(totalSeconds);

  const racer = db.prepare('SELECT event_id FROM racers WHERE id = ?').get(racerId);
  if (!racer) return res.status(404).json({ error: 'Racer not found' });

  const existing = db.prepare('SELECT id FROM results WHERE racer_id = ?').get(racerId);
  if (existing) {
    db.prepare(`UPDATE results SET finish_time = ?, finish_time_seconds = ?, dnf = 0, dns = 0,
                updated_at = ? WHERE racer_id = ?`)
      .run(finishTime, totalSeconds, new Date().toISOString(), racerId);
  } else {
    db.prepare(`INSERT INTO results (racer_id, event_id, finish_time, finish_time_seconds, updated_at)
                VALUES (?, ?, ?, ?, ?)`)
      .run(racerId, racer.event_id, finishTime, totalSeconds, new Date().toISOString());
  }

  res.json({ finish_time: finishTime, finish_time_seconds: totalSeconds });
});

// POST /api/waves/:id/reset-start  — clear started_at (emergency reset, gymAuth only)
router.post('/waves/:id/reset-start', gymAuth, (req, res) => {
  const db = getDb();
  const wave = db.prepare('SELECT * FROM waves WHERE id = ?').get(req.params.id);
  if (!wave) return res.status(404).json({ error: 'Wave not found' });
  const event = db.prepare('SELECT gym_id FROM events WHERE id = ?').get(wave.event_id);
  if (!event || event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  db.prepare('UPDATE waves SET started_at = NULL WHERE id = ?').run(wave.id);
  res.json({ success: true });
});

module.exports = router;
