// Tests for the agent team's hooks (decisions/008). Run: node --test .claude/hooks/test/
// Each hook runs as a child process against a throwaway git repo, the way Claude Code runs it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { globToRegExp, owns, loadOwnership } from "../lib.mjs";

const HOOKS = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TABLE = loadOwnership(path.join(HOOKS, "ownership.json"));

function makeRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.homedir(), ".knack-hook-test-")));
  const g = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...a], { cwd: dir, stdio: "ignore" });
  g("init", "-q", "-b", "main");
  g("commit", "-q", "--allow-empty", "-m", "init");
  return { dir, g, done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function run(hook, payload, args = []) {
  const input = typeof payload === "string" ? payload : JSON.stringify(payload);
  const r = spawnSync("node", [path.join(HOOKS, hook), ...args], { input, encoding: "utf8" });
  return { code: r.status, err: r.stderr };
}

const sub = (type, id, extra) => ({ agent_type: type, agent_id: id, ...extra });

// --- glob and table ---

test("globs: * stays in one folder, ** crosses folders, ! takes paths back out", () => {
  assert.ok(globToRegExp("specs/*/spec.md").test("specs/004-x/spec.md"));
  assert.ok(!globToRegExp("specs/*/spec.md").test("specs/a/b/spec.md"));
  assert.ok(globToRegExp("mentor/**").test("mentor/test/a.test.js"));
  assert.ok(owns(["specs/**", "!specs/*/teaching-design.md"], "specs/004-x/plan.md"));
  assert.ok(!owns(["specs/**", "!specs/*/teaching-design.md"], "specs/004-x/teaching-design.md"));
});

test("table: builders don't own eval cases, and the eval engineer doesn't own skills or tools", () => {
  const a = TABLE.agents;
  assert.ok(!owns(a["skill-builder"], "product/evals/easing/cases/01-new-learner-opening.json"));
  assert.ok(!owns(a["panel-builder"], "product/evals/easing/cases/17-button-check-partial.json"));
  assert.ok(!owns(a["eval-engineer"], ".claude/skills/ease-mentor/SKILL.md"));
  assert.ok(!owns(a["eval-engineer"], "mentor/tools/easing.mjs"));
  assert.ok(owns(a["eval-engineer"], "product/evals/easing/cases/26-new.json"));
  assert.ok(owns(a["skill-builder"], ".claude/skills/ease-mentor/SKILL.md"));
});

test("table: the teaching design and the spec have different owners", () => {
  const a = TABLE.agents;
  assert.ok(owns(a["curriculum-designer"], "specs/004-curriculum/curriculum.md"));
  assert.ok(!owns(a["spec-writer"], "specs/004-curriculum/curriculum.md"));
  assert.ok(owns(a["spec-writer"], "specs/004-curriculum/spec.md"));
  assert.ok(!owns(a["curriculum-designer"], "specs/004-curriculum/spec.md"));
});

test("table: nobody but the cockpit owns the agents, hooks, decisions or CLAUDE.md", () => {
  for (const f of [".claude/agents/reviewer.md", ".claude/hooks/ownership.json", ".claude/settings.json", "decisions/009-x.md", "CLAUDE.md"]) {
    for (const [name, pats] of Object.entries(TABLE.agents)) assert.ok(!owns(pats, f), `${name} owns ${f}`);
  }
});

// --- ownership hook ---

test("ownership: the cockpit writes anywhere", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ownership.mjs", { cwd: r.dir, tool_input: { file_path: path.join(r.dir, "CLAUDE.md") } }).code, 0);
});

test("ownership: a persona writes its own files and is blocked elsewhere, with the owner named", (t) => {
  const r = makeRepo(); t.after(r.done);
  const ok = run("ownership.mjs", sub("eval-engineer", "a1", { cwd: r.dir, tool_input: { file_path: path.join(r.dir, "product/evals/x/cases/01.json") } }));
  assert.equal(ok.code, 0);
  const no = run("ownership.mjs", sub("eval-engineer", "a1", { cwd: r.dir, tool_input: { file_path: path.join(r.dir, ".claude/skills/ease-mentor/SKILL.md") } }));
  assert.equal(no.code, 2);
  assert.match(no.err, /belongs to skill-builder/);
});

