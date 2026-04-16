# RaceGrid

Event management platform for hybrid fitness sim race events. Create events, register athletes, post finish times, and share live leaderboards — all in one place.

Built by **GRUB FORGE LLC**.

---

## Features

- **Create events** — gym name, location, date, event types, registration link, PIN protection
- **Register racers** — solo, doubles, and relay categories with age groups
- **Enter times** — masked HH:MM:SS input, auto-save on blur, locked fields to protect race-day results
- **Live leaderboard** — auto-ranked by time per category and age group, DNF/DNS support
- **Public browsing** — search and filter events by name, gym, location, or type

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js (v22+), Express |
| Database | SQLite via `node:sqlite` (built-in, no native deps) |
| Auth | bcryptjs PIN hashing, per-request via `X-Event-Pin` header |

---

## Local Development

### Prerequisites

- Node.js **v22 or higher** (required for `node:sqlite`)

### Setup

```bash
# Clone the repo
git clone https://github.com/JeremyGrub/hybrid-race.git
cd hybrid-race

# Install all dependencies (root + server + client)
npm run install:all
```

### Run

```bash
npm run dev
```

This starts both servers concurrently:
- **Client** → http://localhost:5173
- **API** → http://localhost:3001

The Vite dev proxy forwards `/api` requests to the Express server, so you only need to open `localhost:5173`.

### Seed data (optional)

```bash
node scripts/seed.js
```

Creates a sample event with 47 racers across all categories.

---

## Project Structure

```
hybrid-race/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── api/          # Fetch wrapper
│       ├── components/   # Shared UI components
│       └── pages/        # Route-level page components
├── server/               # Express API
│   ├── db/               # SQLite database + schema
│   ├── middleware/        # PIN auth
│   ├── routes/           # events, racers, results
│   └── utils/            # Time parsing helpers
├── scripts/              # Seed script
├── railway.json          # Railway deployment config
└── package.json          # Root scripts
```

---

## Deployment (Railway)

The app is configured to deploy as a single Railway service — Express serves both the API and the built React frontend.

### One-time setup

1. **Create service** — connect the GitHub repo in Railway; `railway.json` handles the build and start commands automatically
2. **Add a Volume** — mount at `/data` to persist the SQLite database across deploys
3. **Set environment variable**:
   ```
   DB_PATH=/data/hybrid-race.db
   ```
4. **Generate a domain** — Settings → Networking → Generate Domain

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the Express server listens on (Railway sets this automatically) |
| `DB_PATH` | `server/db/hybrid-race.db` | Path to SQLite database file — set to `/data/hybrid-race.db` on Railway |

---

## Event PINs

Each event is protected by a 4–6 digit numeric PIN set at creation time. PINs are hashed with bcrypt and never stored in plain text. There is no PIN recovery — organizers should save their PIN somewhere safe.
