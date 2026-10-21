// FR-001, FR-002: mentor/curriculum/path.json mirrors curriculum.md › 4 (the path) and › 10 (the
// diagnosis findings map). The test reads the curriculum designer's file itself, so a design change
// that isn't mirrored here fails the build. It never writes curriculum.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CURRICULUM = fs.readFileSync(path.join(REPO, "specs", "004-ae-curriculum", "curriculum.md"), "utf8");
const PATH = JSON.parse(fs.readFileSync(path.join(REPO, "mentor", "curriculum", "path.json"), "utf8"));
const { readPath, skillName, pathOrder, isBuilt } = await import("../lib/path.mjs");

// The rows of the first table after a "## <n>." heading, as arrays of trimmed cells.
function table(section) {
  const start = CURRICULUM.indexOf(`\n## ${section}`);
  assert.ok(start >= 0, `curriculum.md has a section ${section}`);
  const lines = CURRICULUM.slice(start + 1).split("\n");
  const end = lines.findIndex((l, i) => i > 0 && l.startsWith("## "));
  const rows = lines.slice(0, end).filter((l) => l.startsWith("|"));
  const cells = (l) => l.split("|").slice(1, -1).map((c) => c.trim());
  return rows.slice(2).map(cells); // after the header and the --- row
}

// The curriculum's words to IDs: one small table, so the mapping is visible in one place.
const BY_NUMBER = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset", "motion.sources",
  "transform.anchor", "parenting.null", "shape.trim_paths", "matte.track", "text.animator", "precomp.basic"];
function ids(cell) {
  const c = cell.replace(/\*\*/g, "").trim();
  if (!c) return [];
  if (c === "keyframes") return ["keyframes"];
  if (c === "easing") return ["easing.basic"];
  if (c === "a shape or text layer to use") return [];
  const range = /^(\d+)\s*[–-]\s*(\d+)$/.exec(c);
  if (range) {
    const out = [];
    for (let n = Number(range[1]); n <= Number(range[2]); n++) out.push(BY_NUMBER[n]);
    return out;
  }
  return c.split(",").map((n) => {
    const id = BY_NUMBER[Number(n.trim())];
    assert.ok(id, `a skill number in "${cell}"`);
    return id;
  });
}
const findingSkill = (cell) => {
  const c = cell.trim();
  if (/^none\b/.test(c)) return null;
  if (/^Easing\b/.test(c)) return "easing.basic";
  const n = /^(\d+)/.exec(c);
  assert.ok(n, `a skill in "${cell}"`);
  return BY_NUMBER[Number(n[1])];
};

test("skills, order, names and prerequisites match curriculum.md › 4", () => {
  const rows = table("4. The path");
  assert.equal(rows.length, 11);
  const want = rows.map(([num, skill, , hard, soft]) => ({
    position: Number(num),
    id: BY_NUMBER[Number(num)],
    name: Number(num) === 0 ? "Easing" : skill.replace(/\*\*/g, "").trim(),
    hard: ids(hard),
    soft: ids(soft),
    needs_in_comp: hard.trim() === "a shape or text layer to use" ? hard.trim() : undefined,
  }));
  const got = PATH.skills.map(({ position, id, name, hard, soft, needs_in_comp }) => ({ position, id, name, hard, soft, needs_in_comp }));
  assert.deepEqual(got, want);
});

test("the finding map matches curriculum.md › 10", () => {
  const rows = table("10. Diagnosis findings to skills");
  const want = Object.fromEntries(rows.map(([finding, skill]) => [/^(DX-\d+)/.exec(finding)[1], findingSkill(skill)]));
  assert.deepEqual(PATH.findings, want);
  assert.equal(Object.keys(want).length, 9);
});

test("IDs are unique, every prerequisite exists, and there are no cycles", () => {
  const known = new Set([PATH.on_ramp.id, ...PATH.skills.map((s) => s.id)]);
  assert.equal(new Set(PATH.skills.map((s) => s.id)).size, PATH.skills.length);
  for (const s of PATH.skills) for (const p of [...s.hard, ...s.soft]) assert.ok(known.has(p), `${s.id} → ${p}`);
  for (const f of Object.values(PATH.findings)) if (f !== null) assert.ok(known.has(f), f);
  const byId = new Map(PATH.skills.map((s) => [s.id, s]));
  const visit = (id, seen) => {
    assert.ok(!seen.has(id), `cycle through ${id}`);
    const s = byId.get(id);
    if (s) for (const p of [...s.hard, ...s.soft]) visit(p, new Set([...seen, id]));
  };
  for (const s of PATH.skills) visit(s.id, new Set());
});

test("path.mjs reads the same data, says plain names, and computes built from the tool files' IDs", () => {
  assert.deepEqual(readPath(), PATH);
  assert.equal(skillName("keyframes.types"), "Pick the key type on purpose");
  assert.equal(skillName("easing.basic"), "Easing");
  assert.equal(skillName("keyframes"), "Setting keyframes");
  assert.equal(skillName("no.such"), null);
  assert.deepEqual(pathOrder(), BY_NUMBER);
  assert.equal(isBuilt("easing.basic", ["easing.basic"]), true);
  assert.equal(isBuilt("timing.offset", ["easing.basic"]), false);
  assert.equal("built" in PATH.skills[0], false, "built is never stored (FR-003)");
});

test("this test only reads curriculum.md", () => {
  const before = fs.statSync(path.join(REPO, "specs", "004-ae-curriculum", "curriculum.md")).mtimeMs;
  table("4. The path");
  assert.equal(fs.statSync(path.join(REPO, "specs", "004-ae-curriculum", "curriculum.md")).mtimeMs, before);
});
