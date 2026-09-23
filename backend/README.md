# Cypher Quest Backend

A lightweight Node.js + Fastify backend that powers team registration,
game-session tracking, puzzle completion, timing, and a leaderboard for
Cypher Quest, plus data for the admin monitoring dashboard (`admin.html`).

## Install & run

```bash
cd backend
npm install
cp .env.example .env      # optional, defaults work for local dev
npm run dev                # auto-restarts on file changes (node --watch)
# or
npm start                  # plain node
```

Server listens on `http://localhost:3001` by default (`PORT` in `.env`).

## Environment variables

| Variable            | Default                 | Purpose                                                             |
| ------------------- | ------------------------ | --------------------------------------------------------------------- |
| `PORT`               | `3001`                   | HTTP port                                                             |
| `NODE_ENV`           | `development`            | `development` \| `production` \| `test`                              |
| `CORS_ORIGIN`        | `http://localhost:5173`  | Comma-separated list of allowed origins (Vite dev server)             |
| `ADMIN_RESET_TOKEN`  | (empty)                  | Required header value for `/api/admin/reset` when `NODE_ENV=production` |

See `.env.example`.

## Running tests

```bash
cd backend
npm test
```

Uses Node's built-in `node:test` + `assert`, no extra test framework. Tests
run against a throwaway temp data directory (`DATA_DIR` env override), never
against `backend/data/*.json`.

## Architecture

```
backend/
  src/
    server.js          Fastify app wiring (CORS, routes, error handler)
    config/
      env.js            Env var loading (tiny built-in .env parser)
      puzzles.js         Fixed, ordered puzzle catalog (single source of truth)
    routes/              One file per resource; thin, just binds HTTP verb+path -> controller
    controllers/         Parse request, call services, shape HTTP response
    services/
      gameplayService.js Business logic: registration, session start, puzzle
                          completion, timing, leaderboard computation
      teamRepository.js   Persistence layer for Team records (DB-SWAP POINT, see below)
    middleware/
      errorHandler.js     Central error -> HTTP response mapping
    models/
      Team.js             JSDoc type documentation for the Team/GameSession shape
    utils/
      jsonStore.js         Generic JSON-file read/write helper (atomic write via tmp+rename)
      errors.js             ApiError class + factory functions for known error codes
      id.js                  Random id generator
  data/                  Gitignored JSON persistence files (teams.json). data/.gitkeep committed.
  test/                  node:test test suite
```

Request flow: `route -> controller -> service -> repository -> JsonStore -> data/*.json`.
Controllers never touch the filesystem directly; services never touch Fastify's
request/reply objects. This keeps the persistence layer swappable (see below)
and the HTTP layer thin.

## Domain model

**Team**
```js
{
  teamId, teamName, leader, institution, registrationId, members,
  status,              // NOT_STARTED | ACTIVE | PAUSED | COMPLETED | DISCONNECTED
  currentPuzzle,       // e.g. "puzzle-03", or null when finished
  completedPuzzles,    // [{ puzzleId, completedAt (ISO), timeTakenMs }], in order
  session,             // { sessionId, startedAt (ISO), status } | null
  startedAt, finishedAt, totalTimeMs, createdAt
}
```

All timestamps are **server-generated** (`new Date().toISOString()`), never
trusted from the client. Client-sent timing (if any) is only ever a hint,
never authoritative — the API doesn't even accept an elapsed-time field.

**Puzzle catalog** — `src/config/puzzles.js` is the single source of truth
for puzzle order and IDs. It maps `puzzleId` (`puzzle-01` .. `puzzle-08`) to
the existing puzzle HTML files. Change puzzle order/identity only here.

## API reference

All responses: `{ "success": true, "data": ... }` or
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

### `GET /api/health`
```json
{ "success": true, "data": { "status": "ok", "timestamp": "2026-09-22T04:00:00.000Z" } }
```

### `POST /api/teams`
Register a team. Only `teamName` is required; re-registering the same
`teamName` returns the existing team (idempotent-ish, avoids duplicates from
retries).

