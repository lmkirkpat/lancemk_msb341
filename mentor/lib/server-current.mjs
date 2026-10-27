// Is this server's code still the code on disk? (spec 004 FR-044, research R25 as amended.) The
// server hashes what it runs once at start: the listing of its own folder at HEAD (`git ls-tree
// HEAD`), without the `test` and `dev` lines, so a commit of captures or tests mid-session isn't a
// false restart. Each call that reports `server_current` reads it again and compares. Git starts
// only when a `.git` folder or file is in that folder or one above it (on a Mac without the
// command-line tools, git is a stub that opens an install dialog). Any failed read (no checkout, no
// git, a time-out, a listing that doesn't parse) is unknown, `null`, which the skills treat as
// current. The hash itself never leaves this file.

import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The folder that holds server.mjs, from this file's own place, never process.cwd().
export const MENTOR_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_TIMEOUT_MS = 2000;
const HASH = /^[0-9a-f]{40,64}$/;

// Entries that aren't what the server runs. Everything else counts, a new folder included.
const NOT_RUN = new Set(["test", "dev"]);
const ENTRY = /^[0-7]{6} (blob|tree|commit) [0-9a-f]{40,64}\t(.+)$/;

// A `.git` folder or file (a worktree's) in `dir` or any folder above it.
export function hasCheckoutAbove(dir) {
  let d = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(d, ".git"))) return true;
    const up = path.dirname(d);
    if (up === d) return false;
    d = up;
  }
}

// The sha256 of a `git ls-tree HEAD` listing without its `test` and `dev` lines, or null when the
// listing is empty or any line doesn't parse.
export function listingHash(text) {
  if (typeof text !== "string") return null;
  const lines = text.split("\n").filter((l) => l !== "");
  if (!lines.length) return null;
  const kept = [];
  for (const line of lines) {
    const m = line.match(ENTRY);
    if (!m) return null;
    if (!NOT_RUN.has(m[2])) kept.push(line);
  }
  if (!kept.length) return null;
  return crypto.createHash("sha256").update(kept.join("\n")).digest("hex");
}

function runGit(args, { cwd, timeout }) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, timeout, windowsHide: true }, (err, stdout) => {
      if (err) return reject(err);
      resolve(String(stdout));
    });
  });
}

// The default read, with its folder and process start injectable for tests (T189).
export function listingReader({ dir = MENTOR_DIR, run = runGit } = {}) {
  return async () => {
    if (!hasCheckoutAbove(dir)) return null; // nothing is started
    return listingHash(await run(["ls-tree", "HEAD"], { cwd: dir, timeout: timeoutMs }));
  };
}

const gitTreeHash = listingReader();
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
