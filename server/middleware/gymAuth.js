const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function gymAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const db = getDb();
    const gym = db.prepare(
      'SELECT id, email, gym_name, location, stripe_account_id, stripe_onboarding_complete FROM gyms WHERE id = ?'
    ).get(payload.gymId);
    if (!gym) return res.status(401).json({ error: 'Gym not found' });
    req.gym = gym;
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { gymAuth };
