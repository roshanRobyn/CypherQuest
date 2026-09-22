/**
 * @typedef {Object} CompletedPuzzle
 * @property {string} puzzleId
 * @property {string} completedAt - ISO timestamp, server-generated.
 * @property {number} timeTakenMs - Time since previous puzzle completion (or session start).
 *
 * @typedef {Object} GameSession
 * @property {string} sessionId
 * @property {string} startedAt - ISO timestamp, server-generated.
 * @property {"ACTIVE"|"COMPLETED"} status
 *
 * @typedef {Object} Team
 * @property {string} teamId
 * @property {string} teamName
 * @property {string|null} leader
 * @property {string|null} institution
 * @property {string|null} registrationId
 * @property {string[]} members
 * @property {"NOT_STARTED"|"ACTIVE"|"PAUSED"|"COMPLETED"|"DISCONNECTED"} status
 * @property {string|null} currentPuzzle
 * @property {CompletedPuzzle[]} completedPuzzles
 * @property {GameSession|null} session
 * @property {string|null} startedAt
 * @property {string|null} finishedAt
 * @property {number|null} totalTimeMs
 * @property {string} createdAt
 *
 * This file is documentation only (plain JS project, no TS build step).
 * The actual shape is produced/maintained in services/teamRepository.js.
 */

export const TeamStatus = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  DISCONNECTED: "DISCONNECTED",
});
