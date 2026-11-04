// Spec 013 T064 (FR-042) and T063's runner wiring. The B1 runners build --allowedTools from the
// skill's own `allowed-tools`, through one reader; each set is the same set the 2026-10-29 baselines
// used. The runners start work when imported, so their source is checked for the wiring and the
// shared reader is checked for the values. No service call, no credit.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allowedToolsOf, toolSets } from "../skill-tools.mjs";
import * as ab from "../ab.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const EVALS = path.join(REPO, "product", "evals");

// The --allowedTools each runner passed when the 2026-10-29 baselines ran (runner source at 6bc4e4f
// and before it; easing's list included read_learner_record, the other five filtered it out).
const BASELINE = {
  "ease-mentor": ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson"],
  "speed-graph-mentor": ["speed_graph_snapshot", "speed_graph_demo", "speed_graph_check", "preview_frame", "record_lesson", "recommend_next"],
  "key-types-mentor": ["key_types_snapshot", "key_types_demo", "key_types_check", "preview_frame", "record_lesson", "recommend_next"],
  "offset-mentor": ["offset_snapshot", "offset_demo", "offset_check", "preview_frame", "record_lesson", "recommend_next"],
  "anchor-mentor": ["anchor_snapshot", "anchor_demo", "anchor_check", "preview_frame", "record_lesson", "recommend_next"],
  "null-parenting-mentor": ["null_parent_snapshot", "null_parent_demo", "null_parent_check", "preview_frame", "record_lesson", "recommend_next"],
};
const RUNNERS = { easing: "ease-mentor", "speed-graph": "speed-graph-mentor", "key-types": "key-types-mentor", offset: "offset-mentor", anchor: "anchor-mentor", "null-parenting": "null-parenting-mentor" };

test("allowedToolsOf reads inline and list forms, strips the prefix, and tells no frontmatter from no line", () => {
  assert.deepEqual(allowedToolsOf("---\nname: x\nallowed-tools: mcp__ae-mentor__a, mcp__ae-mentor__b, Skill\n---\nbody"), ["a", "b", "Skill"]);
  assert.deepEqual(allowedToolsOf("---\nallowed-tools:\n  - mcp__ae-mentor__a\n  - \"Skill\"\n---\n"), ["a", "Skill"]);
  assert.deepEqual(allowedToolsOf("---\nname: x\n---\nbody"), []);
  assert.equal(allowedToolsOf("no frontmatter"), null);
});

test("each B1 runner's tool set is the same set its 2026-10-29 baseline used", () => {
  for (const [skill, expected] of Object.entries(BASELINE)) {
    const { allowed, mentor } = toolSets(REPO, skill);
    assert.deepEqual([...allowed].sort(), [...expected].sort(), skill);
    // The recognized set is the allowed one plus read_learner_record, never anything else.
    assert.deepEqual([...mentor].sort(), [...new Set([...expected, "read_learner_record"])].sort(), skill);
    assert.equal(mentor[0], "read_learner_record");
  }
});

test("toolSets throws on a missing skill or a skill with no allowed-tools, so a runner never starts with none", () => {
  assert.throws(() => toolSets(REPO, "no-such-mentor"), /no SKILL\.md/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-"));
  try {
    fs.mkdirSync(path.join(dir, ".claude", "skills", "x-mentor"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".claude", "skills", "x-mentor", "SKILL.md"), "---\nname: x-mentor\n---\nbody\n");
    assert.throws(() => toolSets(dir, "x-mentor"), /no allowed-tools/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("ab.mjs exports the shared reader, and no other file in product/evals defines one", () => {
  assert.equal(ab.allowedToolsOf, allowedToolsOf);
  assert.equal(ab.toolSets, toolSets);
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "results" || e.name === "fixtures" || e.name === "node_modules") continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (f.endsWith(".mjs") && !f.includes(`${path.sep}test${path.sep}`)) files.push(f);
    }
  };
  walk(EVALS);
  const definers = files.filter((f) => /function allowedToolsOf\b/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(EVALS, f));
  assert.deepEqual(definers, [path.join("lib", "skill-tools.mjs")]);
});

test("each runner builds --allowedTools from its own skill, keeps no hand-kept list, and still recognizes read_learner_record", () => {
  for (const [dir, skill] of Object.entries(RUNNERS)) {
    const src = fs.readFileSync(path.join(EVALS, dir, "run.mjs"), "utf8");
    assert.match(src, new RegExp(`ab\\.toolSets\\(REPO, "${skill}"\\)`), dir);
    assert.match(src, /"--allowedTools", \.\.\.ALLOWED_TOOLS\.map\(/, dir);
    assert.doesNotMatch(src, /const (?:MENTOR|ALLOWED)_TOOLS = \[/, dir);
    assert.doesNotMatch(src, /--allowedTools",\s*\.\.\.MENTOR_TOOLS/, dir);
    assert.match(src, /read_learner_record/, dir);
  }
});

test("--changed's hash inputs name no runner, lib or test file, so T063 and T064 re-run no case", () => {
  for (const dir of Object.keys(RUNNERS)) {
    const src = fs.readFileSync(path.join(EVALS, dir, "run.mjs"), "utf8");
    const list = /const SHARED_INPUTS = \[([\s\S]*?)\n\];/.exec(src)[1];
    assert.doesNotMatch(list, /run\.mjs|lib\/ab|skill-tools|compare\.mjs|allowlist-check|runtime-a/, dir);
    // The only A-only additions are the helper's own files.
    assert.match(src, /opts\.runtime === "a"\) files\.push\(\.\.\.ab\.helperHashFiles/, dir);
  }
});

test("each runner records the mentor's and the judge's cost separately on A (T063)", () => {
  for (const dir of Object.keys(RUNNERS)) {
    const src = fs.readFileSync(path.join(EVALS, dir, "run.mjs"), "utf8");
    assert.match(src, /\.\.\.\(fin \? \{ runtime: "a", mentor_cost_usd: Number\(fin\.cost\.toFixed\(4\)\), judge_cost_usd: Number\(\(cost - fin\.cost\)\.toFixed\(4\)\)/, dir);
    // The B1 return has no new field: they sit inside the `fin ?` branch.
    assert.equal((src.match(/mentor_cost_usd/g) || []).length, 1, dir);
  }
});
