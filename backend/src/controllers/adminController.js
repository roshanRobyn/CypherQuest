import * as gameplayService from "../services/gameplayService.js";
import { env, isProduction } from "../config/env.js";
import { Errors } from "../utils/errors.js";

export async function reset(req, reply) {
  if (isProduction) {
    const token = req.headers["x-admin-reset-token"];
    if (!env.ADMIN_RESET_TOKEN || token !== env.ADMIN_RESET_TOKEN) {
      throw Errors.forbidden(
        "Reset is disabled in production without a valid x-admin-reset-token header"
      );
    }
  }

  gameplayService.resetAllData();
  reply.send({ success: true, data: { message: "All gameplay data cleared" } });
}