test("ownership: read-only reviewers can't write at all", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const who of ["reviewer", "design-reviewer"]) {
    assert.equal(run("ownership.mjs", sub(who, "a2", { cwd: r.dir, tool_input: { file_path: path.join(r.dir, "notes.md") } })).code, 2);
  }
});

test("ownership: an unlisted subagent type gets no writes", (t) => {
  const r = makeRepo(); t.after(r.done);
  const res = run("ownership.mjs", sub("general-purpose", "a3", { cwd: r.dir, tool_input: { file_path: path.join(r.dir, "mentor/x.mjs") } }));
  assert.equal(res.code, 2);
  assert.match(res.err, /isn't in .claude\/hooks\/ownership.json/);
});

test("ownership: relative paths resolve against cwd; temp is open; outside the repo is blocked", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ownership.mjs", sub("panel-builder", "a4", { cwd: r.dir, tool_input: { file_path: "panel/main.js" } })).code, 0);
  assert.equal(run("ownership.mjs", sub("panel-builder", "a4", { cwd: r.dir, tool_input: { file_path: path.join(os.tmpdir(), "scratch.txt") } })).code, 0);
  const home = path.join(os.homedir(), "Library", "Application Support", "AEMentor", "learner.json");
  assert.equal(run("ownership.mjs", sub("skill-builder", "a5", { cwd: r.dir, tool_input: { file_path: home } })).code, 2);
});

test("ownership: unreadable input or no file path blocks a subagent", () => {
  assert.equal(run("ownership.mjs", "not json").code, 2);
  assert.equal(run("ownership.mjs", sub("skill-builder", "a6", { tool_input: {} })).code, 2);
});

// --- AE lock ---

const ae = (cwd, who, tool = "mcp__after-effects__ae_status") => ({ cwd, tool_name: tool, ...(who ? sub(who.type, who.id) : {}) });
const builderA = { type: "skill-builder", id: "A" };
const builderB = { type: "skill-builder", id: "B" };

test("AE lock: the first agent holds it; a second is blocked by name; the holder keeps going", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA)).code, 0);
  const b = run("ae-lock.mjs", ae(r.dir, builderB, "mcp__ae-mentor__set_ease"));
  assert.equal(b.code, 2);
  assert.match(b.err, /skill-builder is driving After Effects/);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA, "mcp__ae-mentor__snapshot_project")).code, 0);
});

test("AE lock: two subagents of the same type are told apart by agent_id; the cockpit is blocked too", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA)).code, 0);
  assert.equal(run("ae-lock.mjs", ae(r.dir, null)).code, 2);
});

test("AE lock: reading the learner record never needs the lock", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA)).code, 0);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderB, "mcp__ae-mentor__read_learner_record")).code, 0);
});

test("AE lock: release frees it for the holder only", (t) => {
  const r = makeRepo(); t.after(r.done);
  run("ae-lock.mjs", ae(r.dir, builderA));
  run("ae-lock.mjs", { cwd: r.dir, ...sub("skill-builder", "B") }, ["--release"]);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderB)).code, 2);
  run("ae-lock.mjs", { cwd: r.dir, ...sub("skill-builder", "A") }, ["--release"]);
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderB)).code, 0);
});

test("AE lock: a lease idle for 10 minutes can be taken", (t) => {
  const r = makeRepo(); t.after(r.done);
  run("ae-lock.mjs", ae(r.dir, builderA));
  const lockFile = path.join(r.dir, ".git", "knack-agents", "ae.lock.json");
  const lock = JSON.parse(fs.readFileSync(lockFile, "utf8"));
  fs.writeFileSync(lockFile, JSON.stringify({ ...lock, last: Date.now() - 11 * 60 * 1000 }));
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderB)).code, 0);
});

