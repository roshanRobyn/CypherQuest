import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Admin control of the event start, under NODE_ENV=production so the real
// token check runs. The configured start is far in the future, so the
// event is WAITING until an admin override says otherwise.
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cypherquest-event-start-test-"));
process.env.DATA_DIR = tmpDataDir;
process.env.NODE_ENV = "production";
process.env.ADMIN_RESET_TOKEN = "test-admin-token";
process.env.EVENT_START_AT = "2099-01-01T13:30:00+05:30";

const { buildServer } = await import("../src/server.js");

const TOKEN = { "x-admin-reset-token": "test-admin-token" };
const CONFIGURED = new Date("2099-01-01T13:30:00+05:30").toISOString();

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

const getState = async () => (await call("GET", "/api/event/state")).body.data;
const setStart = (eventStartAt, headers = TOKEN) =>
  call("POST", "/api/admin/event-start", { payload: { eventStartAt }, headers });

test("without an override the configured start is authoritative", async () => {
  const state = await getState();
  assert.equal(state.status, "WAITING");
  assert.equal(state.eventStartSource, "config");
  assert.equal(state.eventStartTime, CONFIGURED);
  assert.equal(state.configuredEventStartTime, CONFIGURED);
});

test("changing the start requires the admin token", async () => {
  const noToken = await setStart("2098-01-01T10:00:00+05:30", {});
  assert.equal(noToken.status, 403);
  assert.equal(noToken.body.error.code, "FORBIDDEN");

  const wrong = await setStart("2098-01-01T10:00:00+05:30", { "x-admin-reset-token": "nope" });
  assert.equal(wrong.status, 403);

  assert.equal((await getState()).eventStartSource, "config");
});

test("values without an explicit timezone, invalid dates or a missing field are rejected", async () => {
  for (const bad of ["2098-01-01T10:00", "2098-01-01T10:00:00", "tomorrow", "2098-13-45T99:00:00Z", 12345]) {
    const res = await setStart(bad);
    assert.equal(res.status, 400, `expected 400 for ${bad}`);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  }
  const missing = await call("POST", "/api/admin/event-start", { payload: {}, headers: TOKEN });
  assert.equal(missing.status, 400);

  assert.equal((await getState()).eventStartSource, "config");
});

test("an admin override moves the backend gate; the event stays locked until then", async () => {
  const res = await setStart("2098-06-01T09:15:00+05:30");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.eventStartSource, "admin");
  assert.equal(res.body.data.eventStartTime, new Date("2098-06-01T09:15:00+05:30").toISOString());
  assert.equal(res.body.data.configuredEventStartTime, CONFIGURED);
  assert.equal(res.body.data.status, "WAITING");

  const { body: team } = await call("POST", "/api/teams", { payload: { teamName: "Early Team" } });
  const start = await call("POST", "/api/game/start", { payload: { teamId: team.data.teamId } });
  assert.equal(start.status, 403);
  assert.equal(start.body.error.code, "EVENT_LOCKED");

  const stored = JSON.parse(fs.readFileSync(path.join(tmpDataDir, "event.json"), "utf-8"));
  assert.equal(stored.eventStartAt, new Date("2098-06-01T09:15:00+05:30").toISOString());
});

test("setting null reverts to the configured start", async () => {
  const res = await setStart(null);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.eventStartSource, "config");
  assert.equal(res.body.data.eventStartTime, CONFIGURED);
});

test("once the backend says ACTIVE, gameplay starts on the server clock", async () => {
  const res = await setStart(new Date(Date.now() - 1000).toISOString());
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "ACTIVE");
  assert.equal(res.body.data.huntStatus, "ACTIVE");

  const teams = (await call("GET", "/api/teams")).body.data;
  const teamId = teams.find((t) => t.teamName === "Early Team").teamId;
  const before = Date.now();
  const start = await call("POST", "/api/game/start", { payload: { teamId } });
  assert.equal(start.status, 200);
  const startedMs = Date.parse(start.body.data.startedAt);
  assert.ok(startedMs >= before - 5 && startedMs <= Date.now() + 5);
});

test("the start time is locked once the event is ACTIVE", async () => {
  const later = await setStart("2098-01-01T10:00:00+05:30");
  assert.equal(later.status, 409);
  assert.equal(later.body.error.code, "EVENT_ALREADY_STARTED");

  const revert = await setStart(null);
  assert.equal(revert.status, 409);

  const state = await getState();
  assert.equal(state.status, "ACTIVE");
  assert.equal(state.eventStartSource, "admin");
});

test("Reset Logs clears teams but not the event start configuration", async () => {
  const reset = await call("POST", "/api/admin/reset", { headers: TOKEN });
  assert.equal(reset.status, 200);
  assert.equal((await call("GET", "/api/teams")).body.data.length, 0);

  const state = await getState();
  assert.equal(state.eventStartSource, "admin");
  assert.equal(state.status, "ACTIVE");
});
