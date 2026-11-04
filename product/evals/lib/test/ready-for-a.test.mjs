// Spec 013 T067 (FR-043): the free readiness check. Synthetic skills in a temp repo, with the server's
// tool list and the dry run injected; then the real repo's seven skills, with a real dry run.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readyForA, runnerFor, toolsNamedIn, render } from "../ready-for-a.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SERVER = { tools: ["a_snapshot", "a_demo", "preview_frame", "snapshot_project"].map((name) => ({ name })) };

function tempRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rfa-"));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
const skill = (name, tools, body) => `---\nname: ${name}\nallowed-tools: ${tools}\n---\n${body}\n`;
const RUNNER = (name) => `const x = ab.toolSets(REPO, "${name}");\n`;
const ok = () => ({ ok: true, detail: "dry run fine" });
const status = (r, check) => r.checks.find((c) => c.check === check).status;

test("a ready skill passes all four checks", async () => {
  const repo = tempRepo({
    ".claude/skills/x-mentor/SKILL.md": skill("x-mentor", "mcp__ae-mentor__a_snapshot, mcp__ae-mentor__a_demo, Skill", "Start with a_snapshot. Show a demo and a snapshot of the comp in plain words."),
    "product/evals/x/run.mjs": RUNNER("x-mentor"),
  });
  const r = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: ok });
  assert.equal(r.ok, true, render(r));
  assert.deepEqual(r.checks.map((c) => c.status), ["pass", "pass", "pass", "pass"]);
  fs.rmSync(repo, { recursive: true, force: true });
});

test("a name A refuses, a frontmatter name that differs, and a missing file each fail the name check", async () => {
  const repo = tempRepo({
    ".claude/skills/helper/SKILL.md": skill("helper", "mcp__ae-mentor__a_demo", "x"),
    ".claude/skills/y-mentor/SKILL.md": skill("other-mentor", "mcp__ae-mentor__a_demo", "x"),
  });
  assert.equal(status(await readyForA({ repo, skill: "helper", server: SERVER, dryRun: ok }), "name"), "fail");
  assert.equal(status(await readyForA({ repo, skill: "y-mentor", server: SERVER, dryRun: ok }), "name"), "fail");
  const gone = await readyForA({ repo, skill: "gone-mentor", server: SERVER, dryRun: ok });
  assert.equal(gone.ok, false);
  assert.equal(status(gone, "name"), "fail");
  fs.rmSync(repo, { recursive: true, force: true });
});

test("an allowed tool the server doesn't list fails; Skill is fine", async () => {
  const repo = tempRepo({ ".claude/skills/x-mentor/SKILL.md": skill("x-mentor", "mcp__ae-mentor__ghost_tool, Skill", "x") });
  const r = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: ok });
  assert.equal(status(r, "listed"), "fail");
  assert.match(r.checks.find((c) => c.check === "listed").detail, /ghost_tool/);
  assert.doesNotMatch(r.checks.find((c) => c.check === "listed").detail, /Skill/);
  fs.rmSync(repo, { recursive: true, force: true });
});

test("a tool the body names but the skill doesn't allow fails, with the line; plain words and prefixed forms are judged by the real tool list", async () => {
  const repo = tempRepo({ ".claude/skills/x-mentor/SKILL.md": skill("x-mentor", "mcp__ae-mentor__a_snapshot", "Plain words: demo, snapshot, preview.\nCall mcp__ae-mentor__a_demo now.\nUse snapshot_project.") });
  const r = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: ok });
  assert.equal(status(r, "body"), "fail");
  const d = r.checks.find((c) => c.check === "body").detail;
  assert.match(d, /a_demo \(line 2/);
  assert.match(d, /snapshot_project \(line 3/);
  assert.doesNotMatch(d, /preview_frame/);
  fs.rmSync(repo, { recursive: true, force: true });
});

test("a tool named only after 'never' passes with a note; named elsewhere too, it fails", async () => {
  const mk = (body) => tempRepo({ ".claude/skills/x-mentor/SKILL.md": skill("x-mentor", "mcp__ae-mentor__a_snapshot", body) });
  let repo = mk("Use the snapshot tool, never `snapshot_project`.");
  let r = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: ok });
  assert.equal(status(r, "body"), "pass");
  assert.match(r.checks.find((c) => c.check === "body").detail, /only to forbid: snapshot_project \(line 1\)/);
  fs.rmSync(repo, { recursive: true, force: true });
  repo = mk("Never call snapshot_project.\nThen call snapshot_project.");
  r = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: ok });
  assert.equal(status(r, "body"), "fail");
  fs.rmSync(repo, { recursive: true, force: true });
});

test("no runner is reported as n/a, not a failure; a failing dry run is a failure", async () => {
  const repo = tempRepo({ ".claude/skills/x-mentor/SKILL.md": skill("x-mentor", "mcp__ae-mentor__a_demo", "x") });
  const none = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: () => assert.fail("must not run") });
  assert.equal(status(none, "runner"), "none");
  assert.equal(none.ok, true);
  assert.match(render(none), /n\/a +runner: no runner/);
  fs.mkdirSync(path.join(repo, "product/evals/x"), { recursive: true });
  fs.writeFileSync(path.join(repo, "product/evals/x/run.mjs"), RUNNER("x-mentor"));
  const bad = await readyForA({ repo, skill: "x-mentor", server: SERVER, dryRun: () => ({ ok: false, detail: "exit 1: boom" }) });
  assert.equal(status(bad, "runner"), "fail");
  assert.equal(bad.ok, false);
  fs.rmSync(repo, { recursive: true, force: true });
});

test("toolsNamedIn needs the whole name: a longer word doesn't count", () => {
  assert.deepEqual([...toolsNamedIn("a_demo_extra and xa_demo and a_demo.", ["a_demo"])], [["a_demo", [1]]]);
});

test("the real repo: every skill's runner is found (next-mentor has none) and all seven are ready, with a real dry run", async () => {
  assert.equal(runnerFor(REPO, "ease-mentor"), "easing");
  assert.equal(runnerFor(REPO, "null-parenting-mentor"), "null-parenting");
  assert.equal(runnerFor(REPO, "next-mentor"), null);
  const skills = fs.readdirSync(path.join(REPO, ".claude", "skills")).filter((n) => n.endsWith("-mentor")).sort();
  assert.equal(skills.length, 7);
  for (const s of skills) {
    const r = await readyForA({ repo: REPO, skill: s });
    assert.equal(r.ok, true, render(r));
  }
});
