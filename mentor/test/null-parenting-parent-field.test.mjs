// The check always says what the null follows (null.parent, or null when nothing), so the panel can
// still tell an accepted parent from none after the once-only one_level_only hint has gone.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check } from "../lib/null-parenting-check.mjs";
import { lessonFor, load } from "./fixtures/null-parenting/load.mjs";

const CHAIN = ["Card", "Label"];
const PLACED = "synthetic/row23-still-parent-placed.json";

test("a null with no parent reports null", () => {
  const base = load("practice2b.json");
  const { result } = check(base, load("null-center.json"), lessonFor(base, { focus: ["Tile", "Caption", "Stamp"] }), {});
  assert.equal(result.null.n2, true);
  assert.equal(result.null.parent, null);
});

test("the parent is reported on the first check, before it's accepted", () => {
  const base = load("synthetic/before.json");
  const { result } = check(base, load(PLACED), lessonFor(base, { focus: CHAIN }), {});
  assert.equal(result.null.n2, false);
  assert.equal(result.null.parent, "Holder");
});

test("the parent is still reported on every check after the one_level_only hint", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: CHAIN });
  lesson.skill_data = check(base, load(PLACED), lesson, {}).skill_data;
  const accepted = check(base, load(PLACED), lesson, { chain_on_purpose: true });
  assert.ok(accepted.result.codes.includes("one_level_only"));
  assert.equal(accepted.result.null.parent, "Holder");
  lesson.skill_data = accepted.skill_data;
  const later = check(base, load(PLACED), lesson, {});
  assert.ok(!later.result.codes.includes("one_level_only"));
  assert.equal(later.result.null.n2, true);
  assert.equal(later.result.null.parent, "Holder");
});

test("a moving parent, which ends the check early, is reported too", () => {
  const base = load("synthetic/before.json");
  const { result } = check(base, load("synthetic/row23-moving-parent.json"), lessonFor(base, { focus: CHAIN }), {});
  assert.equal(result.null.n2, "moves");
  assert.equal(result.null.parent, "Holder");
});

test("the field is there, as null, when the check found no null to read", () => {
  const base = load("practice2b.json");
  const { result } = check(base, base, lessonFor(base, { focus: ["Tile", "Caption", "Stamp"] }), {});
  assert.equal(result.null.found, false);
  assert.ok("parent" in result.null);
  assert.equal(result.null.parent, null);
});
