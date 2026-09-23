// Single, clearly-named Cypher Quest persistence key. Two writers: App.jsx
// saves a minimal { teamName } record right after team confirmation (so a
// refresh while waiting on the event gate resumes into "waiting" without
// re-entering the name), and the progression system (useQuestProgression)
// later overwrites it with the full { teamName, quest } shape once the
// event gate unlocks and gameplay actually starts. App.jsx reads it once,
// at startup, to pick the right scene to resume into — see App.jsx.
//
// Backed by sessionStorage, not localStorage: sessionStorage is scoped to
// this one browser tab and is cleared by the browser itself when that tab
// closes, so "refresh resumes / closed-tab reopen starts fresh" falls out
// of the storage's own lifecycle — nothing here has to detect or track
// that distinction manually. A new tab (even to the same URL) always gets
// its own empty sessionStorage, so multi-tab isolation is likewise free.
const STORAGE_KEY = "cypherQuest.progress";
const VERSION = 1;

// Cypher Quest previously persisted progress to localStorage under this
// same key, which survived closing the tab/browser — exactly what this
// version no longer wants. Reading now only ever touches sessionStorage,
// so that old record can't come back on its own, but it would otherwise
// sit in the browser forever; best-effort delete it once so a leftover
// entry from before this change doesn't linger. Only this one key is
// touched — no other localStorage data is read or removed.
try {
  window.localStorage.removeItem(STORAGE_KEY);
} catch {
  // ignore — localStorage may be unavailable (private mode, disabled, etc.)
}

// Read + parse only — does NOT validate quest field shapes against
// QUEST_STEPS (that's progression-specific and lives in
// useQuestProgression.js, the module that actually knows what a valid
// puzzle id is). Returns null for anything missing/corrupted/unreadable
// rather than throwing, so a bad or stale record never crashes startup.
export function loadSession() {
  let raw;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || parsed.version !== VERSION) {
    return null;
  }

  return parsed;
}

export function saveSession(session) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, version: VERSION }));
  } catch {
    // Storage can throw (quota exceeded, private-mode restrictions, etc.).
    // Persistence is a convenience on top of gameplay, never something
    // gameplay itself depends on, so a failed write is silently ignored.
  }
}

// Called exactly where a genuinely NEW Cypher Quest session begins (the
// team-entry screen's submit handler) — never on ordinary page load,
// which is what would defeat refresh-persistence entirely.
export function clearSession() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
