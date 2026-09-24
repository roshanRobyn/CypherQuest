import * as gameplayService from "../services/gameplayService.js";
import { setEventStartOverride } from "../services/eventService.js";
import { env, isProduction } from "../config/env.js";
import { Errors } from "../utils/errors.js";

// Shared admin check for every /api/admin/* action: in production the
// request must carry the correct x-admin-reset-token header.
function assertAdmin(req, action) {
  if (isProduction) {
    const token = req.headers["x-admin-reset-token"];
    if (!env.ADMIN_RESET_TOKEN || token !== env.ADMIN_RESET_TOKEN) {
      throw Errors.forbidden(
        `${action} is disabled in production without a valid x-admin-reset-token header`
      );
    }
  }
}

export async function reset(req, reply) {
  assertAdmin(req, "Reset");

  gameplayService.resetAllData();
  reply.send({ success: true, data: { message: "All gameplay data cleared" } });
}

// Body: { eventStartAt: "<ISO with timezone>" } to override, or
// { eventStartAt: null } to go back to the configured EVENT_START_AT.
export async function setEventStart(req, reply) {
  assertAdmin(req, "Changing the event start");

  const body = req.body ?? {};
  if (!("eventStartAt" in body)) {
    throw Errors.validation("eventStartAt is required (ISO date-time with timezone, or null)");
  }
  reply.send({ success: true, data: setEventStartOverride(body.eventStartAt) });
}

export async function removeTeam(req, reply) {
  assertAdmin(req, "Team removal");

  const removed = gameplayService.removeTeam(req.params.teamId);
  reply.send({
    success: true,
    data: { teamId: removed.teamId, teamName: removed.teamName, removed: true },
  });
}
