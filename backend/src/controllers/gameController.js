import * as gameplayService from "../services/gameplayService.js";
import { isEventActive } from "../services/eventService.js";
import { Errors } from "../utils/errors.js";

export async function start(req, reply) {
  const { teamId } = req.body ?? {};

  // The real gate: even a direct/crafted call to this endpoint cannot
  // activate a session (and therefore cannot unlock puzzle-complete
  // reporting, see gameplayService.completePuzzle's session check) before
  // the backend's own clock says the event has started. Registration
  // (POST /api/teams) is deliberately NOT gated — teams may sign up early.
  if (!isEventActive()) {
    throw Errors.eventNotStarted();
  }

  const team = gameplayService.startGame({ teamId });
  reply.send({
    success: true,
    data: {
      teamId: team.teamId,
      status: team.status,
      currentPuzzle: team.currentPuzzle,
      session: team.session,
      startedAt: team.startedAt,
    },
  });
}

export async function puzzleComplete(req, reply) {
  const { teamId, puzzleId } = req.body ?? {};
  const { team, completion, alreadyCompleted } = gameplayService.completePuzzle({
    teamId,
    puzzleId,
  });

  reply.send({
    success: true,
    data: {
      teamId: team.teamId,
      status: team.status,
      currentPuzzle: team.currentPuzzle,
      completion,
      alreadyCompleted,
      totalTimeMs: team.totalTimeMs,
      finishedAt: team.finishedAt,
    },
  });
}
