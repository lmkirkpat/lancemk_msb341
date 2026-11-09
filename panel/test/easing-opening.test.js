// Spec 007 SC-002 (usage note "Proposed openings", 2026-11-09): easing's opening rows say Proposed
// and drop it at the first reply, as the other skills' do. Driven through the whole panel with a
// recorded easing opening, which calls read_learner_record before snapshot_project.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ready, plain } = require("./app-harness.js");
const { createStreamParser } = require("../lib/stream.js");
const { renderApp } = require("../lib/screens.js");
const { rowsOf } = require("../lib/checklist/index.js");
const { COPY } = require("../lib/copy.js");

const RECORDED = fs.readFileSync(path.join(__dirname, "fixtures", "stream-opening.jsonl"), "utf8");
const NEW = '\\"lesson\\": \\"new\\"';

const list = (h) => plain(renderApp(h.app.model()).lesson.list);
const chat = (h) => { const c = renderApp(h.app.model()).lesson.chat; return plain((c.earlier || "") + c.items.join("")); };
const words = (h) => rowsOf(h.app.model().lesson.check_list).map((r) => r.word);

// Feeds a stream into the current adapter as the real adapter would, then ends the turn.
function feed(h, text, kind) {
  const names = [];
  const p = createStreamParser((e) => {
    if (e.type === "tool_result") names.push(e.name);
    const { type, ...rest } = e;
    h.adapter().emit(type, Object.assign(rest, { kind }));
  });
  p.push(text);
  p.end();
  return names;
}

async function openEasing(stream) {
  const h = await ready();
  h.app.act("new_lesson", { skill: "easing.basic" });
  assert.deepEqual(h.adapter().sent[0], { text: "/ease-mentor", kind: "new_lesson" });
  const names = feed(h, stream, "new_lesson");
  return { h, names };
}

test("the recorded stream is easing's real opening: the record is read before the snapshot", () => {
  const h = { names: [] };
  const p = createStreamParser((e) => { if (e.type === "tool_result") h.names.push(e.name); });
  p.push(RECORDED);
  p.end();
  assert.deepEqual(h.names, ["read_learner_record", "snapshot_project"]);
  assert.ok(RECORDED.includes(NEW), "the snapshot says the lesson is new");
});

test("easing's opening, New lesson: every row says Proposed, then drops it at the first reply", async () => {
  const { h } = await openEasing(RECORDED);
  const v = h.app.model().lesson;
  assert.equal(v.skill, "easing.basic");
  assert.equal(v.check_list.proposed, true);
  assert.equal(v.check_list.source, "opening");
  assert.ok(words(h).length >= 4);
  assert.ok(words(h).every((w) => w === COPY.check.proposed), JSON.stringify(words(h)));
  assert.ok(list(h).includes(COPY.check.proposed));
  assert.equal(list(h).includes(COPY.check.not_checked), false);
  assert.equal(chat(h).includes(COPY.lesson.picking_up), false);

  h.app.ask("Title, please");
  assert.equal(h.app.model().state, "lesson-focus-replying");
  assert.equal(h.app.model().lesson.check_list.proposed, false);
  assert.ok(words(h).every((w) => w === COPY.check.not_checked));
  assert.equal(list(h).includes(COPY.check.proposed), false);
});

test("easing's opening from Start lesson on Home says Proposed too", async () => {
  const h = await ready();
  h.app.act("start", { skill: "easing.basic" });
  feed(h, RECORDED, "start");
  assert.equal(h.app.model().lesson.check_list.proposed, true);
  assert.ok(list(h).includes(COPY.check.proposed));
});

// The live case (2026-11-09 23:17Z): an easing lesson on that comp, opened 2026-11-05 and never
// checked, was still open in the mentor's session file, and the comp still matched its baseline, so
// snapshot_project returned `resumed` (mentor/lib/session.mjs start()). FR-092: not Proposed.
test("the live miss: a snapshot that returns resumed is Not checked yet, with the picking-up line (FR-092)", async () => {
  const resumed = RECORDED.split(NEW).join('\\"lesson\\": \\"resumed\\"');
  assert.notEqual(resumed, RECORDED);
  const { h, names } = await openEasing(resumed);
  assert.deepEqual(names, ["read_learner_record", "snapshot_project"]);
  assert.equal(h.app.model().lesson.picked_up, true);
  assert.equal(h.app.model().lesson.check_list.proposed, false);
  assert.ok(words(h).every((w) => w === COPY.check.not_checked));
  assert.equal(list(h).includes(COPY.check.proposed), false);
  assert.ok(chat(h).includes(COPY.lesson.picking_up));
});
