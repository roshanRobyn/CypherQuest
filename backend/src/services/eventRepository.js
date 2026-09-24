import { JsonStore } from "../utils/jsonStore.js";

/**
 * Event configuration repository — persists the ONE admin-controlled event
 * setting: an optional override of the event start time. Same DB-swap point
 * pattern as teamRepository.js (everything else goes through these
 * functions, never JsonStore directly).
 *
 * `eventStartAt: null` means "no override": the backend uses the configured
 * EVENT_START_AT (env / default 2026-09-24T13:30:00+05:30). Reset Logs does
 * NOT touch this file — it only clears teams.
 *
 * The store is created lazily (first use, not import time) so modules and
 * tests that import eventService before setting DATA_DIR never create a
 * file in the wrong directory.
 */

const DEFAULT = { eventStartAt: null, updatedAt: null };
let store = null;

function getStore() {
  if (!store) store = new JsonStore("event.json", DEFAULT);
  return store;
}

export function getEventStartOverride() {
  const data = getStore().load();
  return typeof data?.eventStartAt === "string" ? data.eventStartAt : null;
}

export function saveEventStartOverride(eventStartAt) {
  const data = { eventStartAt, updatedAt: new Date().toISOString() };
  getStore().save(data);
  return data;
}
