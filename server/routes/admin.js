const express = require('express');
const { getDb } = require('../db/database');
const { gymAuth } = require('../middleware/gymAuth');

const router = express.Router();

function adminOnly(req, res, next) {
  if (!req.gym.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// GET /api/admin/overview
router.get('/overview', gymAuth, adminOnly, (req, res) => {
  const db = getDb();

  const gyms = db.prepare(`
    SELECT g.id, g.email, g.gym_name, g.location, g.stripe_onboarding_complete, g.created_at,
           COUNT(e.id) as event_count
    FROM gyms g
    LEFT JOIN events e ON e.gym_id = g.id AND e.is_active = 1
    WHERE g.is_admin = 0
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all();

  const events = db.prepare(`
    SELECT e.id, e.event_name, e.event_date, e.location, e.gym_id, e.gym_name, e.price,
           e.is_active, e.created_at,
           COUNT(r.id) as racer_count,
           (SELECT COUNT(*) FROM registrations reg WHERE reg.event_id = e.id AND reg.status = 'paid') as registration_count
    FROM events e
    LEFT JOIN racers r ON r.event_id = e.id
    WHERE e.is_active = 1
    GROUP BY e.id
    ORDER BY e.event_date DESC
  `).all();

  res.json({ gyms, events });
});

module.exports = router;
