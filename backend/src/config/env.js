import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");

// Minimal .env loader (avoids adding a dotenv dependency).
function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  ADMIN_RESET_TOKEN: process.env.ADMIN_RESET_TOKEN || "",
  DATA_DIR: process.env.DATA_DIR || path.join(ROOT, "data"),

  // Authoritative Cypher Quest release moment. Fixed offset (+05:30), not a
  // zone name, so this is never reinterpreted against the server host's or
  // any client's local timezone — see services/eventService.js.
  EVENT_START_AT: process.env.EVENT_START_AT || "2026-09-24T13:30:00+05:30",

  // Dev/test-only escape hatch ("WAITING" | "ACTIVE") to simulate the event
  // gate locally without touching EVENT_START_AT. Only ever honored when
  // NODE_ENV !== "production" (enforced in eventService.js), so production
  // always runs on the real EVENT_START_AT above regardless of this value.
  EVENT_STATE_OVERRIDE: process.env.EVENT_STATE_OVERRIDE || "",
};

export const isProduction = env.NODE_ENV === "production";
