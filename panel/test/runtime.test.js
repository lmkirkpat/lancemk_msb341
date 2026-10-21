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

function addSkill(r, name, body) {
  fs.mkdirSync(path.join(r, ".claude", "skills", name), { recursive: true });
  fs.writeFileSync(path.join(r, ".claude", "skills", name, "SKILL.md"), body || `# ${name}\n`);
}

function runtimeSkills(dir) {
  return fs.readdirSync(path.join(dir, ".claude", "skills")).sort();
}

test("every *-mentor skill is linked, found by pattern, and nothing else from .claude/", () => {
  const t = repo();
  addSkill(t.repo, "speed-graph-mentor");
  addSkill(t.repo, "next-mentor");
  addSkill(t.repo, "learn");
  addSkill(t.repo, "sprint-review");
  addSkill(t.repo, "mentor-notes"); // doesn't end in -mentor
  fs.writeFileSync(path.join(t.repo, ".claude", "skills", "stray-mentor"), "a file, not a skill\n");
  fs.mkdirSync(path.join(t.repo, ".claude", "agents"), { recursive: true });
  fs.writeFileSync(path.join(t.repo, ".claude", "agents", "panel-builder.md"), "persona\n");
  fs.mkdirSync(path.join(t.repo, ".claude", "hooks"), { recursive: true });
  fs.writeFileSync(path.join(t.repo, ".claude", "settings.json"), "{}\n");

  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor", "next-mentor", "speed-graph-mentor"]);
  assert.deepEqual(fs.readdirSync(path.join(t.dir, ".claude")), ["skills"], "no agents, hooks or settings");
  assert.deepEqual(fs.readdirSync(t.dir).sort(), [".claude", ".mcp.json"]);
  assert.equal(fs.readFileSync(path.join(t.dir, ".claude", "skills", "next-mentor", "SKILL.md"), "utf8"), "# next-mentor\n");
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "speed-graph-mentor")), path.join(t.repo, ".claude", "skills", "speed-graph-mentor"));
});

test("ease-mentor alone links exactly as before", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "ease-mentor")), path.join(t.repo, ".claude", "skills", "ease-mentor"));
});

test("a skill removed from the repo disappears on the next sync, and its files are kept", () => {
  const t = repo();
  addSkill(t.repo, "offset-mentor");
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor", "offset-mentor"]);
  const kept = path.join(t.root, "kept-offset-mentor");
  fs.renameSync(path.join(t.repo, ".claude", "skills", "offset-mentor"), kept);
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.existsSync(path.join(kept, "SKILL.md")), true);
});

test("anything else left in the runtime's skills folder is cleared, without touching the repo", () => {
  const t = repo();
  addSkill(t.repo, "learn");
  const skills = path.join(t.dir, ".claude", "skills");
  fs.mkdirSync(path.join(skills, "old-copy"), { recursive: true });
  fs.writeFileSync(path.join(skills, "old-copy", "SKILL.md"), "stale\n");
  fs.symlinkSync(path.join(t.repo, ".claude", "skills", "learn"), path.join(skills, "learn"));
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.existsSync(path.join(t.repo, ".claude", "skills", "learn", "SKILL.md")), true, "only the link went");
});

test("a real folder where a link belongs is replaced by the link", () => {
  const t = repo();
  const stale = path.join(t.dir, ".claude", "skills", "ease-mentor");
  fs.mkdirSync(stale, { recursive: true });
  fs.writeFileSync(path.join(stale, "SKILL.md"), "old copy\n");
  ensureRuntime(t.repo, t.dir);
  assert.equal(fs.readlinkSync(stale), path.join(t.repo, ".claude", "skills", "ease-mentor"));
  assert.equal(fs.readFileSync(path.join(stale, "SKILL.md"), "utf8"), "# skill\n");
});

test("a repo .mcp.json with no ae-mentor server throws a plain message", () => {
  const t = repo({ mcpServers: {} });
  assert.throws(() => ensureRuntime(t.repo, t.dir), /no ae-mentor server/);
});
