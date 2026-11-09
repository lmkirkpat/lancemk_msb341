// The access key (spec 013 FR-018, FR-019, FR-038; research R3, R11). The helper reads it itself
// from the macOS Keychain item spec 006 FR-004 defines, or, for the builder's eval runs only,
// takes it from the start command. It lives only in this process's memory: it is never put in an
// environment, a file, a log or an event. Missing is "nothing", not an error: the turn that needs
// it reports not_signed_in.

import { execFile } from "node:child_process";
import { classify } from "./errors.mjs";

export const KEYCHAIN = Object.freeze({ service: "Knack", account: "anthropic-api-key" });
export const SECURITY = "/usr/bin/security";
export const SECURITY_ARGS = Object.freeze(["find-generic-password", "-s", KEYCHAIN.service, "-a", KEYCHAIN.account, "-w"]);

// The variables the SDK would otherwise read for a key, a token, a profile or another host
// (research R3). Every other ANTHROPIC_* setting goes too (custom headers, logging, a config
// folder): the helper is configured only by its start command and settings.json.
export const SDK_ENV = Object.freeze(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_PROFILE", "ANTHROPIC_BASE_URL"]);

// Removes them from the given environment (the helper's own process.env at start). → the names
// removed, for the log (never the values).
export function scrubEnv(env) {
  const removed = [];
  for (const name of Object.keys(env)) {
    if (SDK_ENV.includes(name) || name.startsWith("ANTHROPIC_")) {
      delete env[name];
      removed.push(name);
    }
  }
  return removed.sort();
}

// The default runner: `security` with a fixed PATH and nothing else inherited.
function runSecurity(file, args) {
  return new Promise((resolve) => {
    execFile(file, args, { env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin" }, timeout: 10000, maxBuffer: 64 * 1024 }, (err, stdout) => {
      resolve(err ? null : String(stdout));
    });
  });
}

// → the Keychain key, or null when there's no item, it's empty or `security` fails.
export async function readKeychainKey(run = runSecurity) {
  let out;
  try {
    out = await run(SECURITY, [...SECURITY_ARGS]);
  } catch {
    return null;
  }
  const key = typeof out === "string" ? out.trim() : "";
  return key ? key : null;
}

// The start command's key (evals) wins; otherwise the Keychain. → string or null.
export async function resolveKey(startKey, run) {
  if (typeof startKey === "string" && startKey.trim()) return startKey.trim();
  return readKeychainKey(run);
}

// ---------- the key check (spec 013 FR-020, research R11, T037; spec 006 FR-021) ----------

// Error kinds (errors.mjs classify) → the key check's status. Anything else (busy, rate limited, an
// unexpected status, a fault in the helper) can't say whether the key works, so it reads as
// "offline": not checked, try again later (spec 006 contracts/setup-check.md › key).
const CHECK_STATUS = Object.freeze({ not_signed_in: "rejected", out_of_credit: "out_of_credit", offline: "offline" });

// One models.retrieve(model), which costs nothing and changes nothing, with no retries so it's one
// request. → "works" | "rejected" | "out_of_credit" | "offline" | "no_key" (no key: no request).
// Never throws. reached(): whether the request reached the service (loop.mjs lastReach), for
// classify. log gets the outcome, the status code and the service's own text (cut short); the
// caller's log line scrubs the key.
export async function checkKey({ key, model, client, reached = () => false, log = () => {} }) {
  if (typeof key !== "string" || !key.trim()) return "no_key";
  try {
    await client.models.retrieve(model, null, { maxRetries: 0 });
    log({ event: "key_check", status: "works" });
    return "works";
  } catch (err) {
    let kind;
    try {
      kind = classify(err, { reached: reached() });
    } catch {
      kind = "start_failed";
    }
    const status = CHECK_STATUS[kind] || "offline";
    const msg = err && err.error && err.error.error && typeof err.error.error.message === "string" ? err.error.error.message : null;
    log({
      event: "key_check",
      status,
      kind,
      http_status: err && typeof err.status === "number" ? err.status : null,
      name: (err && err.name) || null,
      ...(msg ? { detail: msg.slice(0, 300) } : {}),
    });
    return status;
  }
}
