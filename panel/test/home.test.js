// Spec 007 T014: Home at step 1 (plan P9, FR-007, FR-008, FR-010, FR-012): from the record and the
// path data alone, with no mentor turn.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { homeView, readPathData, startRequest } = require("../lib/home.js");
const { readLearnerRecord } = require("../lib/memory.js");
const { REQUESTS } = require("../lib/requests.js");
const { COPY } = require("../lib/copy.js");

const REPO = path.join(__dirname, "..", "..");
const RECORDS = path.join(__dirname, "fixtures", "records");
const pathData = readPathData({ repoPath: REPO });
const read = (n) => readLearnerRecord({ home: path.join(RECORDS, n) });

test("the path data is read from the repo; unreadable reads as nothing", () => {
  assert.equal(pathData.skills[0].id, "easing.basic");
  assert.equal(readPathData({ repoPath: "/nowhere" }), null);
});

test("home-first (spec 014 FR-010 amended): an empty record is the same Home plus the welcome", () => {
  const v = homeView({ memory: read("none"), pathData });
  assert.equal(v.has_history, false);
  assert.deepEqual(v.hello, { text: COPY.home.welcome_first, sub: null });
  assert.equal("up_next" in v, false, "the Up next card is gone; Find my next lesson is the quiet line");
  assert.deepEqual(v.memory, { empty: true, text: COPY.home.memory_empty }, "worked out here, drawn on Skills");
});

test("home-return: a record gets no welcome line on Home; the memory goes to Skills", () => {
  const v = homeView({ memory: read("one-lesson"), pathData });
  assert.equal(v.has_history, true);
  assert.equal(v.hello, null, "one quiet line is all Home shows from the record (decisions/012)");
  assert.equal(v.memory.empty, false);
  assert.equal(v.memory.skill, "Easing");
  assert.equal(v.memory.result, "passed");
  assert.equal(v.memory.next, "Practice note 1.");
});

test("a record with no lessons in it is still a first run", () => {
  const v = homeView({ memory: { status: "ok", record: { skills: {}, lessons: [] } }, pathData });
  assert.equal(v.has_history, false);
  assert.equal(v.hello.text, COPY.home.welcome_first);
});

test("unreadable is never a first run: no welcome (FR-011)", () => {
  for (const name of ["unreadable", "set-aside"]) {
    const v = homeView({ memory: read(name), pathData });
    assert.equal(v.unreadable, true, name);
    assert.equal(v.hello, null, name);
  }
});

test("FR-007: with no path data Home still has its ask card and line; nothing breaks", () => {
  const v = homeView({ memory: read("none"), pathData: null });
  assert.equal(v.hello.text, COPY.home.welcome_first);
});

test("Start lesson sends the skill's start request, and the same request every time (FR-012, RQ-01)", () => {
  assert.equal(startRequest("easing.basic").request, "/ease-mentor");
  assert.equal(startRequest("made.up"), null);
  assert.equal(startRequest("toString"), null);
});

test("SC-004: a 20-lesson record draws well under a second, with no mentor turn", () => {
  const start = process.hrtime.bigint();
  const v = homeView({ memory: read("twenty-lessons"), pathData });
  assert.equal(v.memory.next, "Practice note 20.");
  assert.ok(Number(process.hrtime.bigint() - start) / 1e6 < 1000);
});

test("no ids or field names reach the view", () => {
  const v = homeView({ memory: read("twenty-lessons"), pathData });
  const shown = JSON.stringify({ hello: v.hello, memory: v.memory });
  assert.doesNotMatch(shown, /easing\.basic|last_practiced|times_passed/);
});

// ---------- spec 014 T020: Home ask-first, drawn (MU › Home, contracts/panel-ask.md › Home) ----------
const { ready, makeApp, plain, SIX_PATH, LESSON, CONNECTED } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");

const html = (h) => renderApp(h.app.model()).view;
const words = (h) => plain(html(h));
const st = (h) => h.app.model().state;
const A = COPY.ask;
const FROM_RECORD = [COPY.home.up_next, COPY.home.practice_due, COPY.home.memory_title, COPY.home.welcome_back, COPY.buttons.pick_skill, COPY.buttons.start, COPY.home.next_time];
const DUE = { skills: { "timing.offset": { status: "learned", last_practiced: "2026-10-26T12:00:00.000Z", review_due: "2026-11-01" } }, lessons: [{ skill: "timing.offset", date: "2026-10-26T12:00:00.000Z", result: "passed" }] };

