// Spec 015 T018 (FR-002, research R3): "builds on its own value", inferred from the text with
// comments and strings ignored. Comp 1's three are from the live reads; E5, E6 and the rest are
// text-only cases (tasks.md allows strings for the parser).

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildsOn, expressionReads, strip } from "../lib/expressions.mjs";
import { comp1 } from "./fixtures/expressions/comp1.mjs";

const t = (text, extra = {}) => buildsOn({ text, text_cut: false, ...extra });

test("Comp 1: Shake Control's two build on their own value, the Sweep Center sets its own, all inferred", () => {
  const list = expressionReads(comp1()).list;
  assert.deepEqual(list.map((x) => [x.layer, x.property, x.builds_on, x.builds_on_inferred]), [
    ["Black Solid 1", "Center", "sets_own", true],
    ["Shake Control", "Position", "builds_on", true],
    ["Shake Control", "Rotation", "builds_on", true],
  ]);
});

test("E5: functions that build on the value or keys without the word value", () => {
  for (const text of ["wiggle(5, 20)", "loopOut()", 'loopOut("pingpong")', "smooth(0.2, 5)", "temporalWiggle(2, 10)",
    "loopIn('cycle')", "key(1).value + [0, 10]", "valueAtTime(time - 0.1)", "thisProperty.wiggle(3, 30)", "nearestKey(time).time", "numKeys > 1 ? 1 : 0", "velocity * 0.1", "speed > 10 ? 100 : 0"]) {
    assert.equal(t(text), "builds_on", text);
  }
});

test("E6: value only inside a comment or a string doesn't count", () => {
  assert.equal(t("// value + 1\n[100, 200]"), "sets_own");
  assert.equal(t("/* value */ 50"), "sets_own");
  assert.equal(t('text = "value"; 10'), "sets_own");
  assert.equal(t("x = 'wiggle(5,5)'; [0, 0]"), "sets_own");
});

test(".value on another property is that property's, not this one's", () => {
  assert.equal(t('thisComp.layer("A").transform.position.value'), "sets_own");
  assert.equal(t('thisComp.layer("Sweep Control").transform.position'), "sets_own");
  assert.equal(t('effect("Slider Control")("Slider").value * 2'), "sets_own");
  assert.equal(t("thisProperty.value + 5"), "builds_on");
  assert.equal(t("myvalue = 3; value2 = 4; myvalue"), "sets_own", "only the whole word");
});

test("cut text, an unclosed string or comment, or eval gives can't tell", () => {
  assert.equal(t("value + 1", { text_cut: true }), "cant_tell");
  assert.equal(t('x = "open; value'), "cant_tell");
  assert.equal(t("/* never closed value"), "cant_tell");
  assert.equal(t('eval("value")'), "cant_tell");
  assert.equal(buildsOn(null), "cant_tell");
});

test("strip keeps the strings aside and drops comments", () => {
  const s = strip('thisComp.layer("Sweep Control") // the "sweep"\n/* x */ + 1');
  assert.equal(s.ok, true);
  assert.deepEqual(s.strings, ["Sweep Control"]);
  assert.doesNotMatch(s.code, /sweep"|\/\*/);
  assert.equal(strip('"a\\"b"').strings[0], 'a"b', "escapes kept");
});