Request:
```json
{ "teamName": "Ronin", "leader": "Aya", "institution": "Tsushima U" }
```
Response `201`:
```json
{ "success": true, "data": { "teamId": "team_abc123", "teamName": "Ronin", "status": "NOT_STARTED", "...": "..." } }
```
Errors: `400 VALIDATION_ERROR` if `teamName` missing/empty.

### `GET /api/teams`
List all teams (for monitoring/admin).

### `GET /api/teams/:teamId`
One team. `404 TEAM_NOT_FOUND` if unknown.

### `GET /api/teams/:teamId/progress`
```json
{
  "success": true,
  "data": {
    "teamId": "team_abc123", "teamName": "Ronin", "status": "ACTIVE",
    "currentPuzzle": "puzzle-02", "puzzlesCompleted": 1, "totalPuzzles": 8,
    "puzzles": [
      { "puzzleId": "puzzle-01", "name": "Karakuri Lock", "order": 1, "status": "COMPLETED", "completedAt": "...", "timeTakenMs": 12345 },
      { "puzzleId": "puzzle-02", "name": "Lantern Switch", "order": 2, "status": "CURRENT", "completedAt": null, "timeTakenMs": null },
      "..."
    ]
  }
}
```

### `GET /api/teams/:teamId/session`
Returns `team.session` (`{ sessionId, startedAt, status }` or `null`).

### `POST /api/game/start`
Create/activate a session for a team, set `status=ACTIVE`, `startedAt`, and
`currentPuzzle` to the first puzzle. Idempotent while already active.

Request: `{ "teamId": "team_abc123" }`
Response:
```json
{ "success": true, "data": { "teamId": "team_abc123", "status": "ACTIVE", "currentPuzzle": "puzzle-01", "session": { "sessionId": "session_xyz", "startedAt": "...", "status": "ACTIVE" }, "startedAt": "..." } }
```
Errors: `404 TEAM_NOT_FOUND`, `400 VALIDATION_ERROR`.

### `POST /api/game/puzzle-complete`
Request: `{ "teamId": "team_abc123", "puzzleId": "puzzle-01" }`

