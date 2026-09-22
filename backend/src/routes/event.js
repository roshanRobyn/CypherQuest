import * as eventController from "../controllers/eventController.js";

export default async function eventRoutes(fastify) {
  fastify.get("/api/event/state", eventController.state);
}
