"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadConfig, childPath } = require("../lib/config.js");

function setup(cfg) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-config-"));
  const bin = path.join(home, "bin");
  const repo = path.join(home, "repo");
  fs.mkdirSync(bin);
  fs.mkdirSync(repo);
  for (const name of ["claude", "node"]) {
    fs.writeFileSync(path.join(bin, name), "#!/bin/sh\n");
    fs.chmodSync(path.join(bin, name), 0o755);
  }
  fs.writeFileSync(path.join(repo, ".mcp.json"), "{}");
  const good = { version: 1, claude_path: path.join(bin, "claude"), node_path: path.join(bin, "node"), repo_path: repo };
  if (cfg !== null) fs.writeFileSync(path.join(home, "panel.json"), JSON.stringify(cfg === undefined ? good : cfg(good)));
  return { home, good };
}

test("a good config loads with all three paths; no runtime means B1 (FR-037)", () => {
  const { home, good } = setup();
  assert.deepEqual(loadConfig({ home }), { ok: true, runtime: "b1", claude_path: good.claude_path, node_path: good.node_path, repo_path: good.repo_path });
});

test("runtime b1 is the same as no runtime: claude_path still required", () => {
  const { home, good } = setup((g) => ({ ...g, runtime: "b1" }));
  assert.deepEqual(loadConfig({ home }), { ok: true, runtime: "b1", claude_path: good.claude_path, node_path: good.node_path, repo_path: good.repo_path });
  const bad = setup((g) => ({ ...g, runtime: "b1", claude_path: undefined }));
  const r = loadConfig({ home: bad.home });
  assert.equal(r.ok, false);
  assert.match(r.fix, /can't find Claude Code/);
});

test("runtime a: no claude_path needed, and a bad one isn't checked (spec 013 FR-037, FR-038)", () => {
  const none = setup((g) => ({ version: 1, node_path: g.node_path, repo_path: g.repo_path, runtime: "a" }));
  assert.deepEqual(loadConfig({ home: none.home }), { ok: true, runtime: "a", node_path: none.good.node_path, repo_path: none.good.repo_path });
  const stale = setup((g) => ({ ...g, claude_path: "/nope/claude", runtime: "a" }));
  assert.deepEqual(loadConfig({ home: stale.home }), { ok: true, runtime: "a", node_path: stale.good.node_path, repo_path: stale.good.repo_path });
});

test("runtime a still needs node and the repo, with B1's messages", () => {
  const noNode = setup((g) => ({ version: 1, node_path: "/nope/node", repo_path: g.repo_path, runtime: "a" }));
  const r1 = loadConfig({ home: noNode.home });
  assert.equal(r1.ok, false);
  assert.match(r1.fix, /can't find Node\.js/);
  const noRepo = setup((g) => ({ version: 1, node_path: g.node_path, repo_path: os.tmpdir(), runtime: "a" }));
  const r2 = loadConfig({ home: noRepo.home });
  assert.equal(r2.ok, false);
  assert.match(r2.fix, /mentor's project folder/);
});

test("an unknown runtime fails with a plain fix", () => {
  for (const runtime of ["c", "A", 1, null]) {
    const { home } = setup((g) => ({ ...g, runtime }));
    const r = loadConfig({ home });
    assert.equal(r.ok, false, String(runtime));
    assert.match(r.fix, /panel\/install\.sh/);
    assert.doesNotMatch(r.fix, /runtime/);
  }
});

test("a missing file says to run install.sh", () => {
  const { home } = setup(null);
  const r = loadConfig({ home });
  assert.equal(r.ok, false);
  assert.match(r.fix, /panel\/install\.sh/);
});

test("bad JSON, wrong version, and each bad path fail with a plain fix", () => {
  const cases = [
    () => "not json",
    (g) => ({ ...g, version: 2 }),
    (g) => ({ ...g, claude_path: "/nope/claude" }),
    (g) => ({ ...g, node_path: "/nope/node" }),
    (g) => ({ ...g, node_path: undefined }),
    (g) => ({ ...g, repo_path: os.tmpdir() }),
  ];
  for (const c of cases) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-config-"));
    const { good } = setup();
    const v = c(good);
    fs.writeFileSync(path.join(home, "panel.json"), typeof v === "string" ? v : JSON.stringify(v));
    const r = loadConfig({ home });
    assert.equal(r.ok, false, JSON.stringify(v));
    assert.ok(r.fix && !/claude_path|node_path|repo_path/.test(r.fix), "no field names in the fix");
  }
});

test("a non-executable node fails", () => {
  const { home, good } = setup();
  fs.chmodSync(good.node_path, 0o644);
  assert.equal(loadConfig({ home }).ok, false);
});

test("childPath puts the claude and node folders first", () => {
  assert.equal(
    childPath({ claude_path: "/a/b/claude", node_path: "/opt/homebrew/bin/node" }),
    "/a/b:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin",
  );
});
