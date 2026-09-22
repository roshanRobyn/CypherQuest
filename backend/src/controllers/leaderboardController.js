import * as gameplayService from "../services/gameplayService.js";

export async function getLeaderboard(req, reply) {
  const data = gameplayService.getLeaderboard();
  reply.send({ success: true, data });
}
