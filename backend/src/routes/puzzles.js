import * as teamsController from "../controllers/teamsController.js";

export default async function puzzlesRoutes(fastify) {
  fastify.get("/api/puzzles", teamsController.puzzleCatalog);
}