- Validates team exists, session is active, puzzle id is valid.
- Server computes `completedAt` (now) and `timeTakenMs` (now minus the
  previous puzzle's completion time, or session start for the first puzzle).
- **Idempotent**: calling this again with the same `teamId`+`puzzleId`
  returns the *original* recorded completion (`alreadyCompleted: true`) —
  it never errors and never records a duplicate.
- Level 7 (`kintsugi-shrine`) is NOT the end of the hunt. Only the terminal
  `final-treasure` step marks the team `COMPLETED`, sets `finishedAt` and
  `totalTimeMs` (`finishedAt` minus the server session start).
- `final-treasure` is rejected with `409 FINAL_NOT_UNLOCKED` unless all
  seven levels are already recorded for the team.

Response:
```json
{
  "success": true,
  "data": {
    "teamId": "team_abc123", "status": "ACTIVE", "currentPuzzle": "puzzle-02",
    "completion": { "puzzleId": "puzzle-01", "completedAt": "...", "timeTakenMs": 12345 },
    "alreadyCompleted": false, "totalTimeMs": null, "finishedAt": null
  }
}
```
Errors: `404 TEAM_NOT_FOUND`, `404 PUZZLE_NOT_FOUND`, `409 SESSION_NOT_ACTIVE`, `400 VALIDATION_ERROR`.

### `GET /api/puzzles`
Returns the fixed puzzle catalog (see `src/config/puzzles.js`).

### `GET /api/leaderboard`
```json
{
  "success": true,
  "data": {
    "completed": [
      { "rank": 1, "teamName": "Ronin", "teamId": "team_abc123", "puzzlesCompleted": 8, "totalTimeMs": 543210, "completionTimestamp": "..." }
    ],
    "active": [
      { "teamName": "Bravo", "teamId": "team_def456", "status": "ACTIVE", "puzzlesCompleted": 3, "currentPuzzle": "puzzle-04" }
    ]
  }
}
```
`completed` is sorted ascending by `totalTimeMs` (fastest first) and only
includes teams with `status=COMPLETED`. Active/paused teams are listed
separately in `active`, never mixed into the completed ranking.

### `POST /api/admin/reset` — **dev-only**
Clears all team/session data. In `development`/`test` it always works. In
`production` it requires header `x-admin-reset-token: <ADMIN_RESET_TOKEN>`
matching the configured env var, otherwise `403 FORBIDDEN`.

## Data storage & the DB-swap point

All data is stored as JSON in `backend/data/teams.json` (gitignored;
`data/.gitkeep` is committed so the folder exists). Reads/writes go through
`src/utils/jsonStore.js` (`JsonStore` class: `load()`/`save()`, atomic write
via temp-file + rename).

`src/services/teamRepository.js` is the **only** file that imports
`JsonStore`. Everything else (`gameplayService.js`, controllers, routes)
calls repository functions (`createTeam`, `findTeamById`, `updateTeam`,
`listTeams`, `resetAll`, ...) and has no idea the data lives in a JSON file.

**To migrate to Postgres/Supabase later:**
1. Reimplement each exported function in `teamRepository.js` against the
   real database (same function signatures, same return shapes).
2. Delete the `JsonStore` import/usage from that file.
3. No changes needed in `gameplayService.js`, controllers, or routes.

## How the frontend talks to this backend

`src/api/cypherQuestClient.js` (frontend) is a small fetch wrapper reading
`VITE_API_URL` (default `http://localhost:3001`). Every function catches its
own errors and resolves `{ ok: false, error }` instead of throwing — the
game UI never crashes or blocks if this backend is down.

`App.jsx`'s `startQuest()` fires `registerAndStart(teamName)`
(register + start) without awaiting it, so a slow/unreachable backend never
delays the existing blackout → game scene transition. On success, the
returned `teamId` is cached in `localStorage['cypherquest_team_id']` so the
puzzle HTML pages (below) and the client can reference it later.

### Puzzle HTML integration

The following puzzle files got a small, additive snippet inserted at their
existing win-condition code path — it posts to `/api/game/puzzle-complete`
best-effort (wrapped in try/catch, never blocks the puzzle) and also does
`window.parent.postMessage(...)` in case the puzzle is ever embedded in an
`<iframe>`:

| File                                          | Puzzle ID    | Wired? |
| ---------------------------------------------- | ------------ | ------ |
| `src/karakuri.html`                            | `puzzle-01`  | Yes |
| `src/lantern-switch.html`                      | `puzzle-02`  | Yes |
| `src/samurai-puzzle.html` / `...UPDATED.html`  | `puzzle-03`  | **No** — no clearly identifiable single win-condition function found without deeper restructuring; skipped to avoid risking breakage |
| `src/kintsugi-shrine.html`                     | `puzzle-04`  | Yes |
| `src/Theforgottenspirit.html`                  | `puzzle-05`  | Yes |
| `src/assets/threehiddendiff.html`              | `puzzle-06`  | Yes |
| `src/assets/izuhara2.html`                     | `puzzle-07`  | **No** — this file is a Leaflet map viewer with no win/solve logic at all; nothing to hook |
| `src/assets/torn-paper-treasure-puzzle.html`   | `puzzle-08`  | Yes |
| `src/assets/three_hidden_differences.html`     | n/a          | **Untouched** — explicitly out of scope (legacy/wrong file per instructions) |

Wired pages read `localStorage['cypherquest_team_id']` (same key App.jsx
writes) and POST to `window.VITE_API_URL || "http://localhost:3001"`. They
currently rely on being served from the same origin as the React app (e.g.
opened via the Vite dev server) so `localStorage` is shared; if a puzzle is
ever opened from a different origin, wiring it up would need the team id
passed explicitly (query param or postMessage) instead.

## How the admin dashboard works now

`admin.html` (project root) is unchanged in structure/CSS. It still reads
`localStorage['cypherquest_events']`/`['cypherquest_teams']`, still reacts to
the `cypherquest_admin_channel` BroadcastChannel and `storage` events, and
the "Simulate Event" button still works — this is the safe fallback "demo
mode" and keeps working if opened standalone (`file://` or without the
backend running).

