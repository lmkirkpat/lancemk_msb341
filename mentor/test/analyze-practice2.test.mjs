// Spec 004 T043 (and T065's easing clause): easing's analyze() on the live Mentor Practice 2
// captures finds exactly the pairs the build script's answer key (practice2-expected.json) lists as
// linear, with its totals, so the new comp doesn't confuse easing. 30 and 60 fps.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/analyze.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (rel) => JSON.parse(fs.readFileSync(path.join(FIXTURES, rel), "utf8"));
const key = load("practice2-expected.json");
const linear = key.segments.filter((s) => s.state === "linear").map((s) => s.id).sort();

for (const [file, fps] of [["practice2-before.json", 30], ["practice2-60fps.json", 60]]) {
  const snap = load(file);

  test(`easing on Mentor Practice 2 (${fps} fps): findings are exactly the answer key's linear pairs`, () => {
    assert.equal(snap.comp.frame_rate, fps);
    const a = analyze(snap);
    const found = a.findings.flatMap((f) => f.segments).filter((s) => s.state === "linear").map((s) => s.id).sort();
    assert.deepEqual(found, linear);
    assert.deepEqual(a.findings.flatMap((f) => f.segments).filter((s) => s.state !== "linear"), [], "no partly eased pair");
    assert.deepEqual([...a.targets].sort(), linear);
  });

  test(`easing on Mentor Practice 2 (${fps} fps): counts are the answer key's totals; nothing skipped, hidden or precomp`, () => {
    const a = analyze(snap);
    assert.deepEqual(a.counts, { ...key.totals, partly_eased: 0 });
    assert.deepEqual(a.skipped, key.skipped);
    assert.deepEqual(a.hidden_layers, key.hidden_layers);
    assert.deepEqual(a.precomp_layers, key.precomp_layers);
  });

  test(`easing on Mentor Practice 2 (${fps} fps): each finding's layer and display path are the answer key's`, () => {
    const want = Object.fromEntries(key.segments.map((s) => [s.id, [s.layer, s.display_path]]));
    for (const f of analyze(snap).findings) for (const s of f.segments) assert.deepEqual([f.layer, s.display_path], want[s.id], s.id);
  });
}
