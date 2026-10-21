// The server's always-on rules (spec 004 review, round 5b): rule 4 sends each lesson to its own
// snapshot tool, so a key-types or offset lesson doesn't start an easing session.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");

function initialize() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-instructions-"));
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, AE_MENTOR_HOME: home }, stdio: ["pipe", "pipe", "inherit"] });
  return new Promise((resolve, reject) => {
    let buf = "";
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      child.kill();
      try {
        resolve(JSON.parse(buf.slice(0, nl)).result);
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } } }) + "\n");
  });
}

test("rule 4 names the lesson's own snapshot tool, with snapshot_project as easing's", async () => {
  const { instructions } = await initialize();
  assert.match(instructions, /\(4\) Start with the lesson's own snapshot tool \(snapshot_project for easing\)/);
  assert.doesNotMatch(instructions, /\(4\) Start with snapshot_project and/);
});
