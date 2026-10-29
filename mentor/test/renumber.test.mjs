// Overlap audit 2026-10-29, OA-5 (spec 004 tasks-wave-b T440): pair ids carry the layer index, so a
// null added or a layer duplicated mid-lesson renumbers every layer below it. The easing, speed graph
// and key types checks match the baseline's layers to the comp now by name (repeats told apart by key
// times) before they look a pair up; when they can't tell which layer is which, the pair is
// "unmatched", never graded on the wrong layer.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { alignLayers } from "../lib/renumber.mjs";
import { analyze as easingAnalyze } from "../lib/analyze.mjs";
import { diff } from "../lib/diff.mjs";
import { check as speedCheck } from "../lib/speed-graph.mjs";
import { analyze as ktAnalyze, check as ktCheck } from "../lib/key-types.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";
import { load as ktLoad } from "./fixtures/key-types/load.mjs";

const sg = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "speed-graph", name), "utf8"));

// Insert layers at `at` (1 is the top), shifting every index at or below it, as After Effects does.
// Each added layer: { name, keyed (a layer from `layers` to copy keys from), info (a layer_info entry
// to copy), is_null }.
function insertLayers(snap, at, added) {
  const s = structuredClone(snap);
  const n = added.length;
  const shift = (i) => (typeof i === "number" && i >= at ? i + n : i);
  for (const l of s.layers) l.index = shift(l.index);
  for (const l of s.precomp_layers || []) l.index = shift(l.index);
  for (const l of s.layer_info || []) {
    l.index = shift(l.index);
    l.parent = shift(l.parent);
    if (l.matte && typeof l.matte.layer === "number") l.matte.layer = shift(l.matte.layer);
  }
  added.forEach((a, k) => {
    const index = at + k;
    if (a.keyed) s.layers.push({ ...structuredClone(a.keyed), index, name: a.name });
    if (Array.isArray(s.layer_info)) {
      const base = a.info ? structuredClone(a.info) : structuredClone(s.layer_info[0]);
      s.layer_info.push({ ...base, index, name: a.name, is_null: !!a.is_null, parent: null, matte: null, is_matte: false });
    }
  });
  s.layers.sort((x, y) => x.index - y.index);
  if (Array.isArray(s.layer_info)) s.layer_info.sort((x, y) => x.index - y.index);
  return s;
}
const keyedNamed = (snap, name) => snap.layers.find((l) => l.name === name);
const infoNamed = (snap, name) => (snap.layer_info || []).find((l) => l.name === name);
const withId = (id, layerIndex) => id.replace(/^\d+\//, `${layerIndex}/`);

// ---- alignLayers itself

test("nothing renumbered: the comp now comes back as it is", () => {
  const now = ktLoad("blink-all-held.json");
  const a = alignLayers(ktLoad("practice2b.json"), now);
  assert.equal(a.current, now);
  assert.deepEqual(a.unmatched, []);
});

test("a rename in place with nothing renumbered keeps today's reading (the layer stays matched by index)", () => {
  const was = fixture("attempt-before");
  const now = structuredClone(fixture("attempt-complete"));
  now.layers[1].name = "Tagline";
  const a = alignLayers(was, now);
  assert.equal(a.current, now);
});

test("a null added at the top: every layer maps back to its baseline index", () => {
  const was = ktLoad("practice2b.json");
  const now = insertLayers(was, 1, [{ name: "Null 1", is_null: true }]);
  const a = alignLayers(was, now);
  assert.deepEqual(a.unmatched, []);
  assert.deepEqual(a.current.layers.map((l) => [l.index, l.name]), was.layers.map((l) => [l.index, l.name]));
  const nul = a.current.layer_info.find((l) => l.name === "Null 1");
  assert.ok(nul && !was.layer_info.some((l) => l.index === nul.index), "the new layer gets an index no baseline layer has");
  const hatch = a.current.layer_info.find((l) => l.name === "Hatch");
  assert.equal(hatch.parent, was.layer_info.find((l) => l.name === "Hatch").parent, "parent indexes follow the map");
});

test("a layer renamed and renumbered is found by its key times", () => {
  const was = ktLoad("practice2b.json");
  const now = insertLayers(was, 1, [{ name: "Null 1", is_null: true }]);
  now.layers.find((l) => l.name === "Spinner").name = "Wheel";
  now.layer_info.find((l) => l.name === "Spinner").name = "Wheel";
  const a = alignLayers(was, now);
  assert.equal(a.current.layers.find((l) => l.name === "Wheel").index, 2);
});

test("two layers with the baseline layer's name and the same keys: unmatched, and both left out", () => {
  const was = ktLoad("practice2b.json");
  const now = insertLayers(was, 1, [{ name: "Blink", keyed: keyedNamed(was, "Blink"), info: infoNamed(was, "Blink") }]);
  const a = alignLayers(was, now);
  assert.deepEqual(a.unmatched, [{ index: 1, name: "Blink" }]);
  assert.ok(!a.current.layers.some((l) => l.name === "Blink"));
  assert.ok(!a.baseline.layers.some((l) => l.name === "Blink"));
});

test("a duplicate the learner has already changed is told apart by its key times", () => {
  const was = ktLoad("practice2b.json");
  const copy = structuredClone(keyedNamed(was, "Blink"));
  copy.properties[0].keys[2].time = 1.9;
  const now = insertLayers(was, 1, [{ name: "Blink", keyed: copy, info: infoNamed(was, "Blink") }]);
  const a = alignLayers(was, now);
  assert.deepEqual(a.unmatched, []);
  assert.equal(a.current.layers.find((l) => l.index === 1).properties[0].keys[2].time, 1.8);
});

// ---- Key types (the audit's probe: every Blink pair removed_or_changed and ~60 notes)

const BLINK = [{ layer: "Blink", property: "Opacity" }];
function ktGrade(baseline, current, refs) {
  const skill_options = { focus: refs, should_move: [] };
  const lesson = { comp_id: baseline.comp.id, baseline, targets: ktAnalyze(baseline, { skill_options }).targets, skill_options, demo: null };
  return ktCheck(baseline, current, lesson);
}

test("key types: a null added at the top after Blink is held: every pair held_by_learner, no renumbering notes", () => {
  const was = ktLoad("practice2b.json");
  const now = insertLayers(ktLoad("blink-all-held.json"), 1, [{ name: "Null 1", is_null: true }]);
  const r = ktGrade(was, now, BLINK);
  assert.deepEqual(r.pairs.map((p) => p.verdict), ["held_by_learner", "held_by_learner", "held_by_learner"]);
  assert.deepEqual(r.other_changes, []);
  assert.equal(r.passed, true);
});

test("key types: a held Blink duplicated with the same name: unmatched, no pass, one plain note", () => {
  const was = ktLoad("practice2b.json");
  const held = ktLoad("blink-all-held.json");
  const now = insertLayers(held, 1, [{ name: "Blink", keyed: keyedNamed(held, "Blink"), info: infoNamed(held, "Blink") }]);
  const r = ktGrade(was, now, BLINK);
  assert.deepEqual(r.pairs.map((p) => p.verdict), ["unmatched", "unmatched", "unmatched"]);
  assert.ok(r.pairs.every((p) => p.label.startsWith("Blink › Opacity")));
  assert.equal(r.passed, false);
  assert.equal(r.other_changes.length, 1, r.other_changes.join("; "));
  assert.match(r.other_changes[0], /"Blink"/);
});

// ---- Speed graph (the audit's probe: Cmd+D, then a keyed layer inserted above the focus)

test("speed graph: Twin above Title, a keyed layer inserted between: Title's pairs are graded on Title", () => {
  const plain = sg("practice-now.json");
  const shaped = sg("planted-15-80.json");
  const twin = { name: "Twin", keyed: keyedNamed(plain, "Title"), info: infoNamed(plain, "Title") };
  const was = insertLayers(plain, 1, [twin]);
  const now = insertLayers(shaped, 1, [twin, { name: "Inserted", keyed: keyedNamed(plain, "Subtitle"), info: infoNamed(plain, "Subtitle") }]);
  const ids = ["1/ADBE Transform Group/ADBE Position/1", "1/ADBE Transform Group/ADBE Position/2", "1/ADBE Transform Group/ADBE Scale/1"];
  const lesson = (base, targets) => ({ comp_id: base.comp.id, targets, skill_options: {}, demo: null });
  const expected = speedCheck(plain, shaped, lesson(plain, ids));
  const moved = ids.map((id) => withId(id, 2));
  const r = speedCheck(was, now, lesson(was, moved));
  assert.deepEqual(r.pairs.map((p) => [p.label, p.result, p.mistake]), expected.pairs.map((p) => [p.label, p.result, p.mistake]));
  assert.equal(r.passed, expected.passed);
  assert.ok(!r.other_changes.some((n) => /^Layer \d+ is now/.test(n)), r.other_changes.join("; "));
  assert.ok(r.other_changes.includes("Inserted › Position is now animated (wasn't before)"), r.other_changes.join("; "));
});

test("speed graph: Title duplicated with its name: unmatched, never graded, no pass", () => {
  const plain = sg("practice-now.json");
  const shaped = sg("planted-15-80.json");
  const now = insertLayers(shaped, 1, [{ name: "Title", keyed: keyedNamed(shaped, "Title"), info: infoNamed(shaped, "Title") }]);
  const r = speedCheck(plain, now, { comp_id: plain.comp.id, targets: ["1/ADBE Transform Group/ADBE Position/1"], skill_options: {}, demo: null });
  assert.deepEqual(r.pairs.map((p) => [p.label, p.result]), [["Title › Position 0.5–1.5 s", "unmatched"]]);
  assert.equal(r.passed, false);
});

// ---- Easing (shares the path: diff.mjs)

test("easing: a layer added at the top after one pair is eased: the same results as without it", () => {
  const was = fixture("attempt-before");
  const targets = easingAnalyze(was, { focus_layers: ["Title"] }).targets;
  const lesson = (base, ids) => ({ comp_id: base.comp.id, targets: ids, demo: null });
  const expected = diff(was, fixture("attempt-eased-one"), lesson(was, targets));
  const now = insertLayers(fixture("attempt-eased-one"), 1, [{ name: "Null 1", is_null: true }]);
  const r = diff(was, now, lesson(was, targets));
  assert.deepEqual(r.targets.map((t) => [t.label, t.result]), expected.targets.map((t) => [t.label, t.result]));
  assert.deepEqual(r.summary, expected.summary);
  assert.deepEqual(r.unexpected_changes, expected.unexpected_changes);
});

test("easing: Title duplicated with its name: its targets are unmatched and the lesson doesn't pass", () => {
  const was = fixture("attempt-before");
  const targets = easingAnalyze(was, { focus_layers: ["Title"] }).targets;
  const done = fixture("attempt-complete");
  const now = insertLayers(done, 1, [{ name: "Title", keyed: keyedNamed(done, "Title") }]);
  const r = diff(was, now, { comp_id: was.comp.id, targets, demo: null });
  assert.ok(r.targets.every((t) => t.result === "unmatched"), JSON.stringify(r.targets));
  assert.equal(r.passed, false);
  assert.equal(diff(was, done, { comp_id: was.comp.id, targets, demo: null }).passed, true, "control: passes without the duplicate");
});
