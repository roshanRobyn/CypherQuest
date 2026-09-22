import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

/**
 * Tiny synchronous JSON-file-backed store.
 *
 * This is the ONLY place that touches the filesystem for persistence.
 * `services/*Repository.js` files depend on this module's interface
 * (load/save) rather than on file paths directly — swapping to a real
 * database later means reimplementing this interface (e.g. a Postgres-
 * backed store) and pointing the repositories at it, without touching
 * controllers or routes. See backend/README.md "Migrating to a real DB".
 */
export class JsonStore {
  constructor(fileName, defaultValue) {
    this.filePath = path.join(env.DATA_DIR, fileName);
    this.defaultValue = defaultValue;
    this._ensureFile();
  }

  _ensureFile() {
    if (!fs.existsSync(env.DATA_DIR)) {
      fs.mkdirSync(env.DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.defaultValue, null, 2));
    }
  }

  load() {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return structuredClone(this.defaultValue);
    }
  }

  save(data) {
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, this.filePath);
  }
}
