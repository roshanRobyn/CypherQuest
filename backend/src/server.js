import Fastify from "fastify";
import cors from "@fastify/cors";
import { pathToFileURL } from "node:url";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/health.js";
import teamsRoutes from "./routes/teams.js";
import gameRoutes from "./routes/game.js";
import puzzlesRoutes from "./routes/puzzles.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import adminRoutes from "./routes/admin.js";

export function buildServer() {
  const fastify = Fastify({ logger: env.NODE_ENV !== "test" });

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  fastify.register(cors, {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-reset-token"],
  });

  fastify.register(healthRoutes);
  fastify.register(teamsRoutes);
  fastify.register(gameRoutes);
  fastify.register(puzzlesRoutes);
  fastify.register(leaderboardRoutes);
  fastify.register(adminRoutes);

  fastify.setErrorHandler(errorHandler);

  fastify.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.url} not found` },
    });
  });

  return fastify;
}

async function main() {
  const fastify = buildServer();
  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export default buildServer;
