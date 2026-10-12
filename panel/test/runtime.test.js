"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureRuntime } = require("../lib/runtime.js");

function repo(mcp) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "panel-runtime-"));
  const r = path.join(root, "repo");
  fs.mkdirSync(path.join(r, ".claude", "skills", "ease-mentor"), { recursive: true });
  fs.writeFileSync(path.join(r, ".claude", "skills", "ease-mentor", "SKILL.md"), "# skill\n");
  fs.writeFileSync(path.join(r, "CLAUDE.md"), "builder notes\n");
  fs.writeFileSync(path.join(r, ".mcp.json"), JSON.stringify(mcp || {
    mcpServers: { "ae-mentor": { type: "stdio", command: "node", args: ["mentor/server.mjs"] }, other: { command: "x" } },
  }));
  return { root, repo: r, dir: path.join(root, "home", "runtime") };
}

test("the runtime folder links the skill and starts the repo's server by absolute path", () => {
  const t = repo();
  assert.equal(ensureRuntime(t.repo, t.dir), t.dir);
  assert.equal(fs.readFileSync(path.join(t.dir, ".claude", "skills", "ease-mentor", "SKILL.md"), "utf8"), "# skill\n");
  const mcp = JSON.parse(fs.readFileSync(path.join(t.dir, ".mcp.json"), "utf8"));
  assert.deepEqual(Object.keys(mcp.mcpServers), ["ae-mentor"], "only the mentor's server");
  assert.deepEqual(mcp.mcpServers["ae-mentor"].args, [path.join(t.repo, "mentor", "server.mjs")]);
  assert.equal(fs.existsSync(path.join(t.dir, "CLAUDE.md")), false, "no builder notes in the runtime folder");
});

test("running it again is safe and repoints a stale link", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  ensureRuntime(t.repo, t.dir);
  const moved = path.join(t.root, "moved");
  fs.renameSync(t.repo, moved);
  ensureRuntime(moved, t.dir);
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "ease-mentor")), path.join(moved, ".claude", "skills", "ease-mentor"));
});

test("a repo .mcp.json with no ae-mentor server throws a plain message", () => {
  const t = repo({ mcpServers: {} });
  assert.throws(() => ensureRuntime(t.repo, t.dir), /no ae-mentor server/);
});