Additively, it now also polls `GET /api/teams` every 3 seconds
(`http://localhost:3001` by default, override via `window.CYPHERQUEST_API_URL`
set in an inline `<script>` before this one if needed). When the backend
responds successfully, the fetched teams are transformed into the same
shape the existing render functions (`renderKPIs`, `renderMatrixTable`,
etc.) already expect and rendered — no rendering code needed to change.
When the backend is unreachable, the poll fails silently and the existing
localStorage-driven rendering (still running on its own 1.5s interval)
keeps the dashboard alive.

## Root convenience script

No new root dependency was added to avoid bloating `package.json`. Run the
two servers in two terminals:

```bash
# Terminal 1
npm run dev            # Vite dev server (frontend), from repo root

# Terminal 2
cd backend && npm run dev   # Fastify backend
```

## Deployment (Vercel frontend + Render backend)

The frontend (Vite/React) deploys fine on Vercel as a static site. The
backend can't live on Vercel as-is, though: Vercel's API routes are
stateless serverless functions with no shared disk, and this backend keeps
its state in a local JSON file (see "Data storage" above) — a serverless
instance would lose or fail to share that file between requests. So the
backend needs its own small **always-on** host instead. Render's free tier
works well for this and needs zero code changes.

### 1. Deploy the backend to Render

The repo root has a `render.yaml` blueprint already set up for this:

1. Push this repo to GitHub (if not already).
2. In the [Render dashboard](https://dashboard.render.com): **New →
   Blueprint**, point it at the repo. Render reads `render.yaml` and
   provisions a free Node web service rooted at `backend/`.
3. Once live, copy its URL — something like
   `https://cypher-quest-backend.onrender.com`.
4. Render's free tier spins down when idle and takes ~30-60s to wake up on
   the first request after a period of inactivity — the frontend/admin
   dashboard won't crash during that window (see "never throws" in
   `src/api/cypherQuestClient.js`), it'll just show stale/empty data for a
   few seconds. Fine for a hackathon-scale event; upgrade the Render plan if
   that's not acceptable.

### 2. Deploy the frontend to Vercel

1. Import the repo into Vercel (root directory = repo root, framework
   preset = Vite — auto-detected).
2. In Vercel project **Settings → Environment Variables**, add:
   - `VITE_API_URL` = the Render backend URL from step 1.
3. Deploy. Vercel bakes `VITE_API_URL` into the built JS at build time
   (`import.meta.env.VITE_API_URL` in `src/api/cypherQuestClient.js`), so
   the live game correctly talks to the live backend.

### 3. Point `admin.html` at the live backend

`admin.html` is a static file, not processed by Vite, so it can't read
`VITE_API_URL`. Open it and edit the one constant near the bottom of the
`<script>` block:

```js
const PRODUCTION_BACKEND_URL = 'https://REPLACE-ME.onrender.com';
```

Replace it with the real Render URL from step 1, commit, and redeploy.
Locally (`localhost`/`127.0.0.1`) this value is ignored — local dev always
talks to `http://localhost:3001` regardless.

### 4. Lock down CORS

Update the backend's `CORS_ORIGIN` env var (in the Render dashboard, or
`render.yaml`) to the real Vercel URL from step 2, e.g.:

```
CORS_ORIGIN=https://cypher-quest.vercel.app
```

Comma-separate multiple origins if you have a preview + production URL.
Without this, the deployed frontend's requests will be blocked by CORS.

### Result

Everyone who opens the deployed Vercel site plays against the **same**
backend, so every team's registration/progress/completion lands in the same
shared store — and every organizer who opens the deployed `admin.html`
(or its Vercel URL) sees the same live, synced dashboard, polling that one
backend every 3s. No per-browser/per-device state.
