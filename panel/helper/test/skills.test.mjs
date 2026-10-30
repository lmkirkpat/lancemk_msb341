import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSkill, listSkills, commandOf, SKILL_PATTERN, SkillError } from "../lib/skills.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILLS = path.join(REPO, ".claude", "skills");
const MENTORS = ["anchor-mentor", "ease-mentor", "key-types-mentor", "next-mentor", "null-parenting-mentor", "offset-mentor", "speed-graph-mentor"];

// The body as an independent reading: everything after the second line that is exactly "---".
function independentBody(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const close = lines.indexOf("---", 1);
  return lines.slice(close + 1).join("\n");
}

test("the pattern is runtime.js's", () => {
  const runtimeJs = fs.readFileSync(path.join(REPO, "panel", "lib", "runtime.js"), "utf8");
  assert.ok(runtimeJs.includes(`const SKILL_PATTERN = ${SKILL_PATTERN.toString()};`));
});

test("lists exactly the repo's mentor skills, no builder skills", () => {
  assert.deepEqual(listSkills(SKILLS), MENTORS);
});

for (const name of MENTORS) {
  test(`${name}: body byte for byte, allowed-tools without the server prefix`, () => {
    const file = path.join(SKILLS, name, "SKILL.md");
    const s = readSkill(SKILLS, name);
    assert.equal(s.name, name);
    assert.equal(s.body, independentBody(file));
    assert.ok(Buffer.from(s.body).length > 500);
    assert.ok(fs.readFileSync(file).subarray(-Buffer.from(s.body).length).equals(Buffer.from(s.body)), "the body is the file's last bytes");
    assert.ok(!s.body.startsWith("---"));
    const raw = /^allowed-tools:\s*(.*)$/m.exec(fs.readFileSync(file, "utf8"))[1].split(/,\s*/);
    assert.deepEqual(s.allowedTools, raw.map((t) => t.replace(/^mcp__ae-mentor__/, "")));
    assert.ok(s.allowedTools.every((t) => !t.includes("mcp__")));
  });
}

test("ease-mentor and next-mentor tool lists (next-mentor keeps Skill)", () => {
  assert.deepEqual(readSkill(SKILLS, "ease-mentor").allowedTools, ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson"]);
  assert.deepEqual(readSkill(SKILLS, "next-mentor").allowedTools, ["read_learner_record", "recommend_next", "Skill"]);
});

test("only *-mentor names; builder skills and paths are refused", () => {
  for (const bad of ["agent-audit", "decision", "../ease-mentor", "ease-mentor/../../x", "Ease-Mentor", "", null, "-mentor"]) {
    assert.throws(() => readSkill(SKILLS, bad), (e) => e instanceof SkillError && e.code === "NOT_A_MENTOR_SKILL", String(bad));
  }
  assert.throws(() => readSkill(SKILLS, "made-up-mentor"), (e) => e.code === "NO_SUCH_SKILL");
});

test("YAML-list tools, CRLF-free bodies, and a body that is empty", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skills-"));
  fs.mkdirSync(path.join(dir, "list-mentor"));
  fs.writeFileSync(path.join(dir, "list-mentor", "SKILL.md"), "---\nname: list-mentor\nallowed-tools:\n  - mcp__ae-mentor__a\n  - Skill\n---\n\n# Body\n---\nmore\n");
  const s = readSkill(dir, "list-mentor");
  assert.deepEqual(s.allowedTools, ["a", "Skill"]);
  assert.equal(s.body, "\n# Body\n---\nmore\n");
  fs.mkdirSync(path.join(dir, "empty-mentor"));
  fs.writeFileSync(path.join(dir, "empty-mentor", "SKILL.md"), "---\nname: empty-mentor\n---");
  assert.equal(readSkill(dir, "empty-mentor").body, "");
  fs.mkdirSync(path.join(dir, "open-mentor"));
  fs.writeFileSync(path.join(dir, "open-mentor", "SKILL.md"), "---\nname: open-mentor\n");
  assert.throws(() => readSkill(dir, "open-mentor"), (e) => e.code === "NO_FRONTMATTER");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("a skill command at the start of a message", () => {
  assert.deepEqual(commandOf("/ease-mentor"), { name: "ease-mentor", args: "" });
  assert.deepEqual(commandOf("/offset-mentor review"), { name: "offset-mentor", args: "review" });
  assert.deepEqual(commandOf("/null-parenting-mentor Tile, Caption"), { name: "null-parenting-mentor", args: "Tile, Caption" });
  assert.equal(commandOf("I'm done. Check my work."), null);
  assert.equal(commandOf("/agent-audit"), null);
  assert.equal(commandOf("/ease-mentorX"), null);
  assert.equal(commandOf("please /ease-mentor"), null);
});
