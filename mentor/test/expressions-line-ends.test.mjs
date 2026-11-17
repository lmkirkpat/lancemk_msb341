// Spec 015 T015 finding: AE 27.0 gives expression text with `\r` line ends (live Comp 1), not `\n`.
// Every parse of expression text treats `\r`, `\r\n` and `\n` alike (lib/expressions.mjs strip()),
// describe_layers' detail shows `\n` to the model, and the record guard (OQ-7) catches a copy whatever
// its line ends. The snapshot keeps AE's text as AE gave it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "rig.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { buildsOn, normalizeLineEnds, referencesIn, strip } = await import("../lib/expressions.mjs");
const { comp1, LIVE } = await import("./fixtures/expressions/comp1.mjs");
const { copiesExpression } = await import("../tools/common.mjs");
const { TOOLS } = await import("../tools/index.mjs");

const ENDS = { "\\n": "\n", "\\r": "\r", "\\r\\n": "\r\n" };
const lines = (end, ...l) => l.join(end);
const t = (text) => buildsOn({ text, text_cut: false });

for (const [label, end] of Object.entries(ENDS)) {
  test(`${label} line ends: a // comment ends at the line end, so the code after it is read`, () => {
    assert.equal(t(lines(end, "// shake it", "value + [0, 10]")), "builds_on");
    assert.equal(t(lines(end, "// value + 1", "[100, 200]")), "sets_own");
    assert.equal(t(lines(end, "x = 5; // a note", "wiggle(2, x)")), "builds_on");
    const { ok, code } = strip(lines(end, "// one", "a = 1;", "// two", "b = 2;"));
    assert.equal(ok, true);
    assert.match(code, /a = 1;/);
    assert.match(code, /b = 2;/);
    assert.doesNotMatch(code, /one|two/);
  });

  test(`${label} line ends: a string broken by a line end is unclosed, and can't tell`, () => {
    assert.equal(strip(lines(end, 'a = "open', 'value"')).ok, false);
    assert.equal(t(lines(end, 'a = "open', 'value"')), "cant_tell");
  });

  test(`${label} line ends: a layer reference after a comment is still found`, () => {
    const refs = referencesIn(lines(end, "// follow the sweep", 'thisComp.layer("Sweep Control").transform.position'));
    assert.deepEqual(refs.map((r) => [r.how, r.name, r.property]), [["name", "Sweep Control", "Position"]]);
  });
}

test("a backslash before \\r\\n continues a string over the line, as before \\n", () => {
  assert.equal(strip('a = "one\\\r\ntwo"; value').ok, true);
  assert.equal(strip('a = "one\\\ntwo"; value').ok, true);
  assert.equal(t('a = "one\\\r\ntwo"; value'), "builds_on");
});

test("U+2028 and U+2029 end a // comment, as in JavaScript", () => {
  assert.equal(t("// note value * 2"), "builds_on");
  assert.equal(t("// note value * 2"), "builds_on");
});

test("normalizeLineEnds: \\r\\n and \\r become \\n; \\n and other text are kept", () => {
  assert.equal(normalizeLineEnds("a\r\nb\rc\nd"), "a\nb\nc\nd");
  assert.equal(normalizeLineEnds("\r\r\n\n"), "\n\n\n");
  assert.equal(normalizeLineEnds("no ends"), "no ends");
});

test(`Comp 1 (${LIVE ? "live" : "derived"}): the same builds-on with the text's line ends as \\r, \\r\\n and \\n`, () => {
  for (const x of comp1().expressions) {
    const plain = normalizeLineEnds(x.text);
    const got = Object.values(ENDS).map((end) => t(plain.replace(/\n/g, end)));
    assert.equal(new Set(got).size, 1, `${x.display_path}: ${got}`);
  }
});

test(`describe_layers detail on Comp 1 (${LIVE ? "live" : "derived"}): text and error show \\n, full length counts the shown text`, async () => {
  const snap = comp1();
  // A planted \r\n and an error with AE's \r, to check both are shown with \n.
  const shake = snap.expressions.find((x) => x.display_path === "Transform › Position");
  shake.text = normalizeLineEnds(shake.text).replace(/\n/g, "\r\n");
  shake.text_length = shake.text.length;
  shake.error = "Error at line 1.\rError: layer named 'Gone' is missing.";
  const file = path.join(home, "comp1-crlf.json");
  fs.writeFileSync(file, JSON.stringify(snap));
  fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
  const tool = TOOLS.find((x) => x.name === "describe_layers");
  const reply = JSON.parse((await tool.handler({ layers: ["Shake Control"], detail: true })).content[0].text);
  const pos = reply.layers[0].expressions.find((x) => x.property === "Position");
  assert.ok(!pos.text.includes("\r"), "no \\r in the shown text");
  assert.equal(pos.text, normalizeLineEnds(shake.text));
  assert.equal(pos.full_length, pos.text.length);
  assert.equal(pos.cut_short, false);
  assert.equal(pos.error, "Error at line 1.\nError: layer named 'Gone' is missing.");
  // The snapshot itself is left as AE gave it.
  assert.ok(JSON.parse(fs.readFileSync(file, "utf8")).expressions.find((x) => x.display_path === "Transform › Position").text.includes("\r\n"));
});

test("the record guard (OQ-7) catches a copy of \\r text written with \\n, with spaces, or as \\r\\n", () => {
  const text = lines("\r", "amps = [6,12,20];   // amplitude in pixels", "freq = 8;  // shakes per second", "decays = [1,4,10];");
  const error = "Error at line 1 in property 'Position'.\rError: layer named 'Gone' is missing or does not exist.";
  const snap = { expressions: [{ layer: 1, path: "ADBE Transform Group/ADBE Position", text, error }] };
  const span = "amplitude in pixels\rfreq = 8;  // shakes"; // crosses the line end
  for (const end of ["\n", " ", "\r\n", "\r"]) {
    assert.equal(copiesExpression(`It reads ${span.replace("\r", end)} and so on.`, snap), true, JSON.stringify(end));
  }
  assert.equal(copiesExpression("It said: layer named 'Gone' is missing\nor does not exist.", snap), true, "an error copied over a line end");
  assert.equal(copiesExpression("The null shakes three times, each softer than the last.", snap), false);
});
