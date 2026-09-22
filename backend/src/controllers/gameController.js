import * as gameplayService from "../services/gameplayService.js";

export async function start(req, reply) {
  const { teamId } = req.body ?? {};
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
