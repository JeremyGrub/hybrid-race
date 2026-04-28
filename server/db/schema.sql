CREATE TABLE IF NOT EXISTS gyms (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  email                     TEXT    NOT NULL UNIQUE,
  password_hash             TEXT    NOT NULL,
  gym_name                  TEXT    NOT NULL,
  location                  TEXT    NOT NULL,
  stripe_account_id         TEXT,
  stripe_onboarding_complete INTEGER NOT NULL DEFAULT 0,
  created_at                TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  gym_id            INTEGER REFERENCES gyms(id),
  gym_name          TEXT    NOT NULL,
  location          TEXT    NOT NULL,
  event_name        TEXT    NOT NULL,
  description       TEXT,
  event_date        TEXT    NOT NULL,
  event_type        TEXT    NOT NULL,
  registration_link TEXT,
  pin_hash          TEXT    NOT NULL,
  price             INTEGER NOT NULL DEFAULT 0,
  use_divisions     INTEGER NOT NULL DEFAULT 0,
  use_age_groups    INTEGER NOT NULL DEFAULT 0,
  waiver_path       TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS racers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name  TEXT,
  last_name   TEXT,
  team_name   TEXT,
  category    TEXT    NOT NULL,
  division    TEXT,
  age_group   TEXT,
  bib_number  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS results (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  racer_id              INTEGER NOT NULL UNIQUE REFERENCES racers(id) ON DELETE CASCADE,
  event_id              INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  finish_time           TEXT,
  finish_time_seconds   INTEGER,
  dnf                   INTEGER NOT NULL DEFAULT 0,
  dns                   INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  status            TEXT    NOT NULL DEFAULT 'pending',
  category          TEXT    NOT NULL,
  division          TEXT,
  age_group         TEXT,
  team_name         TEXT,
  athletes          TEXT    NOT NULL,
  lead_email        TEXT    NOT NULL,
  amount_paid       INTEGER,
  waiver_agreed     INTEGER NOT NULL DEFAULT 0,
  waiver_agreed_at  TEXT,
  terms_agreed      INTEGER NOT NULL DEFAULT 1,
  terms_agreed_at   TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_racers_event          ON racers(event_id);
CREATE INDEX IF NOT EXISTS idx_results_event         ON results(event_id);
CREATE INDEX IF NOT EXISTS idx_results_racer         ON results(racer_id);
CREATE INDEX IF NOT EXISTS idx_events_date           ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event   ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_session ON registrations(stripe_session_id);
