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
  return { code: r.status, err: r.stderr, out: r.stdout };
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

test("AE lock: two top-level sessions are told apart by session_id; the second is blocked with where", (t) => {
  const r = makeRepo(); t.after(r.done);
  const wt = path.join(r.dir, "..", path.basename(r.dir) + "-wt2");
  r.g("worktree", "add", "-q", "-b", "wt2", wt);
  t.after(() => fs.rmSync(wt, { recursive: true, force: true }));
  assert.equal(run("ae-lock.mjs", { ...ae(wt, null), session_id: "S1" }).code, 0);
  const b = run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S2" });
  assert.equal(b.code, 2);
  assert.match(b.err, new RegExp(`top-level session is driving After Effects from ${path.basename(wt)}`));
  assert.equal(run("ae-lock.mjs", { ...ae(wt, null), session_id: "S1" }).code, 0);
});

test("AE lock: a subagent is blocked while its own cockpit holds it", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S1" }).code, 0);
  assert.equal(run("ae-lock.mjs", { ...ae(r.dir, builderA), session_id: "S1" }).code, 2);
});

test("AE lock: SubagentStop never frees a top-level session's lock; SessionEnd frees its own session only", (t) => {
  const r = makeRepo(); t.after(r.done);
  run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S1" });
  run("ae-lock.mjs", { cwd: r.dir, session_id: "S1" }, ["--release"]);
  run("ae-lock.mjs", { cwd: r.dir, session_id: "S2" }, ["--end-session"]);
  assert.equal(run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S2" }).code, 2);
  run("ae-lock.mjs", { cwd: r.dir, session_id: "S1" }, ["--end-session"]);
  assert.equal(run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S2" }).code, 0);
});

test("AE lock: SessionEnd also frees a lock held by one of that session's subagents", (t) => {
  const r = makeRepo(); t.after(r.done);
  run("ae-lock.mjs", { ...ae(r.dir, builderA), session_id: "S1" });
  run("ae-lock.mjs", { cwd: r.dir, session_id: "S1" }, ["--end-session"]);
  assert.equal(run("ae-lock.mjs", { ...ae(r.dir, null), session_id: "S2" }).code, 0);
});

// --- git guard ---

const bash = (cwd, command, who) => ({ cwd, tool_input: { command }, ...(who ? sub(who, "g1") : {}) });

test("git guard: shared-tree commands are blocked for everyone on main", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git add -A", "git add .", "cd x && git add --all", "git -C . add -u", "git commit -am wip", "git reset --hard",
    "git --no-pager reset --hard", "git -c core.pager=cat stash", "git --git-dir .git clean -fd", "git -p checkout -- .",
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

test("git guard: every cockpit push asks the human, however it's written; other git work doesn't", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git push", "git push origin main", "git -C . push origin main", "cd x && git push"]) {
    const res = run("git-guard.mjs", bash(r.dir, c));
    assert.equal(res.code, 0, c);
    assert.equal(JSON.parse(res.out).hookSpecificOutput.permissionDecision, "ask", c);
  }
  for (const c of ["git merge --no-edit feature", "git status", "git log --oneline -5"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).out, "", c);
  }
});

test("git guard: subagents can't remove worktrees or delete, force or rename branches; the cockpit can", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git worktree remove --force ../wt", "git worktree prune", "git worktree move a b", "git branch -D skill-x",
    "git branch -d skill-x", "git branch --delete skill-x", "git branch -f main HEAD~1", "git branch -m old new"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "skill-builder")).code, 2, c);
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 0, c);
  }
  for (const c of ["git branch", "git branch -a", "git branch --merged", "git worktree list"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "skill-builder")).code, 0, c);
  }
});

