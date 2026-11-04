// Which tools a B1 lesson launches with (spec 013 FR-042, T065): the opening skill's own
// `allowed-tools`, its ae-mentor tools only, and easing's six when there's no skill to read.
"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { skillOf, allowedToolsOf, toolsForSkill, PREFIX } = require("../lib/skill-tools.js");
const { REQUESTS } = require("../lib/requests.js");

const REPO = path.resolve(__dirname, "..", "..");
const folders = [];
after(() => { for (const f of folders) fs.rmSync(f, { recursive: true, force: true }); });

// A runtime folder holding one skill's SKILL.md.
function runtimeWith(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "panel-skill-tools-"));
  folders.push(dir);
  fs.mkdirSync(path.join(dir, ".claude", "skills", name), { recursive: true });
  if (content !== undefined) fs.writeFileSync(path.join(dir, ".claude", "skills", name, "SKILL.md"), content);
  return dir;
}

test("skillOf: the name in a request's /name, and nothing else", () => {
  assert.equal(skillOf(REQUESTS.start.request), "ease-mentor");
  assert.equal(skillOf("/key-types-mentor"), "key-types-mentor");
  assert.equal(skillOf("/offset-mentor review"), "offset-mentor");
  assert.equal(skillOf("  /next-mentor\n"), "next-mentor");
  for (const other of [REQUESTS.check.request, REQUESTS.continue.request, "/sprint-plan", "please /ease-mentor", "/ease-mentor/x", "/../../x-mentor", "/-mentor", "", null, undefined, 7]) {
    assert.equal(skillOf(other), null, String(other));
  }
});

test("allowedToolsOf: inline, as a list, quoted, bracketed or with Windows line ends", () => {
  const want = ["a", "b"].map((t) => PREFIX + t);
  assert.deepEqual(allowedToolsOf(`---\nname: x\nallowed-tools: ${want.join(", ")}\n---\nBody`), want);
  assert.deepEqual(allowedToolsOf(`---\nallowed-tools: ${want.join(" ")}\n---\n`), want);
  assert.deepEqual(allowedToolsOf(`---\nallowed-tools: [${want.join(", ")}]\n---\n`), want);
  assert.deepEqual(allowedToolsOf(`---\nallowed-tools:\n  - ${want[0]}\n  - "${want[1]}"\nname: x\n---\n`), want);
  assert.deepEqual(allowedToolsOf(`---\r\nallowed-tools: ${want.join(", ")}\r\n---\r\nBody\r\n`), want);
});

test("allowedToolsOf: only ae-mentor tools, so Skill and anything else never reach B1's list", () => {
  const md = `---\nallowed-tools: ${PREFIX}recommend_next, Skill, Bash, mcp__after-effects__ae_run_script, --dangerously-skip-permissions, ${PREFIX}, ${PREFIX}*\n---\n`;
  assert.deepEqual(allowedToolsOf(md), [PREFIX + "recommend_next"]);
});

test("allowedToolsOf: only the frontmatter counts", () => {
  assert.equal(allowedToolsOf(`# Title\nallowed-tools: ${PREFIX}a\n`), null, "no frontmatter");
  assert.equal(allowedToolsOf(`---\nallowed-tools: ${PREFIX}a\n`), null, "frontmatter never closes");
  assert.deepEqual(allowedToolsOf(`---\nname: x\n---\nallowed-tools: ${PREFIX}a\n`), [], "a line in the body isn't the list");
  assert.deepEqual(allowedToolsOf("---\nallowed-tools:\n---\n"), []);
});

test("toolsForSkill reads SKILL.md under the runtime folder, through its link", () => {
  const dir = runtimeWith("real-mentor", `---\nallowed-tools: ${PREFIX}real_snapshot\n---\n`);
  assert.deepEqual(toolsForSkill("real-mentor", dir), [PREFIX + "real_snapshot"]);
  const linked = fs.mkdtempSync(path.join(os.tmpdir(), "panel-skill-tools-link-"));
  folders.push(linked);
  fs.mkdirSync(path.join(linked, ".claude", "skills"), { recursive: true });
  fs.symlinkSync(path.join(dir, ".claude", "skills", "real-mentor"), path.join(linked, ".claude", "skills", "real-mentor"));
  assert.deepEqual(toolsForSkill("real-mentor", linked), [PREFIX + "real_snapshot"]);
});

test("toolsForSkill is null when there's nothing usable, and never throws", () => {
  assert.equal(toolsForSkill("gone-mentor", runtimeWith("other-mentor")), null, "no such folder");
  assert.equal(toolsForSkill("empty-mentor", runtimeWith("empty-mentor")), null, "folder with no SKILL.md");
  assert.equal(toolsForSkill("x-mentor", runtimeWith("x-mentor", "no frontmatter")), null);
  assert.equal(toolsForSkill("x-mentor", runtimeWith("x-mentor", "---\nname: x\n---\n")), null, "no allowed-tools");
  assert.equal(toolsForSkill("x-mentor", runtimeWith("x-mentor", "---\nallowed-tools: Skill\n---\n")), null, "no ae-mentor tool in it");
  assert.equal(toolsForSkill("x-mentor", runtimeWith("x-mentor", "")), null, "an empty file");
  assert.equal(toolsForSkill("x-mentor", "/no/such/runtime"), null);
  assert.equal(toolsForSkill("x-mentor", null), null, "no runtime folder");
  const denied = { readFileSync() { throw Object.assign(new Error("EACCES"), { code: "EACCES" }); } };
  assert.equal(toolsForSkill("x-mentor", "/runtime", denied), null, "a read error");
});

test("toolsForSkill never reads a path a saved or typed name could point elsewhere", () => {
  const read = [];
  const spy = { readFileSync(p) { read.push(p); return ""; } };
  for (const bad of ["../../secrets-mentor", "x-mentor/../../y-mentor", "/etc/x-mentor", "sprint-plan", "", null, undefined, 7, {}, ["x-mentor"]]) {
    assert.equal(toolsForSkill(bad, "/runtime", spy), null, String(bad));
  }
  assert.deepEqual(read, []);
});

test("every real mentor skill: the same list the helper and the runners read, minus Skill", async () => {
  const { readSkill, listSkills } = await import(path.join(REPO, "panel", "helper", "lib", "skills.mjs"));
  const { toolSets } = await import(path.join(REPO, "product", "evals", "lib", "skill-tools.mjs"));
  const skillsDir = path.join(REPO, ".claude", "skills");
  const names = listSkills(skillsDir);
  assert.ok(names.length >= 7, names.join());
  for (const name of names) {
    const { allowedTools } = readSkill(skillsDir, name);
    const expected = allowedTools.filter((t) => t !== "Skill").map((t) => PREFIX + t);
    assert.deepEqual(toolsForSkill(name, REPO), expected, name);
    assert.deepEqual(toolSets(REPO, name).allowed.filter((t) => t !== "Skill").map((t) => PREFIX + t), expected, name);
  }
});

test("the panel's wiring: start names the request's skill and saves it; Continue passes the save's", () => {
  // main.js needs the host page, so this one reads its source. The behaviour behind each line is
  // tested in adapter.test.js and panel-session.test.js.
  const main = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
  assert.match(main, /const skill = skillOf\(REQUESTS\.start\.request\)/);
  assert.match(main, /state\.adapter\.start\(\{ skill \}\)/);
  assert.match(main, /ps\.newPanelSession\(\{ claude_session_id: id, lesson: state\.view, skill \}\)/);
  assert.match(main, /state\.adapter\.start\(\{ resumeSessionId: saved\.claude_session_id, skill: saved\.skill \}\)/);
});
