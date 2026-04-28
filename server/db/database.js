const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'hybrid-race.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    // Migration 1: add division column if missing
    try { db.exec('ALTER TABLE racers ADD COLUMN division TEXT'); } catch(e) { /* already exists */ }

    // Migration 2: remove NOT NULL constraint from age_group (requires table rebuild in SQLite)
    try {
      const cols = db.prepare('PRAGMA table_info(racers)').all();
      const ageCol = cols.find(c => c.name === 'age_group');
      if (ageCol && ageCol.notnull === 1) {
        db.exec('PRAGMA foreign_keys = OFF');
        db.exec('BEGIN');
        db.exec(`CREATE TABLE racers_v2 (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          first_name TEXT,
          last_name  TEXT,
          team_name  TEXT,
          category   TEXT NOT NULL,
          division   TEXT,
          age_group  TEXT,
          bib_number TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);
        db.exec('INSERT INTO racers_v2 SELECT id, event_id, first_name, last_name, team_name, category, division, age_group, bib_number, created_at FROM racers');
        db.exec('DROP TABLE racers');
        db.exec('ALTER TABLE racers_v2 RENAME TO racers');
        db.exec('CREATE INDEX IF NOT EXISTS idx_racers_event ON racers(event_id)');
        db.exec('COMMIT');
        db.exec('PRAGMA foreign_keys = ON');
      }
    } catch(e) {
      try { db.exec('ROLLBACK'); } catch(_) {}
      db.exec('PRAGMA foreign_keys = ON');
      console.error('Migration 2 error:', e.message);
    }

    // Migration 3: add gym_id to events
    try { db.exec('ALTER TABLE events ADD COLUMN gym_id INTEGER REFERENCES gyms(id)'); } catch(e) {}
    // Migration 4: add price to events
    try { db.exec('ALTER TABLE events ADD COLUMN price INTEGER NOT NULL DEFAULT 0'); } catch(e) {}
    // Migration 5: add use_divisions to events
    try { db.exec('ALTER TABLE events ADD COLUMN use_divisions INTEGER NOT NULL DEFAULT 0'); } catch(e) {}
    // Migration 6: add use_age_groups to events
    try { db.exec('ALTER TABLE events ADD COLUMN use_age_groups INTEGER NOT NULL DEFAULT 0'); } catch(e) {}
    // Migration 7: add waiver_path to events
    try { db.exec('ALTER TABLE events ADD COLUMN waiver_path TEXT'); } catch(e) {}
    // Migration 9: add waiver_name (typed e-signature) to registrations
    try { db.exec('ALTER TABLE registrations ADD COLUMN waiver_name TEXT'); } catch(e) {}
    // Migration 10: add member pricing to events
    try { db.exec('ALTER TABLE events ADD COLUMN member_code TEXT'); } catch(e) {}
    try { db.exec('ALTER TABLE events ADD COLUMN member_price INTEGER'); } catch(e) {}
    // Migration 11: waves and wave_racers tables
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS waves (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id       INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name           TEXT    NOT NULL,
        scheduled_time TEXT,
        started_at     TEXT,
        created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS wave_racers (
        wave_id   INTEGER NOT NULL REFERENCES waves(id) ON DELETE CASCADE,
        racer_id  INTEGER NOT NULL REFERENCES racers(id) ON DELETE CASCADE,
        PRIMARY KEY (wave_id, racer_id)
      )`);
      db.exec('CREATE INDEX IF NOT EXISTS idx_waves_event ON waves(event_id)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_wave_racers_wave ON wave_racers(wave_id)');
    } catch(e) { console.error('Migration 11 error:', e.message); }
    // Migration 8: fix events incorrectly stored with use_divisions/use_age_groups=1 due to FormData string bug
    try {
      const hasMig8 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
      if (!hasMig8) {
        db.exec("CREATE TABLE _migrations (name TEXT PRIMARY KEY)");
      }
      const alreadyRan = db.prepare("SELECT name FROM _migrations WHERE name='fix_divisions_flags'").get();
      if (!alreadyRan) {
        db.exec('UPDATE events SET use_divisions = 0, use_age_groups = 0');
        db.prepare("INSERT INTO _migrations (name) VALUES (?)").run('fix_divisions_flags');
      }
    } catch(e) { console.error('Migration 8 error:', e.message); }
  }
  return db;
}

module.exports = { getDb };