test("git guard: a subagent can't switch branches in the shared tree, but can restore its own file", (t) => {
  const r = makeRepo(); t.after(r.done);
  for (const c of ["git checkout feature", "git checkout -b new", "git switch main", "git switch -c new"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "spec-writer")).code, 2, c);
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 0, c);
  }
  for (const c of ["git checkout -- specs/004-x/spec.md", "git restore specs/004-x/spec.md"]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "spec-writer")).code, 0, c);
  }
});

test("git guard: inside its own worktree a subagent may switch branches", (t) => {
  const r = makeRepo(); t.after(r.done);
  const wt = path.join(r.dir, "..", path.basename(r.dir) + "-wt3");
  r.g("worktree", "add", "-q", "-b", "wt", wt);
  t.after(() => fs.rmSync(wt, { recursive: true, force: true }));
  assert.equal(run("git-guard.mjs", bash(wt, "git checkout -b wt-2", "skill-builder")).code, 0);
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

test("git guard: shared-tree rules follow where git acts, not where the agent stands", (t) => {
  const r = makeRepo(); t.after(r.done);
  const wtA = path.join(r.dir, "..", path.basename(r.dir) + "-wtA");
  const wtB = path.join(r.dir, "..", path.basename(r.dir) + "-wtB");
  r.g("worktree", "add", "-q", "-b", "a", wtA);
  r.g("worktree", "add", "-q", "-b", "b", wtB);
  fs.mkdirSync(path.join(wtA, "sub"));
  t.after(() => { fs.rmSync(wtA, { recursive: true, force: true }); fs.rmSync(wtB, { recursive: true, force: true }); });
  // Its own worktree, however it's reached from inside it.
  for (const c of ["git reset --hard main", `git -C ${wtA} reset --hard main`, "cd sub && git add -A", "git -C sub clean -fd"]) {
    assert.equal(run("git-guard.mjs", bash(wtA, c, "skill-builder")).code, 0, c);
  }
  // The main tree or another agent's worktree, reached from inside a worktree.
  for (const c of [`git -C ${r.dir} reset --hard`, `cd ${r.dir} && git reset --hard`, `cd .. && cd ${r.dir} && git stash`,
    `git -C '${wtB}' reset --hard`, `cd "${wtB}"; git clean -fd`, `cd ${r.dir} && git checkout main`]) {
    assert.equal(run("git-guard.mjs", bash(wtA, c, "skill-builder")).code, 2, c);
  }
  // Where git acts can't be worked out, so it counts as the shared tree.
  for (const c of [`(cd ${r.dir} && git reset --hard)`, `GIT_DIR=${r.dir}/.git git reset --hard`, "cd $HOME && git stash",
    `git --work-tree=${r.dir} reset --hard`, `bash -c 'cd ${r.dir}; git reset --hard'`]) {
    assert.equal(run("git-guard.mjs", bash(wtA, c, "skill-builder")).code, 2, c);
  }
  // From the main tree, a worktree isn't the caller's own: it may hold another agent's work.
  for (const c of [`git -C ${wtA} reset --hard`, `cd ${wtA} && git reset --hard`]) {
    assert.equal(run("git-guard.mjs", bash(r.dir, c, "skill-builder")).code, 2, c);
    assert.equal(run("git-guard.mjs", bash(r.dir, c)).code, 2, c);
  }
});

test("git guard: a subagent may read with merge-base, but not merge", (t) => {
  const r = makeRepo(); t.after(r.done);
  assert.equal(run("git-guard.mjs", bash(r.dir, "git merge-base main HEAD", "reviewer")).code, 0);
  assert.equal(run("git-guard.mjs", bash(r.dir, "git merge main", "reviewer")).code, 2);
  assert.equal(run("git-guard.mjs", bash(r.dir, "git merge --ff-only main", "reviewer")).code, 2);
});

test("git guard: unreadable input blocks", () => {
  assert.equal(run("git-guard.mjs", "nope").code, 2);
});

// --- AE script guard ---

const aeScript = (script, who) => ({ tool_name: "mcp__after-effects__ae_run_script", tool_input: { script }, ...(who ? sub(who, "s1") : {}) });

test("AE script guard: a subagent's script that reaches past the comp is blocked; the cockpit's isn't", () => {
  for (const s of [
    'system.callSystem("rm -rf ~/x");',
    "app.project.save();",
    'app.project.save(new File("~/Desktop/x.aep"));',
    'new File("~/notes.txt").remove();',
    "app.project.activeItem.layer(1).remove();",
    'var f = new File("~/x.txt"); f.open("w"); f.write("x"); f.close();',
    "new File('~/a.jsx').execute();",
    "app.quit();",
    "app.project.close(CloseOptions.SAVE_CHANGES);",
  ]) {
    assert.equal(run("ae-script-guard.mjs", aeScript(s, "skill-builder")).code, 2, s);
    assert.equal(run("ae-script-guard.mjs", aeScript(s)).code, 0, s);
  }
});

test("AE script guard: reads and in-comp builds pass", () => {
  for (const s of [
    "var c = app.project.activeItem; return c.numLayers;",
    "var p = app.project.activeItem.layer(1).property('ADBE Transform Group').property('ADBE Position'); return p.numKeys;",
    "app.project.activeItem.layers.addNull(); return 1;",
    'var f = new File("~/x.txt"); f.open("r"); var t = f.read(); f.close(); return t;',
  ]) {
    assert.equal(run("ae-script-guard.mjs", aeScript(s, "skill-builder")).code, 0, s);
  }
});

test("AE script guard: unreadable input or no script blocks a subagent", () => {
  assert.equal(run("ae-script-guard.mjs", "nope").code, 2);
  assert.equal(run("ae-script-guard.mjs", sub("skill-builder", "s2", { tool_input: {} })).code, 2);
});

// --- settings ---

test("settings: every PreToolUse hook blocks when it fails, and pushes ask", () => {
  const s = JSON.parse(fs.readFileSync(path.join(HOOKS, "..", "settings.json"), "utf8"));
  for (const entry of s.hooks.PreToolUse) {
    for (const h of entry.hooks) assert.equal(h.onFailure, "block", entry.matcher);
  }
  assert.ok(s.permissions.ask.includes("Bash(git push *)"));
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

test("check-branch: a skill branch may add mentor files but only the shared owner changes existing ones", (t) => {
  const r = makeRepo(); t.after(r.done);
  fs.mkdirSync(path.join(r.dir, "mentor/tools"), { recursive: true });
  fs.writeFileSync(path.join(r.dir, "mentor/tools/common.mjs"), "a");
  r.g("add", "mentor/tools/common.mjs"); r.g("commit", "-q", "-m", "shared");
  r.g("checkout", "-q", "-b", "skill-y");
  fs.writeFileSync(path.join(r.dir, "mentor/tools/speed.mjs"), "");
  r.g("add", "mentor/tools/speed.mjs"); r.g("commit", "-q", "-m", "own tool");
  const script = path.join(HOOKS, "check-branch.mjs");
  const added = spawnSync("node", [script, "skill-y", "skill-builder"], { cwd: r.dir, encoding: "utf8" });
  assert.equal(added.status, 0, added.stdout + added.stderr);
  fs.writeFileSync(path.join(r.dir, "mentor/tools/common.mjs"), "b");
  r.g("add", "mentor/tools/common.mjs"); r.g("commit", "-q", "-m", "edit shared");
  const edited = spawnSync("node", [script, "skill-y", "skill-builder"], { cwd: r.dir, encoding: "utf8" });
  assert.equal(edited.status, 1);
  assert.match(edited.stdout, /mentor\/tools\/common.mjs  \(shared: changes go to the shared-code owner\)/);
  const owner = spawnSync("node", [script, "skill-y", "skill-builder", "--shared-owner"], { cwd: r.dir, encoding: "utf8" });
  assert.equal(owner.status, 0, owner.stdout + owner.stderr);
});