function assertAskFirst(h, id) {
  const t = words(h);
  assert.ok(t.includes(A.card_title), `${id}: the ask card`);
  assert.ok(t.includes(A.label), `${id}: the box's visible label`);
  for (const gone of FROM_RECORD) assert.equal(t.includes(gone), false, `${id} shows ${gone}`);
}

test("home-return: the ask card first, then the one quiet line, Find my next lesson; Ask off until there's text", async () => {
  const h = await ready({ memory: { status: "ok", record: LESSON } });
  assert.equal(st(h), "home-return");
  assertAskFirst(h, "home-return");
  const v = html(h);
  assert.ok(v.indexOf(A.card_title) < v.indexOf(COPY.buttons.find_next));
  assert.match(v, /class="qline" data-action="find_next"/);
  assert.match(v, /id="ask-go"[^>]*aria-disabled="true" aria-describedby="ask-why ask-empty"/);
  assert.ok(words(h).includes(A.hint));
  h.app.setDraft("Why does it swing?");
  assert.match(html(h), /id="ask-go"[^>]*aria-disabled="false"/);
});

test("home-review-due is home-return on purpose: same state, same screen; the review is in Skills", async () => {
  const due = await ready({ memory: { status: "ok", record: DUE }, pathData: SIX_PATH });
  const plainRecord = await ready({ memory: { status: "ok", record: { skills: { "timing.offset": { status: "learned", review_due: "2099-01-01" } }, lessons: DUE.lessons } }, pathData: SIX_PATH });
  assert.equal(st(due), "home-return");
  assert.equal(html(due), html(plainRecord));
  assertAskFirst(due, "home-review-due");
});

test("home-first: Welcome to Knack., the same Home, Find my next lesson (FR-010 as amended)", async () => {
  const h = await ready();
  assert.equal(st(h), "home-first");
  assert.ok(words(h).includes(COPY.home.welcome_first));
  assertAskFirst(h, "home-first");
  assert.match(html(h), /data-action="find_next"/);
});

