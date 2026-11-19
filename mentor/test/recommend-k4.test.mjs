// Spec 014 T048 (FR-022, K4): recommend_next never proposes a keyframe skill (easing, key types,
// speed graph, offset) with its focus on a layer whose motion has no keys. On spec 015's live Comp 1
// capture, where Shake Control and Black Solid 1 move only by expression and most other layers only
// ride on Shake Control: every keyframe skill's focus, as recommend() would give it at each point on
// the path, holds only layers with two or more keys of their own on one property.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

tempHome();
const { recommend } = await import("../lib/recommend.mjs");
const { readPath } = await import("../lib/path.mjs");
const { motionSources } = await import("../lib/motion-sources.mjs");
const { SKILLS, FINDERS } = await import("../tools/index.mjs");
const { KEYFRAME_SKILLS } = await import("../lib/ask-answer.mjs");

const COMP1 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "comp1.json"), "utf8"));
const NOW = new Date("2026-11-19T18:00:00.000Z");
const map = motionSources(COMP1);
const keyedMotion = (name) => map.layers.filter((l) => l.layer === name).some((l) => l.own_keys.some((k) => k.keys >= 2));
const EXPRESSION_ONLY = map.layers.filter((l) => !l.own_keys.some((k) => k.keys >= 2)).map((l) => l.layer);

const learned = { status: "learned", last_practiced: "2026-11-18T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-12-30", reviews_passed_in_row: 1 };
const recordWith = (ids) => ({ version: 1, lessons: [], skills: Object.fromEntries(ids.map((id) => [id, learned])) });

test("the capture has the layers K4 is about: Shake Control moves by expression only, and no keyframe skill's finder names it", () => {
  assert.ok(EXPRESSION_ONLY.includes("Shake Control"));
  assert.ok(EXPRESSION_ONLY.includes("rock.png"), "rides on Shake Control, no keys of its own");
  for (const id of KEYFRAME_SKILLS) {
    const f = FINDERS[id].focus(COMP1, { exclude: [], kept_linear: [] });
    for (const layer of f.layers || []) assert.ok(keyedMotion(layer), `${id} names ${layer}, which has no keyed motion`);
  }
});

test("at every point on the path, a keyframe skill's recommendation focuses only on layers with keys of their own", () => {
  const path = readPath();
  const order = [...path.skills].sort((a, b) => a.position - b.position).map((s) => s.id);
  const seen = new Set();
  for (let i = 0; i <= order.length; i++) {
    const r = recommend({ path, record: recordWith(order.slice(0, i)), built: SKILLS, finders: FINDERS, snapshot: COMP1, now: NOW, offers: [] });
    const rec = r.recommendation;
    if (!rec || !KEYFRAME_SKILLS.includes(rec.skill)) continue;
    seen.add(rec.skill);
    for (const layer of rec.focus_layers || []) assert.ok(keyedMotion(layer), `${rec.skill} recommended on ${layer}`);
    assert.ok(!(rec.focus_layers || []).some((l) => EXPRESSION_ONLY.includes(l)));
  }
  assert.ok(seen.size >= 1, "at least one keyframe skill was recommended along the way");
});
