// Small, defensive fetch wrapper for talking to the Cypher Quest backend.
//
// Design goal: this client must NEVER throw an uncaught error and must
// NEVER block/slow down the game UI. Every exported function catches its
// own errors, logs a console.warn, and resolves to a safe
// `{ ok: false, error }`-shaped result so callers can simply ignore
// failures (e.g. backend not running) without any try/catch of their own.

// Strip any trailing slash(es) — VITE_API_URL is easy to typo with one
// (e.g. "https://api.example.com/"), and combined with this file's paths
// (which all start with "/api/...") a trailing slash produces a
// double-slash URL that most backends 404 on, silently breaking every
// call in a way that's invisible in the UI (this client never throws).
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json || json.success !== true) {
      const message = json?.error?.message || `Request failed with status ${res.status}`;
      console.warn(`[CypherQuestAPI] ${path} failed:`, message);
      return { ok: false, error: message };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    console.warn(`[CypherQuestAPI] ${path} unreachable:`, err?.message || err);
    return { ok: false, error: err?.message || "network error" };
  }
}

export function registerTeam(teamName, extra = {}) {
  return request("/api/teams", { method: "POST", body: { teamName, ...extra } });
}

export function startGame(teamId) {
  return request("/api/game/start", { method: "POST", body: { teamId } });
}

export function completePuzzle(teamId, puzzleId) {
  return request("/api/game/puzzle-complete", { method: "POST", body: { teamId, puzzleId } });
}

export function getTeamProgress(teamId) {
  return request(`/api/teams/${encodeURIComponent(teamId)}/progress`);
}

export function getLeaderboard() {
  return request("/api/leaderboard");
}

export function getTeams() {
  return request("/api/teams");
}

export function getPuzzleCatalog() {
  return request("/api/puzzles");
}

// Convenience: register (or re-find by name) a team and immediately start
// its game session in one call. Used by App.jsx's startQuest(). Never
// throws; safe to fire-and-forget.
export async function registerAndStart(teamName) {
  const registered = await registerTeam(teamName);
  if (!registered.ok) return registered;

  const started = await startGame(registered.data.teamId);
  if (!started.ok) return started;

  return { ok: true, data: { team: registered.data, session: started.data } };
}

const CypherQuestAPI = {
  registerTeam,
  startGame,
  completePuzzle,
  getTeamProgress,
  getLeaderboard,
  getTeams,
  getPuzzleCatalog,
  registerAndStart,
};

// Also exposed on window so standalone puzzle HTML pages (loaded outside
// the React bundle, e.g. via <iframe> or a direct <script> include) can
// call window.CypherQuestAPI.completePuzzle(teamId, puzzleId) if wired in.
if (typeof window !== "undefined") {
  window.CypherQuestAPI = CypherQuestAPI;
}

export default CypherQuestAPI;
