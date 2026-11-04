// panel/install.sh with and without Claude Code, per runtime (spec 013 T061, FR-038), and its
// --runtime switch (T066, FR-041). Runs the real
// script against a temporary home, with stand-ins for `defaults` and `npm` first on PATH, so it
// never touches the real CEP preferences, extensions folder or After Effects, and installs nothing.
"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SCRIPT = path.resolve(__dirname, "..", "install.sh");
const PANEL = path.resolve(__dirname, "..");
const roots = [];
after(() => {
  for (const r of roots) fs.rmSync(r, { recursive: true, force: true });
});

function stub(file, body) {
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o755);
}

// → { run(), home, cfgFile, bin, log }
function sandbox({ claude, panelJson }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "panel-install-"));
  roots.push(root);
  const bin = path.join(root, "bin");
  const home = path.join(root, "home");
  const mentorHome = path.join(root, "AEMentor");
  const log = path.join(root, "calls.log");
  fs.mkdirSync(bin);
  fs.mkdirSync(home);
  fs.symlinkSync(process.execPath, path.join(bin, "node"));
  stub(path.join(bin, "npm"), `echo "npm $* in $(pwd)" >> "${log}"`);
  stub(path.join(bin, "defaults"), `echo "defaults $*" >> "${log}"`);
  if (claude) stub(path.join(bin, "claude"), "exit 0");
  if (panelJson) {
    fs.mkdirSync(mentorHome);
    fs.writeFileSync(path.join(mentorHome, "panel.json"), JSON.stringify(panelJson));
  }
  const run = (...args) =>
    spawnSync("/bin/bash", [SCRIPT, ...args], {
      env: { HOME: home, PATH: `${bin}:/usr/bin:/bin:/usr/sbin:/sbin`, AE_MENTOR_HOME: mentorHome },
      encoding: "utf8",
    });
  return { run, bin, cfgFile: path.join(mentorHome, "panel.json"), calls: () => (fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "") };
}

const readCfg = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const helperInstalled = (calls) => calls.includes(`npm ci --no-audit --no-fund --loglevel=error in ${path.join(PANEL, "helper")}`);

test("install.sh, runtime missing: needs Claude Code, as before", () => {
  const without = sandbox({ claude: false });
  const r = without.run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Claude Code isn't installed/);
  assert.equal(fs.existsSync(without.cfgFile), false);

  const s = sandbox({ claude: true });
  const ok = s.run();
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(readCfg(s.cfgFile), { version: 1, claude_path: path.join(s.bin, "claude"), node_path: path.join(s.bin, "node"), repo_path: path.resolve(PANEL, "..") });
  assert.ok(helperInstalled(s.calls()));
  assert.match(s.calls(), /defaults write com\.adobe\.CSXS\.9 PlayerDebugMode 1/, "the stand-in, not the real defaults");
});

test("install.sh, runtime b1: needs Claude Code and keeps the runtime", () => {
  const without = sandbox({ claude: false, panelJson: { version: 1, runtime: "b1" } });
  assert.equal(without.run().status, 1);

  const s = sandbox({ claude: true, panelJson: { version: 1, runtime: "b1" } });
  assert.equal(s.run().status, 0);
  const cfg = readCfg(s.cfgFile);
  assert.equal(cfg.runtime, "b1");
  assert.equal(cfg.claude_path, path.join(s.bin, "claude"));
});

test("install.sh, runtime a: no Claude Code needed, no claude_path written, helper still installed", () => {
  const s = sandbox({ claude: false, panelJson: { version: 1, runtime: "a" } });
  const r = s.run();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /claude: not needed \(runtime A\)/);
  assert.deepEqual(readCfg(s.cfgFile), { version: 1, node_path: path.join(s.bin, "node"), repo_path: path.resolve(PANEL, ".."), runtime: "a" });
  assert.ok(helperInstalled(s.calls()));
  assert.equal(fs.statSync(s.cfgFile).mode & 0o777, 0o600);
});

test("install.sh, runtime a: an existing claude_path is kept, not replaced", () => {
  const s = sandbox({ claude: true, panelJson: { version: 1, claude_path: "/old/place/claude", runtime: "a" } });
  assert.equal(s.run().status, 0);
  const cfg = readCfg(s.cfgFile);
  assert.equal(cfg.claude_path, "/old/place/claude");
  assert.equal(cfg.runtime, "a");
});

test("install.sh, a runtime it doesn't know: fails with config.js's plain words, panel.json untouched", () => {
  for (const runtime of ["A", "c", null, 1]) {
    const s = sandbox({ claude: true, panelJson: { version: 1, claude_path: "/old/claude", runtime } });
    const before = fs.readFileSync(s.cfgFile, "utf8");
    const r = s.run();
    assert.equal(r.status, 1, JSON.stringify(runtime));
    assert.match(r.stderr, /The panel's settings aren't ones it knows\./);
    assert.match(r.stderr, /"runtime" to "a" or "b1", or remove it/);
    assert.equal(fs.readFileSync(s.cfgFile, "utf8"), before, "not rewritten as B1");
    assert.equal(s.calls(), "", "stopped before changing anything");
  }
});

