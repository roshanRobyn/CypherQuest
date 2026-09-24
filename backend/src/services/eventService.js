import { env, isProduction } from "../config/env.js";
import { getEventStartOverride, saveEventStartOverride } from "./eventRepository.js";
import { Errors } from "../utils/errors.js";

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
// The authoritative event start: an admin override (set from the admin
// dashboard, see setEventStartOverride) if present, otherwise the configured
// EVENT_START_AT. The client countdown never decides anything — only
// getEventState()/isEventActive() below, on the server clock.
function resolveEventStart() {
  const override = getEventStartOverride();
  return override
    ? { iso: override, source: "admin" }
    : { iso: env.EVENT_START_AT, source: "config" };
}

export function getEventState() {
  const eventStart = resolveEventStart();
  const eventStartMs = new Date(eventStart.iso).getTime();
  // Hunt start coincides with the event start (see env.js), so it follows
  // an admin override too. Purely cosmetic (PENDING vs ACTIVE HUD state).
  const huntStartMs = new Date(
    eventStart.source === "admin" ? eventStart.iso : env.HUNT_START_AT
  ).getTime();
  const startMeta = {
    eventStartSource: eventStart.source,
    configuredEventStartTime: new Date(env.EVENT_START_AT).toISOString(),
  };
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
      ...startMeta,
      ...huntState,
    };
  }

  return { ...computeEventState(nowMs, eventStartMs), ...startMeta, ...huntState };
}

// Explicit offset required ("Z" or "+05:30"), so a value is never
// reinterpreted against the server's or the admin browser's timezone.
const EXPLICIT_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Admin-only: set (ISO string with explicit timezone) or clear (null) the
 * event start override. Refused once the event is ACTIVE, so a live event
 * can never be re-locked or have its start moved mid-hunt.
 */
export function setEventStartOverride(eventStartAt) {
  if (isEventActive()) throw Errors.eventAlreadyStarted();

  if (eventStartAt === null) {
    saveEventStartOverride(null);
    return getEventState();
  }

  if (typeof eventStartAt !== "string" || !EXPLICIT_TZ.test(eventStartAt)) {
    throw Errors.validation(
      'eventStartAt must be null or an ISO date-time with an explicit timezone, e.g. "2026-09-24T13:30:00+05:30"'
    );
  }
  const ms = Date.parse(eventStartAt);
  if (Number.isNaN(ms)) throw Errors.validation("eventStartAt is not a valid date-time");

  saveEventStartOverride(new Date(ms).toISOString());
  return getEventState();
}

export function isEventActive() {
  return getEventState().status === "ACTIVE";
}
