// Spec 007 T008: the checklist view and easing's codes (FR-016, FR-086, FR-100, D13, D15,
// contracts/checklist-rows.md). Rows come from the tool's result; a pass only from its own `passed`.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { fromCheck, labelsFromSnapshot, GLYPHS, FAMILIES } = require("../lib/checklist/index.js");
const { COPY } = require("../lib/copy.js");
const { createStreamParser } = require("../lib/stream.js");

const ID = (n) => `1/ADBE Transform Group/ADBE Position/${n}`;
const check = (over) => Object.assign({
  comp_matches: true, targets: [], unexpected_changes: [],
  summary: { learner_eased: 1, still_linear: 1, partly_eased: 0, total_for_learner: 2 }, passed: false,
}, over);
const rowsOf = (list) => list.sections.flatMap((s) => s.rows);
const t = (n, result, extra) => Object.assign({ segment_id: ID(n), label: `Title › Position ${n}–${n + 1} s`, result }, extra);

test("the seven families have the README's glyphs", () => {
  assert.deepEqual(GLYPHS, { done: "✓", off: "✗", part: "◐", none: "○", prop: "◇", cant: "⊘", ask: "?" });
  assert.deepEqual(FAMILIES, ["done", "off", "part", "none", "prop", "cant", "ask"]);
});

test("each of easing's codes maps to its glyph and word, removed and unmatched included", () => {
  const list = fromCheck("diff_since_last", check({ targets: [
    t(1, "eased_by_learner"), t(2, "eased_by_demo", { demo_credit: "demo" }), t(3, "still_linear"),
    t(4, "partly_eased", { linear_end: "end", linear_key_time: 1.5 }), t(5, "removed"), t(6, "unmatched"),
  ] }));
  assert.deepEqual(rowsOf(list).map((r) => [r.family, r.glyph, r.word]), [
    ["done", "✓", "Eased by you"], ["done", "✓", "Demo"], ["off", "✗", "Still linear"],
    ["part", "◐", "Half eased"], ["cant", "⊘", "Keys changed"], ["cant", "⊘", "Can't tell which"],
  ]);
  assert.equal(rowsOf(list)[3].detail, "the 1.5 s key is still linear");
});

test("D13: a demo pair the tool can't credit is a ? row that credits nobody", () => {
  const list = fromCheck("diff_since_last", check({ targets: [t(1, "eased_by_demo", { demo_credit: "unknown" })] }));
  assert.deepEqual([rowsOf(list)[0].family, rowsOf(list)[0].glyph, rowsOf(list)[0].word], ["ask", "?", COPY.check.who_eased]);
});

test("an unknown code reads Not checked yet, never a pass", () => {
  const r = rowsOf(fromCheck("diff_since_last", check({ targets: [t(1, "mystery")] })))[0];
  assert.deepEqual([r.family, r.glyph, r.word], ["none", "○", COPY.check.not_checked]);
});

test("sections are the layer, in the tool's order; the subject drops the layer", () => {
  const list = fromCheck("diff_since_last", check({ targets: [
    t(1, "still_linear"),
    { segment_id: "2/x/1", label: "Glow › Blurriness 0–1 s", result: "still_linear" },
    t(2, "still_linear"),
  ] }));
  assert.deepEqual(list.sections.map((s) => s.title), ["Title", "Glow"]);
  assert.deepEqual(list.sections[0].rows.map((r) => r.subject), ["Position 1–2 s", "Position 2–3 s"]);
});

test("D15: a label equal to its id reads A pair, and no id ever shows (FR-064, FR-100)", () => {
  const list = fromCheck("diff_since_last", check({ targets: [{ segment_id: ID(9), label: ID(9), result: "eased_by_learner" }] }));
  const r = rowsOf(list)[0];
  assert.equal(r.subject, COPY.check.a_pair);
  assert.doesNotMatch(JSON.stringify({ s: list.sections.map((x) => x.title), subject: r.subject, word: r.word, detail: r.detail }), /ADBE/);
});

test("a label kept by id from the opening names a pair whose check label is only the id (R1)", () => {
  const list = fromCheck("diff_since_last", check({ targets: [{ segment_id: ID(9), label: ID(9), result: "still_linear" }] }), { labels: { [ID(9)]: "Bar › Scale 0–1 s" } });
  assert.deepEqual([list.sections[0].title, rowsOf(list)[0].subject], ["Bar", "Scale 0–1 s"]);
});

