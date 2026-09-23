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

/**
 * Same "pure, no env/process access" shape as computeEventState above, for
 * the in-gameplay hunt-duration timer — PENDING before huntStartMs (cosmetic
 * only; see env.js's HUNT_START_AT comment), ACTIVE between start and end,
 * EXPIRED at/after huntEndMs. Only `status` and `huntEndTime` are ever
 * security-relevant (the frontend must treat EXPIRED as authoritative, never
 * deciding it locally from a countdown reaching zero) — huntStartTime exists
 * purely so an early dev-mode unlock shows "not yet begun" instead of a
 * confusingly long countdown, never to gate anything.
 */
export function computeHuntState(nowMs, huntStartMs, huntEndMs) {
  const status = nowMs >= huntEndMs ? "EXPIRED" : nowMs >= huntStartMs ? "ACTIVE" : "PENDING";
  return {
    huntStatus: status,
    huntStartTime: new Date(huntStartMs).toISOString(),
    huntEndTime: new Date(huntEndMs).toISOString(),
    huntMsRemaining: Math.max(0, huntEndMs - nowMs),
  };
}

const DEV_OVERRIDES = new Set(["WAITING", "ACTIVE"]);

/**
 * Pure — same reasoning as computeEventState/computeHuntState above, kept
 * free of live env/isProduction access so the production-inertness
 * guarantee itself is directly unit-testable (see test/event.test.js):
 * passing isProduction: true must return huntEndAtMs even when a dev
 * override string is present.
 */
export function resolveHuntEndMs({ huntEndAt, huntEndAtDevOverride, isProduction: prodFlag }) {
  if (!prodFlag && huntEndAtDevOverride) {
    return new Date(huntEndAtDevOverride).getTime();
  }
  return new Date(huntEndAt).getTime();
}

/**
 * Authoritative WAITING/ACTIVE gate state PLUS the in-gameplay hunt-timer
 * state, from one shared response/poll (see useEventGate.js for the gate
 * consumer, useHuntTimer.js for the hunt-timer one — they never poll this
 * at the same time, since one only runs pre-game and the other only runs
 * once gameplay has actually started). Never trusts client time — both
 * halves are always computed from the server clock (Date.now()). The
 * env.EVENT_STATE_OVERRIDE dev/test escape hatch affects only the gate
 * half; env.HUNT_END_AT_DEV_OVERRIDE (via resolveHuntEndMs) is the
 * equivalent for the hunt-timer half — both are no-ops in production.
 */
export function getEventState() {
  const eventStartMs = new Date(env.EVENT_START_AT).getTime();
  const huntStartMs = new Date(env.HUNT_START_AT).getTime();
  const huntEndMs = resolveHuntEndMs({
    huntEndAt: env.HUNT_END_AT,
    huntEndAtDevOverride: env.HUNT_END_AT_DEV_OVERRIDE,
    isProduction,
  });
  const nowMs = Date.now();
  const huntState = computeHuntState(nowMs, huntStartMs, huntEndMs);

  if (!isProduction && DEV_OVERRIDES.has(env.EVENT_STATE_OVERRIDE)) {
    const status = env.EVENT_STATE_OVERRIDE;
    return {
      status,
      serverTime: new Date(nowMs).toISOString(),
      eventStartTime: new Date(eventStartMs).toISOString(),
      msRemaining: status === "ACTIVE" ? 0 : Math.max(0, eventStartMs - nowMs),
      ...huntState,
    };
  }

  return { ...computeEventState(nowMs, eventStartMs), ...huntState };
}

export function isEventActive() {
  return getEventState().status === "ACTIVE";
}
