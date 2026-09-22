import { ApiError } from "../utils/errors.js";

export function errorHandler(error, req, reply) {
  if (error instanceof ApiError) {
    reply
      .code(error.statusCode)
      .send({ success: false, error: { code: error.code, message: error.message } });
    return;
  }

  // Fastify validation errors (e.g. from schema) come through as generic
  // errors with a statusCode; surface them consistently.
  if (error.statusCode && error.statusCode < 500) {
    reply.code(error.statusCode).send({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    return;
  }

  req.log.error(error);
  reply.code(500).send({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
