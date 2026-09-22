export default async function healthRoutes(fastify) {
  fastify.get("/api/health", async (req, reply) => {
    reply.send({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });
}
