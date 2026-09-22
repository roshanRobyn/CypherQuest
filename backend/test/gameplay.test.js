import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point the app at a throwaway data directory before importing anything
// that reads env config, so tests never touch backend/data/*.json.
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cypherquest-test-"));
process.env.DATA_DIR = tmpDataDir;
process.env.NODE_ENV = "test";

const { buildServer } = await import("../src/server.js");

let app;

before(async () => {
  app = buildServer();
  await app.ready();
});

after(async () => {
  await app.close();
  fs.rmSync(tmpDataDir, { recursive: true, force: true });
});

async function registerTeam(teamName) {
  const res = await app.inject({
    method: "POST",
    url: "/api/teams",
    payload: { teamName },
  });
  return JSON.parse(res.payload);
}

async function startGame(teamId) {
  const res = await app.inject({
    method: "POST",
    url: "/api/game/start",
    payload: { teamId },
  });
  return JSON.parse(res.payload);
}

async function completePuzzle(teamId, puzzleId) {
  const res = await app.inject({
    method: "POST",
    url: "/api/game/puzzle-complete",
    payload: { teamId, puzzleId },
  });
  return { status: res.statusCode, body: JSON.parse(res.payload) };
}

test("health check responds ok", async () => {
  const res = await app.inject({ method: "GET", url: "/api/health" });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "ok");
});

test("team registration creates a team with NOT_STARTED status", async () => {
  const body = await registerTeam("Team Alpha");
  assert.equal(body.success, true);
  assert.equal(body.data.teamName, "Team Alpha");
  assert.equal(body.data.status, "NOT_STARTED");
  assert.ok(body.data.teamId);
});

test("team registration rejects empty teamName", async () => {
  const res = await app.inject({ method: "POST", url: "/api/teams", payload: {} });
  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, false);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("game start activates a session and sets first puzzle", async () => {
  const { data: team } = await registerTeam("Team Bravo");
  const started = await startGame(team.teamId);
  assert.equal(started.data.status, "ACTIVE");
  assert.equal(started.data.currentPuzzle, "jigsaw");
  assert.ok(started.data.session.sessionId);
});

test("game start on unknown team returns TEAM_NOT_FOUND", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/game/start",
    payload: { teamId: "does-not-exist" },
  });
  assert.equal(res.statusCode, 404);
  const body = JSON.parse(res.payload);
  assert.equal(body.error.code, "TEAM_NOT_FOUND");
});

test("puzzle completion advances currentPuzzle and records time", async () => {
  const { data: team } = await registerTeam("Team Charlie");
  await startGame(team.teamId);

  const { status, body } = await completePuzzle(team.teamId, "jigsaw");
  assert.equal(status, 200);
  assert.equal(body.data.currentPuzzle, "karakuri");
  assert.equal(body.data.completion.puzzleId, "jigsaw");
  assert.equal(typeof body.data.completion.timeTakenMs, "number");
  assert.ok(body.data.completion.timeTakenMs >= 0);
});

test("duplicate puzzle completion is idempotent", async () => {
  const { data: team } = await registerTeam("Team Delta");
  await startGame(team.teamId);

  const first = await completePuzzle(team.teamId, "jigsaw");
  const second = await completePuzzle(team.teamId, "jigsaw");

  assert.equal(second.status, 200);
  assert.equal(second.body.data.alreadyCompleted, true);
  assert.deepEqual(second.body.data.completion, first.body.data.completion);

  const progressRes = await app.inject({
    method: "GET",
    url: `/api/teams/${team.teamId}/progress`,
  });
  const progress = JSON.parse(progressRes.payload).data;
  assert.equal(progress.puzzlesCompleted, 1);
});

test("completing puzzle for invalid team returns TEAM_NOT_FOUND", async () => {
  const { status, body } = await completePuzzle("bogus-team", "jigsaw");
  assert.equal(status, 404);
  assert.equal(body.error.code, "TEAM_NOT_FOUND");
});

test("completing invalid puzzle id returns PUZZLE_NOT_FOUND", async () => {
  const { data: team } = await registerTeam("Team Echo");
  await startGame(team.teamId);
  const { status, body } = await completePuzzle(team.teamId, "puzzle-99");
  assert.equal(status, 404);
  assert.equal(body.error.code, "PUZZLE_NOT_FOUND");
});

test("completing a puzzle without an active session returns SESSION_NOT_ACTIVE", async () => {
  const { data: team } = await registerTeam("Team Foxtrot");
  // never started
  const { status, body } = await completePuzzle(team.teamId, "jigsaw");
  assert.equal(status, 409);
  assert.equal(body.error.code, "SESSION_NOT_ACTIVE");
});

test("completing all puzzles marks team COMPLETED with totalTimeMs", async () => {
  const { data: team } = await registerTeam("Team Golf");
  await startGame(team.teamId);

  const puzzleIds = [
    "jigsaw",
    "karakuri",
    "forgotten-spirit",
    "lantern-switch",
    "samurai-puzzle",
    "three-hidden-differences",
    "kintsugi-shrine",
  ];

  let last;
  for (const id of puzzleIds) {
    last = await completePuzzle(team.teamId, id);
  }

  assert.equal(last.body.data.status, "COMPLETED");
  assert.ok(last.body.data.finishedAt);
  assert.equal(typeof last.body.data.totalTimeMs, "number");
  assert.ok(last.body.data.totalTimeMs >= 0);
});

test("leaderboard lists completed teams ranked by totalTime and separates active teams", async () => {
  const res = await app.inject({ method: "GET", url: "/api/leaderboard" });
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.completed));
  assert.ok(Array.isArray(body.data.active));

  const completedTeam = body.data.completed.find((t) => t.teamName === "Team Golf");
  assert.ok(completedTeam);
  assert.equal(completedTeam.rank, 1);

  // ranks ascending by totalTimeMs
  for (let i = 1; i < body.data.completed.length; i++) {
    assert.ok(body.data.completed[i].totalTimeMs >= body.data.completed[i - 1].totalTimeMs);
  }

  // active teams (e.g. Team Bravo/Charlie/Delta/Echo) must not appear in completed
  const activeNames = body.data.active.map((t) => t.teamName);
  assert.ok(activeNames.includes("Team Bravo"));
});

test("progress retrieval returns ordered puzzle statuses", async () => {
  const { data: team } = await registerTeam("Team Hotel");
  await startGame(team.teamId);
  await completePuzzle(team.teamId, "jigsaw");

  const res = await app.inject({
    method: "GET",
    url: `/api/teams/${team.teamId}/progress`,
  });
  const progress = JSON.parse(res.payload).data;
  assert.equal(progress.puzzles[0].status, "COMPLETED");
  assert.equal(progress.puzzles[1].status, "CURRENT");
  assert.equal(progress.puzzles[2].status, "LOCKED");
});

test("puzzle catalog endpoint returns 7 puzzles in order", async () => {
  const res = await app.inject({ method: "GET", url: "/api/puzzles" });
  const body = JSON.parse(res.payload);
  assert.equal(body.data.length, 7);
  assert.equal(body.data[0].puzzleId, "jigsaw");
});
