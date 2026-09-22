import { env, isProduction } from "../config/env.js";

/**
 * Pure boundary computation, kept free of env/process access so it can be
 * unit-tested directly with exact timestamps (see test/event.test.js) —
 * e.g. one millisecond before vs. exactly at the release moment.
 */
export function computeEventState(nowMs, eventStartMs) {
  const status = nowMs >= eventStartMs ? "ACTIVE" : "WAITING";
  return {
    status,
    serverTime: new Date(nowMs).toISOString(),
    eventStartTime: new Date(eventStartMs).toISOString(),
    msRemaining: Math.max(0, eventStartMs - nowMs),
  };
}

const DEV_OVERRIDES = new Set(["WAITING", "ACTIVE"]);

/**
 * Authoritative WAITING/ACTIVE state for the whole app. Never trusts client
 * time — always computed from the server clock (Date.now()) against
 * env.EVENT_START_AT. The env.EVENT_STATE_OVERRIDE dev/test escape hatch is
 * only ever consulted outside production.
 */
export function getEventState() {
  const eventStartMs = new Date(env.EVENT_START_AT).getTime();
  const nowMs = Date.now();

  if (!isProduction && DEV_OVERRIDES.has(env.EVENT_STATE_OVERRIDE)) {
    const status = env.EVENT_STATE_OVERRIDE;
    return {
      status,
      serverTime: new Date(nowMs).toISOString(),
      eventStartTime: new Date(eventStartMs).toISOString(),
      msRemaining: status === "ACTIVE" ? 0 : Math.max(0, eventStartMs - nowMs),
    };
  }

  return computeEventState(nowMs, eventStartMs);
}

export function isEventActive() {
  return getEventState().status === "ACTIVE";
}
