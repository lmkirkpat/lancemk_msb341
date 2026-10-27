#!/usr/bin/env node
// PreToolUse on every After Effects tool: only one agent drives AE at a time (decisions/008).
// The first caller holds the lock, keyed on session_id plus agent_id (a top-level session is
// "<session>:main"), so subagents and separate top-level sessions are told apart (amended
// 2026-10-26). It frees after 10 idle minutes, on SubagentStop when that input names the holder
// (`--release`), or on SessionEnd for any holder from that session (`--end-session`).

import fs from "node:fs";
import path from "node:path";
import { readPayload, block, stateDir, git } from "./lib.mjs";

const LEASE_MS = 10 * 60 * 1000;
const READ_ONLY = new Set(["mcp__ae-mentor__read_learner_record"]); // reads a local file, not AE

const p = readPayload();
const releasing = process.argv.includes("--release");
const ending = process.argv.includes("--end-session");
const session = p.session_id || "no-session";
const holderOf = (agentId) => `${session}:${agentId || "main"}`;
const dir = stateDir(p.cwd);
if (!dir) {
  if (releasing || ending) process.exit(0);
  block("couldn't find the repo's git folder to keep the After Effects lock in.");
}
const lockFile = path.join(dir, "ae.lock.json");

function readLock() {
  if (!fs.existsSync(lockFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockFile, "utf8"));
  } catch {
    return undefined;
  }
}

if (releasing || ending) {
  const lock = readLock();
  const mine = ending
    ? lock && typeof lock.holder === "string" && lock.holder.startsWith(`${session}:`)
    : p.agent_id && lock && lock.holder === holderOf(p.agent_id);
  if (mine) fs.rmSync(lockFile, { force: true });
  process.exit(0);
}

if (READ_ONLY.has(p.tool_name)) process.exit(0);

const me = holderOf(p.agent_id);
const now = Date.now();
const lock = readLock();
if (lock === undefined) {
  block(`the After Effects lock file is unreadable (${lockFile}). Ask the human to delete it if no agent is using AE.`);
}
if (lock && lock.holder !== me && now - lock.last < LEASE_MS) {
  const idle = Math.round((now - lock.last) / 1000);
  block(
    `${lock.who} is driving After Effects${lock.where ? ` from ${lock.where}` : ""} (last call ${idle}s ago), and only one agent drives AE at a time. ` +
      "Don't retry in a loop: finish what you can without AE and say in your hand-back that you need it. " +
      "The lock frees when that agent stops, or after 10 idle minutes."
  );
}

const top = p.cwd && git(["rev-parse", "--show-toplevel"], p.cwd);
const where = top ? path.basename(top) : null;
const who = p.agent_type || "another top-level session";
const next = JSON.stringify({ holder: me, who, where, last: now }) + "\n";
if (!lock) {
  try {
    fs.writeFileSync(lockFile, next, { flag: "wx" });
  } catch {
    block("another agent took the After Effects lock just now. Don't retry in a loop; say in your hand-back that you need AE.");
  }
} else {
  const tmp = `${lockFile}.${process.pid}`;
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, lockFile);
}
process.exit(0);