test("the summary is the tool's own count; passed is only ever the tool's (FR-016)", () => {
  const notPassed = fromCheck("diff_since_last", check({ targets: [t(1, "eased_by_learner")], summary: { learner_eased: 1, still_linear: 0, partly_eased: 0, total_for_learner: 1 }, passed: false }));
  assert.equal(notPassed.summary, "1 of 1 yours eased · 0 still to ease");
  assert.equal(notPassed.passed, false, "all ticks with passed false stays not passed");
  const passed = fromCheck("diff_since_last", check({ targets: [t(1, "still_linear")], summary: { learner_eased: 3, total_for_learner: 3, still_linear: 0 }, passed: true }));
  assert.equal(passed.passed, true);
  assert.equal(passed.summary, "3 of 3 yours eased · passed");
  assert.equal(fromCheck("diff_since_last", check({ passed: "yes" })).passed, false);
});

test("still to ease counts half-eased pairs too", () => {
  assert.equal(fromCheck("diff_since_last", check({ summary: { learner_eased: 0, still_linear: 1, partly_eased: 2, total_for_learner: 3 } })).summary, "0 of 3 yours eased · 3 still to ease");
});

test("Outside is the tool's sentences, apart from the rows", () => {
  const list = fromCheck("diff_since_last", check({ targets: [t(1, "still_linear")], unexpected_changes: ["Glow › Blurriness was changed"] }));
  assert.deepEqual(list.outside, ["Glow › Blurriness was changed"]);
  assert.equal(rowsOf(list).length, 1);
});

test("Next is the first open row in the tool's order, never re-ranked (FR-085)", () => {
  const list = fromCheck("diff_since_last", check({ targets: [t(1, "eased_by_learner"), t(2, "removed"), t(3, "partly_eased", { linear_key_time: 1 }), t(4, "still_linear")] }));
  assert.equal(list.next, "Position 3–4 s");
});

test("a row that changed since the last check is marked, and the count says so in words", () => {
  const first = fromCheck("diff_since_last", check({ targets: [t(1, "still_linear"), t(2, "still_linear")] }));
  assert.equal(rowsOf(first).some((r) => r.changed), false, "no bar on the first check");
  assert.equal(first.sub, "Next: Position 1–2 s");
  const second = fromCheck("diff_since_last", check({ targets: [t(1, "eased_by_learner"), t(2, "still_linear")] }), { previous: first });
  assert.deepEqual(rowsOf(second).map((r) => r.changed), [true, false]);
  assert.equal(second.sub, "1 more since your last check. Next: Position 2–3 s");
});

test("a malformed result never throws and shows no pass", () => {
  for (const bad of [{ comp_matches: true }, { comp_matches: true, targets: "x", summary: null }]) {
    const list = fromCheck("diff_since_last", bad);
    assert.deepEqual(list.sections, []);
    assert.equal(list.passed, false);
  }
});

test("the view has the data model's fields", () => {
  const list = fromCheck("diff_since_last", check({ targets: [t(1, "still_linear")] }));
  for (const k of ["summary", "sub", "next", "proposed", "stale", "sections", "footer", "outside", "worth_a_look", "passed"]) assert.ok(k in list, k);
  assert.equal(list.proposed, false);
  assert.equal(list.stale, null);
  for (const k of ["family", "glyph", "subject", "word", "detail", "track", "changed"]) assert.ok(k in rowsOf(list)[0], k);
});

function toolResults(file) {
  const out = [];
  const p = createStreamParser((e) => { if (e.type === "tool_result") out.push(e); });
  p.push(fs.readFileSync(path.join(__dirname, "fixtures", "eval", file), "utf8"));
  p.end();
  return out;
}

test("SC-002: on recorded lessons every row agrees with the check's own result", () => {
  const MAP = { eased_by_learner: "Eased by you", eased_by_demo: "Demo", still_linear: "Still linear", partly_eased: "Half eased", removed: "Keys changed", unmatched: "Can't tell which" };
  let checks = 0;
  for (const f of ["easing-06-correct-attempt.jsonl", "easing-07-partial-attempt.jsonl", "easing-23-undo-then-redo.jsonl"]) {
    for (const r of toolResults(f).filter((e) => e.name === "diff_since_last" && e.json && e.json.comp_matches)) {
      checks++;
      const list = fromCheck("diff_since_last", r.json);
      const words = rowsOf(list).map((x) => x.word);
      const expected = r.json.targets.map((x) => (x.result === "eased_by_demo" && x.demo_credit === "unknown" ? COPY.check.who_eased : MAP[x.result]));
      assert.deepEqual(words, expected, f);
      assert.equal(list.passed, r.json.passed === true, f);
    }
  }
  assert.ok(checks >= 3, `only ${checks} recorded checks`);
});

test("opening labels from findings match the check's labels for the same pair (R1)", () => {
  const results = toolResults("easing-07-partial-attempt.jsonl");
  const labels = labelsFromSnapshot("snapshot_project", results.find((e) => e.name === "snapshot_project").json);
  const diff = results.find((e) => e.name === "diff_since_last" && e.json).json;
  const shared = diff.targets.filter((x) => labels[x.segment_id]);
  assert.ok(shared.length > 0);
  for (const x of shared) assert.equal(labels[x.segment_id], x.label);
});
