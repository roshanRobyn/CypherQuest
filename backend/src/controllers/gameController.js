import * as gameplayService from "../services/gameplayService.js";

export async function start(req, reply) {
  const { teamId } = req.body ?? {};

  // Gameplay is always open: no event-start gate. The session start time
  // is still set server-side (gameplayService.startGame).
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
