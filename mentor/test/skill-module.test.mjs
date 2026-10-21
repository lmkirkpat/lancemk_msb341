// The skill-module contract (contracts/skill-module.md): a skill added as files only is found by
// the same discovery mentor/tools/index.mjs uses, its finders collected, its skill ID accepted by
// record_lesson. Plus easing's own finder (T016) and a skill's own error codes.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES, tempHome } from "./helpers.mjs";

tempHome();
const { discover } = await import("../tools/index.mjs");
const easing = await import("../tools/easing.mjs");
const { analyze } = await import("../lib/analyze.mjs");
const errors = await import("../errors.mjs");
const { toError } = await import("../bridge-client.mjs");

const TOOLS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tools");
const SAMPLE = path.join(FIXTURES, "sample-skill");
const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));

// Every tool a new skill adds starts with its prefix (contracts/skill-module.md › 2). Easing's tools
// predate the rule, so the lint is for new skills.
const lintPrefix = (tools, prefix) => tools.map((t) => t.name).filter((n) => !n.startsWith(prefix));

function tempTools(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-tools-"));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}
const toolFile = (skill, tool, finders = "") =>
  `export const SKILLS = [${JSON.stringify(skill)}];\n` +
  `export const FINDERS = {${finders}};\n` +
  `export const TOOLS = [{ name: ${JSON.stringify(tool)}, title: "t", description: "d", ` +
  `inputSchema: { type: "object", properties: {} }, handler: async () => ({ content: [] }) }];\n`;

test("a sample skill added as files is found: tools, finder, and its ID in record_lesson's enum", async () => {
  const found = await discover([TOOLS_DIR, path.join(SAMPLE, "tools")]);
  const names = found.TOOLS.map((t) => t.name);
  for (const n of ["sample_snapshot", "sample_check", "snapshot_project", "set_ease", "diff_since_last", "record_lesson", "recommend_next"]) {
    assert.ok(names.includes(n), n);
  }
  assert.ok(found.SKILLS.includes("sample.skill"));
  assert.ok(found.SKILLS.includes("easing.basic"));
  assert.equal(found.FINDERS["sample.skill"].review, true);
  assert.equal(typeof found.FINDERS["sample.skill"].focus, "function");
  assert.equal(found.FINDERS["easing.basic"].review, false);
  const record = found.TOOLS.find((t) => t.name === "record_lesson");
  assert.ok(record.inputSchema.properties.skill.enum.includes("sample.skill"));
});

test("the sample skill's tool names all carry its prefix; a name without it fails the lint", async () => {
  const sample = await import(path.join(SAMPLE, "tools", "sample.mjs"));
  assert.deepEqual(lintPrefix(sample.TOOLS, "sample_"), []);
  assert.deepEqual(lintPrefix([...sample.TOOLS, { name: "check_sample" }], "sample_"), ["check_sample"]);
});

test("the sample's finder agrees with its analysis (a count above 0 means a target)", async () => {
  const sample = await import(path.join(SAMPLE, "tools", "sample.mjs"));
  const lib = await import(path.join(SAMPLE, "lib", "sample.mjs"));
  const f = sample.FINDERS["sample.skill"].focus(practice);
  assert.equal(f.count, lib.analyze(practice).targets.length);
  assert.ok(f.count > 0);
});

test("two files declaring the same tool or skill ID refuse to start", async () => {
  const dupTool = tempTools({ "a.mjs": toolFile("dup.one", "dup_tool"), "b.mjs": toolFile("dup.two", "dup_tool") });
  await assert.rejects(discover([dupTool]), /tool "dup_tool"/);
  const dupSkill = tempTools({ "a.mjs": toolFile("dup.same", "dup_a"), "b.mjs": toolFile("dup.same", "dup_b") });
  await assert.rejects(discover([dupSkill]), /skill ID "dup.same"/);
  const clash = tempTools({ "a.mjs": toolFile("clash.one", "snapshot_project") });
  await assert.rejects(discover([TOOLS_DIR, clash]), /tool "snapshot_project"/);
});

test("a finder for a skill ID its module doesn't declare is refused", async () => {
  const bad = tempTools({ "a.mjs": toolFile("finder.mine", "finder_tool", `"finder.other": { focus: () => ({ count: 0, layers: [] }), review: false }`) });
  await assert.rejects(discover([bad]), /finder.other/);
});

test("index.mjs and common.mjs are never loaded as skills", async () => {
  const found = await discover([TOOLS_DIR]);
  // Any skill file may add IDs; index.mjs and common.mjs must add none, so easing's stays first and
  // record_lesson (common's) is registered once.
  assert.equal(found.SKILLS[0], "easing.basic");
  assert.equal(new Set(found.SKILLS).size, found.SKILLS.length);
  assert.equal(found.TOOLS.filter((t) => t.name === "record_lesson").length, 1);
});

// ---- Easing's finder (T016)

test("easing's finder count on Mentor Practice equals analyze()'s targets, with the same layers", () => {
  const finder = easing.FINDERS["easing.basic"];
  assert.equal(finder.review, false, "easing has no review mode this sprint (plan P5)");
  const f = finder.focus(practice);
  const a = analyze(practice);
  assert.equal(f.count, a.targets.length);
  assert.deepEqual(f.layers, [...new Set(a.findings.map((g) => g.layer))]);
  // Focusing analyze() on the finder's layers gives the same targets.
  assert.equal(analyze(practice, { focus_layers: f.layers }).targets.length, f.count);
});

test("easing's finder leaves out excluded layer and property pairs", () => {
  const finder = easing.FINDERS["easing.basic"];
  const all = finder.focus(practice).count;
  const f = finder.focus(practice, { exclude: [{ layer: "Title", property: "Position" }] });
  assert.equal(f.count, all - 2, "Title's Position has two pairs");
  const none = finder.focus(practice, {
    exclude: analyze(practice).findings.map((g) => ({ layer: g.layer, property: g.property })),
  });
  assert.deepEqual(none, { count: 0, layers: [] });
});

// ---- A skill's own error codes (contracts/skill-module.md › 4)

test("registerErrors adds codes that snippets' errors are recognised by, and refuses a changed message", () => {
  const before = errors.CODES.length;
  errors.registerErrors({ SAMPLE_NOT_READY: "That sample isn't ready yet." });
  assert.equal(errors.CODES.length, before + 1, "CODES is a live view");
  assert.equal(new errors.MentorError("SAMPLE_NOT_READY").message, "That sample isn't ready yet.");
  const e = toError({ error: "Error: SAMPLE_NOT_READY: Not here." }, "sample", 0);
  assert.equal(e.code, "SAMPLE_NOT_READY");
  assert.equal(e.message, "Not here.");
  errors.registerErrors({ SAMPLE_NOT_READY: "That sample isn't ready yet." }); // same message: fine
  assert.throws(() => errors.registerErrors({ SAMPLE_NOT_READY: "Something else." }), /different message/);
  assert.throws(() => errors.registerErrors({ AE_BUSY: "Busy." }), /different message/);
});

test("the reworded and new shared messages say 'one', not 'pair'", () => {
  assert.doesNotMatch(errors.MESSAGES.DEMO_USED, /pair/);
  assert.doesNotMatch(errors.MESSAGES.NOT_DEMO_TARGET, /pair/);
  for (const code of ["REVIEW_NO_DEMO", "NOT_KEPT_LINEAR", "LESSON_UNDERWAY"]) assert.ok(errors.MESSAGES[code], code);
});
