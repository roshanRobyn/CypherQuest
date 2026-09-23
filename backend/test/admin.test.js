import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Runs the admin endpoints under NODE_ENV=production so the real
// x-admin-reset-token check is exercised (it is skipped outside production).
// The event start is set in the past so /api/game/start is accepted.
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cypherquest-admin-test-"));
process.env.DATA_DIR = tmpDataDir;
process.env.NODE_ENV = "production";
process.env.ADMIN_RESET_TOKEN = "test-admin-token";
process.env.EVENT_START_AT = "2000-01-01T00:00:00Z";

const { buildServer } = await import("../src/server.js");

const TOKEN = { "x-admin-reset-token": "test-admin-token" };
const LEVEL_PUZZLE_IDS = [
  "jigsaw",
  "karakuri",
  "forgotten-spirit",
  "lantern-switch",
  "samurai-puzzle",
  "three-hidden-differences",
  "kintsugi-shrine",
];

let app;

before(async () => {
  app = buildServer();
  await app.ready();
});

after(async () => {
  await app.close();
  fs.rmSync(tmpDataDir, { recursive: true, force: true });
});

async function call(method, url, { payload, headers } = {}) {
  const res = await app.inject({ method, url, payload, headers });
  return { status: res.statusCode, body: JSON.parse(res.payload) };
}

async function createTeam(teamName, puzzleIds) {
  const { body } = await call("POST", "/api/teams", { payload: { teamName } });
  const teamId = body.data.teamId;
  await call("POST", "/api/game/start", { payload: { teamId } });
  for (const puzzleId of puzzleIds) {
    await call("POST", "/api/game/puzzle-complete", { payload: { teamId, puzzleId } });
  }
  return teamId;
}

const listTeams = async () => (await call("GET", "/api/teams")).body.data;
const getLeaderboard = async () => (await call("GET", "/api/leaderboard")).body.data;
const removeTeam = (teamId, headers) =>
  call("DELETE", `/api/admin/teams/${encodeURIComponent(teamId)}`, { headers });

let teamA;
let teamB;
let teamC;

test("setup: completed, in-progress and early teams", async () => {
  teamA = await createTeam("Team A", [...LEVEL_PUZZLE_IDS, "final-treasure"]);
  teamB = await createTeam("Team B", LEVEL_PUZZLE_IDS.slice(0, 4));
  teamC = await createTeam("Team C", LEVEL_PUZZLE_IDS.slice(0, 2));

  const teams = await listTeams();
  assert.equal(teams.length, 3);
  assert.equal(teams.find((t) => t.teamId === teamA).status, "COMPLETED");
});

test("team removal without the admin token is rejected and deletes nothing", async () => {
  const before = await listTeams();

  const noToken = await removeTeam(teamB);
  assert.equal(noToken.status, 403);
  assert.equal(noToken.body.error.code, "FORBIDDEN");

  const wrongToken = await removeTeam(teamB, { "x-admin-reset-token": "nope" });
  assert.equal(wrongToken.status, 403);

  assert.deepEqual(await listTeams(), before);
});

test("removing an in-progress team deletes only that team", async () => {
  const before = await listTeams();

  const res = await removeTeam(teamB, TOKEN);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, { teamId: teamB, teamName: "Team B", removed: true });

  const after = await listTeams();
  assert.equal(after.length, 2);
  assert.equal(after.find((t) => t.teamId === teamB), undefined);
  // Team A and Team C are byte-for-byte unchanged.
  assert.deepEqual(after, before.filter((t) => t.teamId !== teamB));

  assert.equal((await call("GET", `/api/teams/${teamB}`)).status, 404);
  assert.equal((await call("GET", `/api/teams/${teamB}/progress`)).status, 404);
  assert.equal((await call("GET", `/api/teams/${teamB}/session`)).status, 404);

  const board = await getLeaderboard();
  assert.equal(board.active.some((t) => t.teamId === teamB), false);
  assert.equal(board.active.some((t) => t.teamId === teamC), true);
});

test("a stale browser of a removed team cannot modify any team", async () => {
  const before = await listTeams();

  const complete = await call("POST", "/api/game/puzzle-complete", {
    payload: { teamId: teamB, puzzleId: "samurai-puzzle" },
  });
  assert.equal(complete.status, 404);
  assert.equal(complete.body.error.code, "TEAM_NOT_FOUND");

  const start = await call("POST", "/api/game/start", { payload: { teamId: teamB } });
  assert.equal(start.status, 404);
  assert.equal(start.body.error.code, "TEAM_NOT_FOUND");

  assert.deepEqual(await listTeams(), before);
});

test("removing a completed team removes its Final Treasure completion and leaderboard entry", async () => {
  assert.equal((await getLeaderboard()).completed.some((t) => t.teamId === teamA), true);

  const res = await removeTeam(teamA, TOKEN);
  assert.equal(res.status, 200);

  const teams = await listTeams();
  assert.deepEqual(
    teams.map((t) => t.teamId),
    [teamC]
  );
  const board = await getLeaderboard();
  assert.equal(board.completed.length, 0);
  assert.equal(board.completed.some((t) => t.teamId === teamA), false);
});

test("removing an unknown or already-removed team returns TEAM_NOT_FOUND", async () => {
  const res = await removeTeam(teamA, TOKEN);
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "TEAM_NOT_FOUND");
  assert.equal((await listTeams()).length, 1);
});

test("re-registering a removed team's name creates a new team, never reusing its id or number", async () => {
  const { body } = await call("POST", "/api/teams", { payload: { teamName: "Team B" } });
  assert.notEqual(body.data.teamId, teamB);
  assert.equal(body.data.teamNumber, 4);
  assert.equal(body.data.status, "NOT_STARTED");
  assert.deepEqual(body.data.completedPuzzles, []);
});

test("reset still requires the admin token in production", async () => {
  const denied = await call("POST", "/api/admin/reset");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, "FORBIDDEN");
  assert.equal((await listTeams()).length, 2);

  const ok = await call("POST", "/api/admin/reset", { headers: TOKEN });
  assert.equal(ok.status, 200);
  assert.equal((await listTeams()).length, 0);
});
