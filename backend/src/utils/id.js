import crypto from "node:crypto";

export function generateId(prefix) {
  const random = crypto.randomBytes(6).toString("hex");
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
