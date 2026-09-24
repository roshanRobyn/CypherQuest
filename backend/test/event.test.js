import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { computeEventState, computeHuntState, resolveHuntEndMs } from "../src/services/eventService.js";

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

// --- Hunt-timer pure boundary tests (TEST 6/9/12 from the feature spec) --

const HUNT_START_MS = Date.parse("2026-09-23T00:25:00+05:30");
const HUNT_END_MS = Date.parse("2026-09-23T00:35:00+05:30");

test("before hunt start: PENDING, huntMsRemaining is the full window", () => {
  const state = computeHuntState(HUNT_START_MS - 60_000, HUNT_START_MS, HUNT_END_MS);
  assert.equal(state.huntStatus, "PENDING");
  assert.equal(state.huntMsRemaining, HUNT_END_MS - (HUNT_START_MS - 60_000));
});

test("exactly at hunt start: ACTIVE", () => {
  const state = computeHuntState(HUNT_START_MS, HUNT_START_MS, HUNT_END_MS);
  assert.equal(state.huntStatus, "ACTIVE");
});

test("one second before hunt end: still ACTIVE", () => {
  const state = computeHuntState(HUNT_END_MS - 1000, HUNT_START_MS, HUNT_END_MS);
  assert.equal(state.huntStatus, "ACTIVE");
  assert.ok(state.huntMsRemaining >= 1000);
});

test("exactly at hunt end: EXPIRED, huntMsRemaining is 0", () => {
  const state = computeHuntState(HUNT_END_MS, HUNT_START_MS, HUNT_END_MS);
  assert.equal(state.huntStatus, "EXPIRED");
  assert.equal(state.huntMsRemaining, 0);
});

test("after hunt end: EXPIRED, huntMsRemaining clamped to 0", () => {
  const state = computeHuntState(HUNT_END_MS + 60_000, HUNT_START_MS, HUNT_END_MS);
  assert.equal(state.huntStatus, "EXPIRED");
  assert.equal(state.huntMsRemaining, 0);
});

// --- resolveHuntEndMs: the dev-override production-inertness guarantee ---
// The specific thing this feature promises: HUNT_END_AT_DEV_OVERRIDE must
// be a no-op in production, not just "gitignored by convention".

const REAL_END = "2026-09-24T15:00:00+05:30";
const DEV_OVERRIDE_END = "2026-09-23T10:04:00+05:30";

test("dev override honored outside production", () => {
  const ms = resolveHuntEndMs({
    huntEndAt: REAL_END,
    huntEndAtDevOverride: DEV_OVERRIDE_END,
    isProduction: false,
  });
  assert.equal(ms, Date.parse(DEV_OVERRIDE_END));
});

test("dev override ignored in production even when set", () => {
  const ms = resolveHuntEndMs({
    huntEndAt: REAL_END,
    huntEndAtDevOverride: DEV_OVERRIDE_END,
    isProduction: true,
  });
  assert.equal(ms, Date.parse(REAL_END));
});

test("empty override falls through to the real value outside production too", () => {
  const ms = resolveHuntEndMs({ huntEndAt: REAL_END, huntEndAtDevOverride: "", isProduction: false });
  assert.equal(ms, Date.parse(REAL_END));
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

test("GET /api/event/state reports the server-clock gate state with server time fields", async () => {
  const res = await app.inject({ method: "GET", url: "/api/event/state" });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  // Compared against the server's own clock, so this holds before and after
  // the configured start (env is loaded before this file sets any override).
  const expected =
    Date.parse(body.data.serverTime) >= Date.parse(body.data.eventStartTime) ? "ACTIVE" : "WAITING";
  assert.equal(body.data.status, expected);
  assert.ok(body.data.serverTime);
  assert.ok(body.data.eventStartTime);
  assert.equal(typeof body.data.msRemaining, "number");

  // Hunt-timer fields ride the same response/poll (see eventService.js).
  assert.ok(["PENDING", "ACTIVE", "EXPIRED"].includes(body.data.huntStatus));
  assert.ok(body.data.huntStartTime);
  assert.ok(body.data.huntEndTime);
  assert.equal(typeof body.data.huntMsRemaining, "number");
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

test("POST /api/game/start is allowed even while the event state is WAITING (gameplay is always open)", async () => {
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
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.payload);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "ACTIVE");
  assert.ok(body.data.startedAt);
});

test("puzzle-complete still reports SESSION_NOT_ACTIVE for a team that never started", async () => {
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
