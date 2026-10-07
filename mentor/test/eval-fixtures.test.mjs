// The eval fixtures (product/evals/easing/fixtures/, captured live in T037) say what each case
// assumes they say. Graded as a Title lesson on Mentor Practice with the demo used, as in the
// eval cases. If a fixture is re-captured wrong, this fails before an eval run does.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../lib/analyze.mjs";
import { diff } from "../lib/diff.mjs";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "product", "evals", "easing", "fixtures");
const load = (name) => JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8"));

const before = load("before");
const lesson = analyze(before, { focus_layers: ["Title"] });
const check = (name) =>
  diff(before, load(name), { comp_id: before.comp.id, targets: lesson.targets, demo: { segment_id: lesson.demo_target } });
const results = (r) => r.targets.map((t) => t.result);

test("before: Mentor Practice as built, 11 pairs to ease on 6 layers (Subtitle's fade half eased), demo on Title › Position 1", () => {
  const a = analyze(before);
  assert.equal(before.comp.name, "Mentor Practice");
  assert.equal(a.counts.linear + a.counts.partly_eased, 11);
  assert.equal(a.counts.partly_eased, 1);
  assert.equal(a.findings.length, 9);
  assert.equal(lesson.demo_target, "1/ADBE Transform Group/ADBE Position/1");
  assert.deepEqual(a.hidden_layers, ["Old Take"]);
  assert.deepEqual(a.precomp_layers, ["Icon"]);
});

test("after-demo: only the demo pair is eased", () => {
  const r = check("after-demo");
  assert.deepEqual(results(r), ["eased_by_demo", "still_linear", "still_linear", "still_linear"]);
  assert.deepEqual(r.unexpected_changes, []);
});

test("partial: demo + Position 1.5–3 s eased; Scale and Opacity still linear", () => {
  const r = check("partial");
  assert.deepEqual(results(r), ["eased_by_demo", "eased_by_learner", "still_linear", "still_linear"]);
  assert.deepEqual(r.unexpected_changes, []);
});

test("wrong-property: a Scale key added instead of easing; nothing eased by the learner", () => {
  const r = check("wrong-property");
  assert.deepEqual(results(r), ["eased_by_demo", "still_linear", "still_linear", "still_linear"]);
  assert.deepEqual(r.unexpected_changes, ["Title › Scale now has 3 keys (was 2)"]);
});

test("wrong-layer: Subtitle › Opacity eased instead of a Title pair", () => {
  const r = check("wrong-layer");
  assert.deepEqual(results(r), ["eased_by_demo", "still_linear", "still_linear", "still_linear"]);
  assert.deepEqual(r.unexpected_changes, ["Subtitle › Opacity was changed (not part of this lesson)"]);
});

test("half-eased: demo + F9 on the shared 1.5 s key only; Position 1.5–3 s is eased at the start, linear at 3 s", () => {
  const r = check("half-eased");
  assert.deepEqual(results(r), ["eased_by_demo", "partly_eased", "still_linear", "still_linear"]);
  const half = r.targets[1];
  assert.equal(half.linear_end, "end");
  assert.equal(half.linear_key_time, 3);
  assert.equal(r.passed, false);
  assert.deepEqual(r.unexpected_changes, []);
});

test("redone: the demo undone and every Title pair eased with F9, so no demo fingerprint is left", () => {
  const r = check("redone");
  assert.deepEqual(results(r), ["eased_by_learner", "eased_by_learner", "eased_by_learner", "eased_by_learner"]);
  assert.equal(r.targets[0].demo_credit, "learner_redo");
  assert.equal(r.passed, true);
});

test("title-done: every Title pair eased, and it passes", () => {
  const r = check("title-done");
  assert.deepEqual(results(r), ["eased_by_demo", "eased_by_learner", "eased_by_learner", "eased_by_learner"]);
  assert.equal(r.passed, true);
});

test("other-comp / all-eased: a different comp with nothing linear", () => {
  for (const name of ["other-comp", "all-eased"]) {
    assert.equal(check(name).comp_matches, false, name);
    assert.equal(analyze(load(name)).findings.length, 0, name);
  }
});