test("AE lock: a worktree shares the main checkout's lock", (t) => {
  const r = makeRepo(); t.after(r.done);
  const wt = path.join(r.dir, "..", path.basename(r.dir) + "-wt");
  r.g("worktree", "add", "-q", "-b", "wt", wt);
  t.after(() => fs.rmSync(wt, { recursive: true, force: true }));
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA)).code, 0);
  assert.equal(run("ae-lock.mjs", ae(wt, builderB)).code, 2);
});

test("AE lock: an unreadable lock file or input blocks", (t) => {
  const r = makeRepo(); t.after(r.done);
  run("ae-lock.mjs", ae(r.dir, builderA));
  fs.writeFileSync(path.join(r.dir, ".git", "knack-agents", "ae.lock.json"), "{oops");
  assert.equal(run("ae-lock.mjs", ae(r.dir, builderA)).code, 2);
  assert.equal(run("ae-lock.mjs", "").code, 2);
});

// --- git guard ---

const bash = (cwd, command, who) => ({ cwd, tool_input: { command }, ...(who ? sub(who, "g1") : {}) });

test("git guard: shared-tree commands are blocked for everyone on main", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git add -A", "git add .", "cd x && git add --all", "git -C . add -u", "git commit -am wip", "git reset --hard",
    "git clean -fd", "git stash", "git checkout -- .", "git restore ."]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 2, c);
  }
});

test("git guard: ordinary git work passes", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git add mentor/tools.mjs", "git commit -m 'add a tool'", "git commit --amend --no-edit", "git status",
    "git stash list", "git diff main...feature", "ls -la", "git log --oneline -5"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "skill-builder")).code, 0, c);
  }
});

test("git guard: the cockpit may push and merge; subagents may not", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git push", "git push origin main", "git merge --no-edit feature"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 0, c);
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "panel-builder")).code, 2, c);
  }
  assert.equal(run("git-guard.mjs", bash(r.dir, "git rebase main", "skill-builder")).code, 2);
});

test("git guard: force-push is blocked even for the cockpit", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git push --force", "git push -f origin main", "git push --force-with-lease"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 2, c);
  }
});

test("git guard: inside its own worktree an agent may stage everything", (t) => {
  const r = makeRepo(); t.after(r.done);
  const wt = path.join(r.dir, "..", path.basename(r.dir) + "-wt2");
  r.g("worktree", "add", "-q", "-b", "wt", wt);
  t.after(() => fs.rmSync(wt, { recursive: true, force: true }));
  assert.equal(run("git-guard.mjs", bash(wt, "git add -A", "skill-builder")).code, 0);
  assert.equal(run("git-guard.mjs", bash(wt, "git push", "skill-builder")).code, 2);
});

test("git guard: unreadable input blocks", () => {
  assert.equal(run("git-guard.mjs", "nope").code, 2);
});

// --- merge check ---

test("check-branch: lists files a branch changed outside its agent's", (t) => {
  const r = makeRepo(); t.after(r.done);
  r.g("checkout", "-q", "-b", "skill-x");
  fs.mkdirSync(path.join(r.dir, "mentor"), { recursive: true });
  fs.mkdirSync(path.join(r.dir, "product/evals/x"), { recursive: true });
  fs.writeFileSync(path.join(r.dir, "mentor/x.mjs"), "");
  r.g("add", "mentor/x.mjs"); r.g("commit", "-q", "-m", "tool");
  const script = path.join(HOOKS, "check-branch.mjs");
  const clean = spawnSync("node", [script, "skill-x", "skill-builder"], { cwd: r.dir, encoding: "utf8" });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  fs.writeFileSync(path.join(r.dir, "product/evals/x/case.json"), "{}");
  r.g("add", "product/evals/x/case.json"); r.g("commit", "-q", "-m", "sneaky");
  const dirty = spawnSync("node", [script, "skill-x", "skill-builder"], { cwd: r.dir, encoding: "utf8" });
  assert.equal(dirty.status, 1);
  assert.match(dirty.stdout, /product\/evals\/x\/case.json  \(owner: eval-engineer\)/);
});
