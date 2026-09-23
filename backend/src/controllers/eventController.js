import { getEventState } from "../services/eventService.js";

export async function state(req, reply) {
  reply.send({ success: true, data: getEventState() });
}
