import * as adminController from "../controllers/adminController.js";

export default async function adminRoutes(fastify) {
  fastify.post("/api/admin/reset", adminController.reset);
}
