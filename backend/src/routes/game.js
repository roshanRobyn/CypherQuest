import * as gameController from "../controllers/gameController.js";

export default async function gameRoutes(fastify) {
  fastify.post("/api/game/start", gameController.start);
  fastify.post("/api/game/puzzle-complete", gameController.puzzleComplete);
}
