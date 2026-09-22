import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { computeEventState } from "../src/services/eventService.js";

// --- Pure boundary tests (TEST1/2/3 from the feature spec) ---------------
// No env/module-caching involved — exact millisecond control over "now"
// vs. the release moment.

const EVENT_START_MS = Date.parse("2026-09-24T13:30:00+05:30");

test("before the event: status is WAITING", () => {
  const state = computeEventState(EVENT_START_MS - 1000, EVENT_START_MS);
  assert.equal(state.status, "WAITING");
  assert.ok(state.msRemaining >= 1000);
});

test("one second before release (13:29:59 IST): still WAITING", () => {
  const state = computeEventState(EVENT_START_MS - 1000, EVENT_START_MS);
  assert.equal(state.status, "WAITING");
});

test("exactly at release (13:30:00 IST): ACTIVE", () => {
  const state = computeEventState(EVENT_START_MS, EVENT_START_MS);
  assert.equal(state.status, "ACTIVE");
  assert.equal(state.msRemaining, 0);
});

test("after release: ACTIVE, msRemaining clamped to 0", () => {
  const state = computeEventState(EVENT_START_MS + 60_000, EVENT_START_MS);
  assert.equal(state.status, "ACTIVE");
  assert.equal(state.msRemaining, 0);
});

// --- Integration: the gate actually blocks /api/game/start ---------------
// Separate app instance/tmp data dir from gameplay.test.js, with the dev
// override left at "WAITING" (not set to ACTIVE like that suite) so the
// real pre-event rejection path is exercised end-to-end.

const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cypherquest-event-test-"));
process.env.DATA_DIR = tmpDataDir;
process.env.NODE_ENV = "test";
process.env.EVENT_STATE_OVERRIDE = "WAITING";

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

test("GET /api/event/state reports WAITING before release, with server time fields", async () => {
  const res = await app.inject({ method: "GET", url: "/api/event/state" });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "WAITING");
  assert.ok(body.data.serverTime);
  assert.ok(body.data.eventStartTime);
  assert.equal(typeof body.data.msRemaining, "number");
});

test("team registration still works while the event is WAITING", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/teams",
    payload: { teamName: "Team Sealed" },
  });
  assert.equal(res.statusCode, 201);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "NOT_STARTED");
});

test("POST /api/game/start is rejected with EVENT_LOCKED while WAITING, even for a real team", async () => {
  const registerRes = await app.inject({
    method: "POST",
    url: "/api/teams",
    payload: { teamName: "Team Bypass Attempt" },
  });
  const team = JSON.parse(registerRes.payload).data;

  const res = await app.inject({
    method: "POST",
    url: "/api/game/start",
    payload: { teamId: team.teamId },
  });
  assert.equal(res.statusCode, 403);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, false);
  assert.equal(body.error.code, "EVENT_LOCKED");
});

test("puzzle-complete still reports SESSION_NOT_ACTIVE (never got a session) while WAITING", async () => {
  const registerRes = await app.inject({
    method: "POST",
    url: "/api/teams",
    payload: { teamName: "Team Never Started" },
  });
  const team = JSON.parse(registerRes.payload).data;

  const res = await app.inject({
    method: "POST",
    url: "/api/game/puzzle-complete",
    payload: { teamId: team.teamId, puzzleId: "jigsaw" },
  });
  assert.equal(res.statusCode, 409);
  const body = JSON.parse(res.payload);
  assert.equal(body.error.code, "SESSION_NOT_ACTIVE");
});
