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

test("a good config loads with all three paths", () => {
  const { home, good } = setup();
  assert.deepEqual(loadConfig({ home }), { ok: true, ...{ claude_path: good.claude_path, node_path: good.node_path, repo_path: good.repo_path } });
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
