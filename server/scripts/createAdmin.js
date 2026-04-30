/**
 * Creates a RaceGrid admin account.
 * Usage: node server/scripts/createAdmin.js <email> <password>
 * Example: node server/scripts/createAdmin.js admin@racegrid.fit MySecurePassword123
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const path = require('path');
process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, '../db/hybrid-race.db');

const { getDb } = require('../db/database');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node server/scripts/createAdmin.js <email> <password>');
    process.exit(1);
  }

  if (password.length < 10) {
    console.error('Password must be at least 10 characters for admin accounts');
    process.exit(1);
  }

  const db = getDb();

  const existing = db.prepare('SELECT id, is_admin FROM gyms WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    if (existing.is_admin) {
      console.log('Admin account already exists for', email);
    } else {
      // Promote existing gym account to admin
      db.prepare('UPDATE gyms SET is_admin = 1 WHERE id = ?').run(existing.id);
      console.log('✓ Promoted existing account to admin:', email);
    }
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);
  db.prepare(
    `INSERT INTO gyms (email, password_hash, gym_name, location, is_admin)
     VALUES (?, ?, 'RaceGrid Admin', 'Internal', 1)`
  ).run(email.toLowerCase().trim(), password_hash);

  console.log('✓ Admin account created:', email);
  console.log('  Log in at /login with these credentials.');
}

main().catch(e => { console.error(e); process.exit(1); });
