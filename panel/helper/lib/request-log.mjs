// The opt-in request log (spec 013 SC-008, contracts/helper-protocol.md › Guarantees): with a
// `request_log` path in the start command (evals only), every request body the helper sends is
// appended as one JSON line, so the eval engineer's allowlist check (T023) can read exactly what
// the model received. Request bodies never hold the key (it travels in a header the log never
// sees); image data is replaced by its length, and any key-shaped text is scrubbed as a guard.
// Logging never breaks a lesson.

import fs from "node:fs";
import { scrub } from "./errors.mjs";

// A copy of a request body with each base64 image's `data` replaced by `data_length`.
export function redactBody(body) {
  return JSON.parse(JSON.stringify(body), (k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v) && v.type === "base64" && typeof v.data === "string") {
      const { data, ...rest } = v;
      return { ...rest, data_length: data.length };
    }
    return v;
  });
}

// → { append(body, meta?) }. A null path gives a log that writes nothing.
export function createRequestLog(file, key) {
  if (!file) return { append() {}, enabled: false };
  return {
    enabled: true,
    append(body, meta) {
      try {
        const line = scrub(JSON.stringify({ ...(meta || {}), body: redactBody(body) }), key);
        fs.appendFileSync(file, line + "\n", { mode: 0o600 });
      } catch {
        // Never break a lesson over the log.
      }
    },
  };
}
