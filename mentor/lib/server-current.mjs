// Is this server's code still the code on disk? (spec 004 FR-044, research R25.) The server reads
// the mentor/ tree hash once at start; each call that reports `server_current` reads it again and
// compares. A merge into mentor/ changes that hash and nothing else does. Any failed read (no git,
// not a checkout, a time-out) is unknown, `null`, which the skills treat as current: the panel's
// runtime folder and an installed copy may have no git. The hash itself never leaves this file.

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The folder that holds server.mjs, from this file's own place, never process.cwd().
export const MENTOR_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_TIMEOUT_MS = 2000;
const HASH = /^[0-9a-f]{40,64}$/;

function gitTreeHash() {
  return new Promise((resolve, reject) => {
    execFile("git", ["rev-parse", "HEAD:./"], { cwd: MENTOR_DIR, timeout: DEFAULT_TIMEOUT_MS, windowsHide: true }, (err, stdout) => {
      if (err) return reject(err);
      resolve(String(stdout).trim());
    });
  });
}

let readHash = gitTreeHash;
let timeoutMs = DEFAULT_TIMEOUT_MS;
let startHash = Promise.resolve(null);

// One read, as a hash or null. Never throws.
async function readOnce() {
  let timer;
  try {
    const value = await Promise.race([
      Promise.resolve().then(() => readHash()),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
        timer.unref?.();
      }),
    ]);
    return typeof value === "string" && HASH.test(value.trim()) ? value.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Tests only: replace the hash read (null puts git back). Forgets the start hash.
export function setHashReader(fn, { timeoutMs: ms = DEFAULT_TIMEOUT_MS } = {}) {
  readHash = fn || gitTreeHash;
  timeoutMs = ms;
  startHash = Promise.resolve(null);
}

// Called once by server.mjs when it starts. Without it, `serverCurrent()` is null.
export function recordStart() {
  startHash = readOnce();
  return startHash.then(() => undefined);
}

// true: the code on disk is the code this server started with; false: it changed; null: unknown.
export async function serverCurrent() {
  const start = await startHash;
  if (!start) return null;
  const now = await readOnce();
  if (!now) return null;
  return now === start;
}
