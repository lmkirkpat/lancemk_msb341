"use strict";
// T068, SC-003: step 3's states are reachable and show what they should, from recorded review streams
// and saved records, and every in-scope README id is driven by one of the three states-step files.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ready, plain, play, tick, SIX_PATH } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");
const { STATE_IDS } = require("../lib/view-state.js");

const LAST = "2026-10-26T12:00:00.000Z";
const lessons = [{ skill: "timing.offset", date: LAST, result: "passed" }];
const due = (id) => ({ skills: { [id]: { status: "learned", last_practiced: LAST, review_due: "2026-11-01" } }, lessons: [{ skill: id, date: LAST, result: "passed" }] });
const allText = (h) => { const r = renderApp(h.app.model()); if (!r.lesson) return plain(r.view); const l = r.lesson; return plain([l.head, l.banner, l.chat.earlier || "", ...l.chat.items, l.list, l.status, l.actions, l.ask].join("\n")); };
const T = (name, json) => ({ name, json, ok: true, text: "", images: [] });
const SNAP = T("offset_snapshot", { lesson: "new", mode: "review", comp: { duration: 8 }, group: { kind: "layers", members: [{ target: "x", label: "Chip A", start: 2 }, { target: "y", label: "Chip B", start: 2 }] }, targets: ["x", "y"], focus: ["Chip A", "Chip B"], demo_target: null, no_demo_reason: "review" });
const CHECK = (passed) => T("offset_check", { comp_matches: true, passed, kind: "layers", members: [["Chip A", 2], ["Chip B", 2.2]].map(([label, start_now]) => ({ target: `t/${label}`, label, layer: label, start_before: 2, start_now, end_now: start_now + 1, moved_by: {}, split: null, credit: null, status: "graded" })), still_same: [], order_differs: false, out_of_comp: [], other_changes: [], gaps_frames: [] });
const SAVED = T("record_lesson", { saved: true });

// A warm-up (or a lesson) whose record changes when the mentor saves it.
async function run(skill, press, events, afterSave) {
  let record = due(skill);
  if (afterSave && afterSave.other) record.skills[afterSave.other] = { status: "learned", last_practiced: LAST, review_due: "2026-11-01" };
  const h = await ready({ pathData: SIX_PATH, readRecord: () => Promise.resolve({ status: "ok", record }) });
  h.app.act(press, { skill });
  for (const e of events) h.adapter().emit("tool_result", e);
  if (afterSave) {
    record = { skills: Object.assign({}, record.skills, { [skill]: { status: "learned", last_practiced: LAST, review_due: afterSave.due } }), lessons };
    h.adapter().emit("tool_result", SAVED);
    await tick();
  }
  h.adapter().emit("turn_end", { ok: true, kind: press });
  await tick();
  return h;
}

const CASES = {
  practice: [() => run("timing.offset", "warm_up", [SNAP]), COPY.lesson.review_tag],
  "practice-check": [() => run("timing.offset", "warm_up", [SNAP, CHECK(false)]), COPY.buttons.hint],
  "practice-passed": [() => run("timing.offset", "warm_up", [SNAP, CHECK(true)], { due: "2026-11-12" }), "Next warm-up in 3 days."],
  "practice-nothing-new": [() => run("timing.offset", "warm_up", [T("offset_snapshot", { lesson: "new", mode: "review", group: null, targets: [], focus: null, demo_target: null, no_demo_reason: "no_new_target" })]), COPY.lesson.nothing_new],
  "lesson-passed-pivot": [() => run("timing.offset", "start", [T("offset_snapshot", Object.assign({}, SNAP.json, { mode: "lesson", no_demo_reason: null })), CHECK(true)], { due: "2026-11-10" }), "Warm-up due tomorrow."],
  "skills-after-review": [async () => { const h = await run("timing.offset", "warm_up", [SNAP, CHECK(true)], { due: "2026-11-12", other: "transform.anchor" }); h.app.act("see_skills"); return h; }, "1 due for practice"],
};

for (const [id, [drive, marker]] of Object.entries(CASES)) {
  test(`SC-003: ${id} is reachable and shows what it should`, async () => {
    const h = await drive();
    assert.equal(h.app.model().state, id);
    assert.ok(allText(h).includes(marker), `${id} shows "${marker}"`);
    assert.doesNotMatch(allText(h).replace(/<[^>]*>/g, ""), /undefined|\[object Object\]|mcp__|ae-mentor|_snapshot|_check\b|no_new_target|timing\.offset/, "no internal names (FR-064)");
  });
}

// ---------- recorded review streams ----------

const REVIEWS = [
  ["easing.speed_graph", "speed-graph-17-review-nothing-new", "practice-nothing-new"],
  ["transform.anchor", "anchor-17-review-nothing-new", "practice-nothing-new"],
  ["transform.anchor", "anchor-53-button-warm-up", "practice"],
  ["timing.offset", "offset-17-review", "practice"],
];

for (const [skill, file, state] of REVIEWS) {
  test(`recorded stream ${file} opens as ${state}, tagged, with no Show me`, async () => {
    const h = await ready({ memory: { status: "ok", record: due(skill) }, pathData: SIX_PATH });
    h.app.act("warm_up", { skill });
    play(h, `eval/${file}.jsonl`);
    const m = h.app.model();
    assert.equal(m.state, state);
    assert.equal(m.lesson.mode, "review");
    const l = renderApp(m).lesson;
    assert.ok(plain(l.head).includes(COPY.lesson.review_tag));
    assert.ok(!plain(l.actions).includes("Show me"));
    assert.doesNotMatch(allText(h), /undefined|\[object Object\]|mcp__|_check\b|_snapshot\b/);
  });
}

// ---------- the final list ----------

const STEP_FILES = ["states-step1.test.js", "states-step2.test.js", "states-step3.test.js"];

test("every state id is driven by a states-step test (SC-003's final list)", () => {
  const src = STEP_FILES.map((f) => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n");
  const missing = STATE_IDS.filter((id) => !src.includes(`"${id}"`) && !new RegExp(`\\b${id}:\\s*\\[`).test(src));
  assert.deepEqual(missing, []);
});

test("step 3's list is the spec's, plus skills-after-review", () => {
  assert.deepEqual(Object.keys(CASES).sort(), ["lesson-passed-pivot", "practice", "practice-check", "practice-nothing-new", "practice-passed", "skills-after-review"]);
  for (const id of Object.keys(CASES)) assert.ok(STATE_IDS.includes(id), id);
});