test("home-inprogress: the quiet line Pick up [skill] on [layer], with Set it aside under it", async () => {
  const saved = { version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "x", updated_at: "x", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 3 yours eased", sections: [], outside: [], stale: null, stale_kind: null, checked_at: null } }, messages: [] };
  const h = await ready({ saved, memory: { status: "ok", record: LESSON } });
  assert.equal(st(h), "home-inprogress");
  assertAskFirst(h, "home-inprogress");
  const v = html(h);
  assert.match(v, /class="qline" data-action="continue" title="Pick up Easing on Title\. 1 of 3 yours eased" aria-label="Pick up Easing on Title\. 1 of 3 yours eased"/, "full text in the title and the name (MU › Accessibility)");
  assert.match(v, /data-action="set_aside"/);
  assert.equal(v.includes('data-action="find_next"'), false, "one quiet line, not two");
});

test("T035 item 6: Pick up names the comp, as MU draws it: \"Pick up Easing on Title\" over \"Mentor Practice · 1 of 3 yours eased\"", async () => {
  const saved = { version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "x", updated_at: "x", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], comp: "Mentor Practice", snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 3 yours eased", sections: [], outside: [], stale: null, stale_kind: null, checked_at: "2026-11-09T11:00:00.000Z" } }, messages: [] };
  const h = await ready({ saved, memory: { status: "ok", record: LESSON } });
  assert.equal(st(h), "home-inprogress");
  const v = html(h);
  assert.ok(v.includes('<span class="ql">Pick up Easing on Title<small>Mentor Practice · 1 of 3 yours eased</small></span>'), "MU's two lines, nothing else");
  assert.match(v, /title="Pick up Easing on Title\. Mentor Practice, 1 of 3 yours eased" aria-label="Pick up Easing on Title\. Mentor Practice, 1 of 3 yours eased"/, "MU's tooltip and accessible name");
});

test("T035 item 6: the comp comes from the lesson's own snapshot reply and is saved with it, so a reopened panel names it", async () => {
  const h = await ready({ memory: { status: "ok", record: LESSON } });
  h.app.act("start");
  const seg = (id, a, b) => ({ id, from_time: a, to_time: b, state: "linear" });
  h.adapter().emit("tool_result", { name: "snapshot_project", ok: true, text: "", images: [], json: { lesson: "new", comp: { name: "Mentor Practice", duration: 5 }, focus: ["Title"], demo_target: "a", targets: ["a", "b"], findings: [{ layer: "Title", property: "Position", segments: [seg("a", 0.5, 1.5), seg("b", 1.5, 3)] }] } });
  h.adapter().emit("turn_end", { ok: true, cost_usd: 0, kind: "start" });
  assert.equal(h.saved.current.lesson.comp, "Mentor Practice");
  h.app.shutdown();
  const again = await ready({ saved: h.saved.current, memory: { status: "ok", record: LESSON } });
  assert.equal(st(again), "home-inprogress");
  assert.ok(words(again).includes("Pick up Easing on Title"));
  assert.match(html(again), /<small>Mentor Practice( · [^<]+)?<\/small>/);
});

test("home-lessonopen: Ask paused with the reason, the line goes back to the lesson, End lesson under it", async () => {
  const h = await ready();
  h.app.act("start");
  h.app.act("go_home");
  assert.equal(st(h), "home-lessonopen");
  assertAskFirst(h, "home-lessonopen");
  const v = html(h);
  assert.match(v, /id="ask-go"[^>]*aria-disabled="true"/);
  assert.match(v, /id="ask-why">Your lesson is open\. Ask there, or end it first\.</);
  assert.match(v, /class="qline" data-action="back_lesson"/);
  assert.match(v, /data-action="end_lesson"/);
});

test("home-loading: the skeleton is one card and one line, and no mentor turn", async () => {
  const timers = [];
  const h = makeApp({ readRecord: () => new Promise(() => {}), setTimeout: (f) => timers.push(f) });
  h.app.init();
  timers[0]();
  assert.equal(st(h), "home-loading");
  const v = html(h);
  assert.equal((v.match(/class="card"/g) || []).length, 1);
  assert.ok(plain(v).includes(COPY.status.history));
  assert.equal(h.adapters.length, 0);
});

test("home-unreadable: spec 007's banner over the new Home, and asking still works", async () => {
  const h = await ready({ memory: { status: "unreadable", record: null } });
  assert.equal(st(h), "home-unreadable");
  assertAskFirst(h, "home-unreadable");
  assert.ok(words(h).includes(COPY.home.unreadable.title));
  assert.equal(words(h).includes(COPY.home.welcome_first), false, "never a first run");
  h.app.setDraft("Why?");
  assert.match(html(h), /id="ask-go"[^>]*aria-disabled="false"/);
});

test("home-unreachable and home-busy: the box still takes text; Ask and the line say why they're paused", async () => {
  for (const [state, id, why] of [["not_connected", "home-unreachable", COPY.paused.needs_ae], ["busy", "home-busy", COPY.paused.waiting_ae]]) {
    const h = await ready({ connection: { state, started: null } });
    h.app.setDraft("Why does it swing?");
    assert.equal(st(h), id);
    assertAskFirst(h, id);
    const v = html(h);
    assert.doesNotMatch(v, /<textarea[^>]*disabled/, `${id}: you can still type`);
    assert.match(v, /id="ask-go"[^>]*aria-disabled="true"/);
    assert.match(v, new RegExp(`id="ask-why">${why}<`));
    assert.match(v, new RegExp(`<small id="quiet-why">${why}</small>`));
    h.app.act("ask_home");
    assert.equal(h.adapters.length, 0, `${id}: a paused Ask sends nothing`);
  }
});

test("T101: Ask is always on with AE connected; a comp_active from the bridge changes nothing", async () => {
  for (const c of [CONNECTED, Object.assign({}, CONNECTED, { comp_active: false })]) {
    const h = await ready({ connection: c, memory: { status: "ok", record: LESSON } });
    h.app.setDraft("Why?");
    assert.equal(st(h), "ask-typing");
    assert.match(html(h), /id="ask-go"[^>]*aria-disabled="false"/);
    assert.match(html(h), /class="qline" data-action="find_next"/);
    assert.equal(words(h).includes("Needs an open comp."), false);
  }
});
