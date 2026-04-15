const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

/**
 * Middleware that verifies the X-Event-Pin header against the stored hash.
 * Expects req.params.id or req.body.event_id to identify the event.
 */
async function pinAuth(req, res, next) {
  const pin = req.headers['x-event-pin'];
  if (!pin) {
    return res.status(401).json({ error: 'PIN required' });
  }

  const eventId = req.params.id || req.params.eventId || req.body?.event_id;
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' });
  }

  const db = getDb();
  const event = db.prepare('SELECT pin_hash FROM events WHERE id = ? AND is_active = 1').get(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const valid = await bcrypt.compare(String(pin), event.pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  next();
}

module.exports = { pinAuth };
