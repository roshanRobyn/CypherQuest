import * as teamsController from "../controllers/teamsController.js";

export default async function teamsRoutes(fastify) {
  fastify.post("/api/teams", teamsController.register);
  fastify.get("/api/teams", teamsController.list);
  fastify.get("/api/teams/:teamId", teamsController.getOne);
  fastify.get("/api/teams/:teamId/progress", teamsController.progress);
  fastify.get("/api/teams/:teamId/session", teamsController.session);
}
