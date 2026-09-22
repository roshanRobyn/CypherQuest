import { JsonStore } from "../utils/jsonStore.js";
import { generateId } from "../utils/id.js";

/**
 * Team repository — abstracts persistence for Team + GameSession records.
 *
 * DB-SWAP POINT: everything outside this file (controllers/services) talks
 * to teams through the functions exported here. To move to Postgres/
 * Supabase later, reimplement this file's exported functions against the
 * real database and delete the JsonStore usage — no other file needs to
 * change. See backend/README.md "Migrating to a real DB" for a walkthrough.
 */

const store = new JsonStore("teams.json", { teams: [], nextTeamNumber: 1 });

function readAll() {
  const data = store.load();
  if (!Array.isArray(data.teams)) data.teams = [];
  if (typeof data.nextTeamNumber !== "number") data.nextTeamNumber = 1;
  return data;
}

function writeAll(data) {
  store.save(data);
}

export function createTeam({ teamName, leader, institution, registrationId, members }) {
  const data = readAll();

  // Human-facing, sequential team number (Team 1, Team 2, ...), assigned
  // once at registration and never reused — kept separate from teamId
  // (the opaque internal id) so organizers can read a short, unambiguous
  // label instead of whatever free-text name a team typed in.
  const teamNumber = data.nextTeamNumber;
  data.nextTeamNumber = teamNumber + 1;

  const team = {
    teamId: generateId("team"),
    teamNumber,
    teamName,
    leader: leader ?? null,
    institution: institution ?? null,
    registrationId: registrationId ?? null,
    members: Array.isArray(members) ? members : [],
    status: "NOT_STARTED",
    currentPuzzle: null,
    completedPuzzles: [], // [{ puzzleId, completedAt, timeTakenMs }]
    session: null, // { sessionId, startedAt, status }
    startedAt: null,
    finishedAt: null,
    totalTimeMs: null,
    createdAt: new Date().toISOString(),
  };

  data.teams.push(team);
  writeAll(data);
  return team;
}

export function listTeams() {
  return readAll().teams;
}

export function findTeamById(teamId) {
  return readAll().teams.find((t) => t.teamId === teamId) || null;
}

export function findTeamByName(teamName) {
  return (
    readAll().teams.find(
      (t) => t.teamName.toLowerCase() === String(teamName).toLowerCase()
    ) || null
  );
}

export function updateTeam(teamId, updater) {
  const data = readAll();
  const idx = data.teams.findIndex((t) => t.teamId === teamId);
  if (idx === -1) return null;
  const updated = updater(data.teams[idx]);
  data.teams[idx] = updated;
  writeAll(data);
  return updated;
}

export function resetAll() {
  writeAll({ teams: [], nextTeamNumber: 1 });
}