// ---------- install.sh --runtime a|b1 (T066, FR-041) ----------

const REPO_PATH = path.resolve(PANEL, "..");

test("install.sh --runtime a: switches from B1, keeps claude_path, says A is on, helper installed", () => {
  const s = sandbox({ claude: true, panelJson: { version: 1, claude_path: "/old/place/claude", node_path: "/old/node", repo_path: "/old/repo", runtime: "b1" } });
  const r = s.run("--runtime", "a");
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readCfg(s.cfgFile), { version: 1, claude_path: "/old/place/claude", node_path: path.join(s.bin, "node"), repo_path: REPO_PATH, runtime: "a" });
  assert.match(r.stdout, /^OK {3}runtime: A \(Claude API\)$/m);
  assert.match(r.stdout, /claude: not needed \(runtime A\)/);
  assert.ok(helperInstalled(s.calls()));
  assert.equal(fs.statSync(s.cfgFile).mode & 0o777, 0o600);
});

test("install.sh --runtime a: no panel.json and no Claude Code still works, and adds no claude_path", () => {
  const s = sandbox({ claude: false });
  const r = s.run("--runtime", "a");
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readCfg(s.cfgFile), { version: 1, node_path: path.join(s.bin, "node"), repo_path: REPO_PATH, runtime: "a" });
  assert.match(r.stdout, /runtime: A \(Claude API\)/);
});

test("install.sh --runtime b1: switching from A adds the missing claude_path and says B1 is on", () => {
  const s = sandbox({ claude: true, panelJson: { version: 1, node_path: "/old/node", repo_path: "/old/repo", runtime: "a" } });
  const r = s.run("--runtime", "b1");
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readCfg(s.cfgFile), { version: 1, claude_path: path.join(s.bin, "claude"), node_path: path.join(s.bin, "node"), repo_path: REPO_PATH, runtime: "b1" });
  assert.match(r.stdout, /^OK {3}runtime: B1 \(Claude Code\)$/m);
  assert.match(r.stdout, /^OK {3}claude: /m);
  assert.ok(helperInstalled(s.calls()), "the helper stays installed on B1, as with no flag");
});

test("install.sh --runtime b1 without Claude Code: a plain fix, still on A, nothing changed", () => {
  const s = sandbox({ claude: false, panelJson: { version: 1, node_path: "/old/node", repo_path: "/old/repo", runtime: "a" } });
  const before = fs.readFileSync(s.cfgFile, "utf8");
  const r = s.run("--runtime", "b1");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Claude Code isn't installed/);
  assert.match(r.stderr, /Install it, sign in with 'claude', and re-run/);
  assert.doesNotMatch(r.stdout, /runtime:/, "doesn't say B1 is on");
  assert.equal(fs.readFileSync(s.cfgFile, "utf8"), before);
  assert.equal(s.calls(), "", "stopped before changing anything");
});

test("install.sh --runtime: replaces a runtime panel.json doesn't know, since that's the fix", () => {
  const s = sandbox({ claude: false, panelJson: { version: 1, runtime: "c" } });
  const r = s.run("--runtime", "a");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readCfg(s.cfgFile).runtime, "a");
});

test("install.sh: refuses anything but --runtime a|b1, with nothing changed", () => {
  const refused = [["--runtime", "c"], ["--runtime", "A"], ["--runtime", "B1"], ["--runtime", ""], ["--runtime"], ["--runtime=a"], ["a"], ["--runtime", "a", "extra"]];
  for (const args of refused) {
    const s = sandbox({ claude: true, panelJson: { version: 1, claude_path: "/old/claude", runtime: "b1" } });
    const before = fs.readFileSync(s.cfgFile, "utf8");
    const r = s.run(...args);
    assert.equal(r.status, 1, JSON.stringify(args));
    assert.match(r.stderr, /^Use: bash panel\/install\.sh \[--runtime a\|b1\]$/m, JSON.stringify(args));
    assert.equal(r.stdout, "", JSON.stringify(args));
    assert.equal(fs.readFileSync(s.cfgFile, "utf8"), before, JSON.stringify(args));
    assert.equal(s.calls(), "", JSON.stringify(args));
  }
});

test("install.sh, no flag: says nothing new, and the runtime stays what it was", () => {
  for (const runtime of ["a", "b1", undefined]) {
    const panelJson = Object.assign({ version: 1 }, runtime ? { runtime } : {});
    const s = sandbox({ claude: true, panelJson });
    const r = s.run();
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /runtime: /);
    assert.equal(readCfg(s.cfgFile).runtime, runtime);
  }
});

test("install.sh: the sandbox never reaches the real home", () => {
  const s = sandbox({ claude: true });
  assert.equal(s.run("--runtime", "b1").status, 0);
  assert.ok(s.cfgFile.startsWith(os.tmpdir()), "panel.json is under the temp folder");
  assert.match(s.calls(), /^defaults write /m, "the stand-in defaults ran, not the real one");
});
