// Spec 014 T056 (FR-051, PQ-3): the result line and return divider for each of the six skills,
// chosen by skill and the check's `passed` (contracts/panel-ask.md › Result lines and dividers).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { COPY, resultLine, deeperDivider } = require("../lib/copy.js");
const { TABLE } = require("../lib/skills.js");

// The contract's table, word for word.
const LINES = {
  "easing.basic": "Pairs eased, nothing else changed.",
  "keyframes.types": "Keys set the way you wanted.",
  "easing.speed_graph": "Ease shaped, still comes to rest.",
  "timing.offset": "Staggered, and each one still lands.",
  "transform.anchor": "Pivot moved, nothing else did.",
  "parenting.null": "The group moves as one. Nothing jumped.",
};
// MU's short names (the tag and Go deeper name).
const TAGS = { "easing.basic": "Easing", "keyframes.types": "Key types", "easing.speed_graph": "Speed graph", "timing.offset": "Offset", "transform.anchor": "Set the pivot", "parenting.null": "Group with a null" };

test("every skill in the panel's table has its own result line, as the contract words it", () => {
  assert.deepEqual(Object.keys(COPY.ask.result_lines).sort(), TABLE.map((s) => s.id).sort());
  for (const [id, line] of Object.entries(LINES)) assert.equal(resultLine(id, true), line, id);
});

test("a result line only on a pass: not passed, or no result, draws none", () => {
  for (const id of Object.keys(LINES)) {
    assert.equal(resultLine(id, false), null, id);
    assert.equal(resultLine(id, undefined), null, id);
    assert.equal(resultLine(id, "true"), null, `${id}: only the tool's boolean`);
  }
  assert.equal(resultLine("motion.sources", true), null, "a skill with no line draws none");
  assert.equal(resultLine("toString", true), null);
});

test("no result line uses pass, fail or review words (FR-023, MU › Asking again is normal)", () => {
  for (const line of Object.values(COPY.ask.result_lines)) assert.doesNotMatch(line, /pass|fail|review|wrong|correct/i, line);
  for (const line of [COPY.ask.deeper_asking, COPY.ask.deeper_unsaved.title, COPY.ask.deeper_unsaved.body, COPY.ask.divider_unsaved("x")]) assert.doesNotMatch(line, /pass|fail|review|wrong|correct/i, line);
});

test("dividers for each skill: practiced on the layer when saved, ended and not saved otherwise", () => {
  for (const [id, tag] of Object.entries(TAGS)) {
    assert.equal(deeperDivider(tag, { saved: true, layer: "Shake Control" }), `${tag} · practiced on Shake Control`, id);
    assert.equal(deeperDivider(tag, { saved: false, layer: "Shake Control" }), `${tag} · ended, not saved`, id);
    assert.equal(deeperDivider(tag, {}), `${tag} · ended, not saved`, `${id}: unsaved by default`);
    assert.equal(deeperDivider(tag, { saved: true, layer: null }), `${tag} · practiced`, `${id}: no layer known`);
    assert.equal(deeperDivider(tag, { saved: false, passed: true, layer: "Shake Control" }), `${tag} · not saved`, `${id}: passed, record failed (T061 item 3)`);
    assert.equal(deeperDivider(tag, { saved: true, passed: true, layer: "Shake Control" }), `${tag} · practiced on Shake Control`, `${id}: saved wins`);
  }
  assert.equal(deeperDivider("Set the pivot", { saved: true, layer: "Shake Control" }), "Set the pivot · practiced on Shake Control", "MU's divider");
  assert.equal(deeperDivider("Set the pivot", { saved: false }), "Set the pivot · ended, not saved", "MU's ended divider");
});
