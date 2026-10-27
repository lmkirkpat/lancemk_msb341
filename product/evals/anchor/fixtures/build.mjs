#!/usr/bin/env node
// Builds the eval set's own synthetic fixtures and records from the live captures in
// mentor/test/fixtures/anchor/. Run from anywhere: node product/evals/anchor/fixtures/build.mjs
// Mentor Practice 2 has no one-key layer (spec 011 round 4), so case 24's fixtures are the live
// one-key capture `sled-one-key-before.json` with Sled's Position, Scale and Rotation keys written
// in, the way mentor/test/anchor-candidates.test.mjs builds its T254 synthetics. Each file says
// `synthetic` at the top; the runner scrubs that before the mentor sees it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.resolve(HERE, "../../../../mentor/test/fixtures/anchor");
const read = (f) => JSON.parse(fs.readFileSync(path.join(LIVE, f), "utf8"));

const T = "ADBE Transform Group/";
const key = (index, time, value) => ({ index, time, value });
const prop = (p, keys) => ({ path: T + p, expression_enabled: false, keys });

function sled(note, props) {
  const s = read("sled-one-key-before.json");
  s.layers.find((l) => l.name === "Sled").properties = props;
  s.synthetic = note;
  return s;
}

const write = (name, obj) => fs.writeFileSync(path.join(HERE, "synthetic", name), JSON.stringify(obj, null, 2) + "\n");

// Case 24: one Position key at 3.667 s; Scale grows to its largest (the rest key) at 4.167 s.
write("sled-one-key-rest-away.json", sled(
  "Case 24 (spec 011 round 4): live sled-one-key-before with Scale keys added to Sled. One Position key at 3.667; the rest key (largest Scale) at 4.167.",
  [
    prop("ADBE Position", [key(1, 3.667, [320, 960, 0])]),
    prop("ADBE Scale", [key(1, 3, [50, 50, 100]), key(2, 4.167, [100, 100, 100])]),
  ]));

// Case 24b: the tool's own rest key (Rotation at zero) is on the Position key (3.667); the
// learner names 4.167 as the rest pose.
write("sled-one-key-rest-on-key.json", sled(
  "Case 24b (spec 011 round 4): live sled-one-key-before with Rotation keys added to Sled. One Position key at 3.667; Rotation 0 at 3.667, 90 at 4.167.",
  [
    prop("ADBE Position", [key(1, 3.667, [320, 960, 0])]),
    prop("ADBE Rotate Z", [key(1, 3.667, 0), key(2, 4.167, 90)]),
  ]));

// Case 25: a pass with the matte's eye left on. The live matte-eye-on.json has the eye change
// only (Door untouched), so this is the live door-pass.json with the one field matte-eye-on changed
// (Reveal Matte's `enabled`, false to true) copied across.
{
  const pass = read("door-pass.json");
  const eye = read("matte-eye-on.json");
  const base = read("practice2b.json");
  const i = base.layer_info.findIndex((l, n) => l.enabled !== eye.layer_info[n].enabled);
  if (base.layer_info[i].name !== "Reveal Matte") throw new Error("expected the eye change on Reveal Matte");
  pass.layer_info[i].enabled = eye.layer_info[i].enabled;
  pass.synthetic = "Case 25: live door-pass.json with Reveal Matte's eye switched on, as live matte-eye-on.json has it.";
  write("door-pass-matte-eye-on.json", pass);
}


// Case 37: B-11's same-label rule. One Position key at 3.667 (label "3.67 s"), rest key (largest
// Scale) at 3.7 (label "3.7 s"): one frame apart, so a model tidying decimals would write one time
// for two frames.
write("sled-one-key-same-label.json", sled(
  "Case 37 (spec 011 round 5): live sled-one-key-before with Scale keys added to Sled. One Position key at 3.667; the rest key (largest Scale) at 3.7.",
  [
    prop("ADBE Position", [key(1, 3.667, [320, 960, 0])]),
    prop("ADBE Scale", [key(1, 3, [50, 50, 100]), key(2, 3.7, [100, 100, 100])]),
  ]));

// Case 32: this skill is practicing and `next` names Pop, not the read's proposal (Door).
{
  const rec = read("records/easing-learned.json");
  rec.skills["transform.anchor"] = {
    status: "practicing", last_practiced: "2026-10-25T16:00:00.000Z", times_passed: 0,
    next: "Set Pop's pivot again with the playhead on its full-size key.",
  };
  rec.lessons.push({
    date: "2026-10-25T16:00:00.000Z", skill: "transform.anchor", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2",
    attempted: "Set Pop's pivot to the middle of its bottom edge", result: "partial", demo_used: false,
    summary: "First try set Pop's pivot while it was still shrunk, so it was away from its rest pose.",
    next: "Set Pop's pivot again with the playhead on its full-size key.", kind: "first",
    targets: [{ layer: "Pop", property: "Anchor Point" }],
  });
  fs.writeFileSync(path.join(HERE, "../records/anchor-practicing-pop.json"), JSON.stringify(rec, null, 2) + "\n");
}

// Case 17: a review with nothing new. The record says every default candidate on Mentor Practice 2
// was a target of an earlier lesson (answer-key.json › practice2b: the 19 default layers).
const key19 = read("answer-key.json").practice2b.layers;
const defaults = Object.entries(key19).filter(([, v]) => v.bucket === "default").map(([n]) => n);
const rec = read("records/learned-door.json");
const lesson = rec.lessons.find((l) => l.skill === "transform.anchor");
lesson.attempted = "Set the pivot on every layer in the comp that could take it";
lesson.targets = defaults.map((layer) => ({ layer, property: "Anchor Point" }));
fs.writeFileSync(path.join(HERE, "../records/every-layer-done.json"), JSON.stringify(rec, null, 2) + "\n");

// Case 23b: this skill passed before and its review isn't due for a long time.
const passed = read("records/learned-door.json");
passed.skills["transform.anchor"].review_due = "2099-01-01";
passed.skills["transform.anchor"].last_practiced = "2026-10-24T16:00:00.000Z";
passed.lessons.find((l) => l.skill === "transform.anchor").date = passed.skills["transform.anchor"].last_practiced;
fs.writeFileSync(path.join(HERE, "../records/anchor-passed-not-due.json"), JSON.stringify(passed, null, 2) + "\n");
console.log("wrote fixtures/synthetic/*, records/*.json");
