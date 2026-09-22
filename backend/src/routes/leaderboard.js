import * as leaderboardController from "../controllers/leaderboardController.js";

export default async function leaderboardRoutes(fastify) {
  fastify.get("/api/leaderboard", leaderboardController.getLeaderboard);
}
