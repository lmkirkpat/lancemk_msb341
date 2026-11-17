// Spec 007 T015, T016: the tab shell and Home (FR-001 to FR-005, FR-007, FR-008, FR-057, FR-077 to
// FR-079, SC-004). No DOM: the HTML strings from lib/screens.js, and the controller.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, makeApp, tick, plain, LESSON } = require("./app-harness.js");
const { renderApp, nextTab } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");

const render = (h) => { const r = renderApp(h.app.model()); return { nav: plain(r.nav), view: plain(r.view), lesson: r.lesson }; };
const home = (h) => render(h).view;

test("FR-001: three tabs, Home selected, a real tablist with a roving tabindex", async () => {
  const nav = render(await ready()).nav;
  assert.match(nav, /role="tablist"/);
  for (const t of ["Home", "Lesson", "Skills"]) assert.ok(nav.includes(`>${t}`), t);
  assert.match(nav, /id="tab-home"[^>]*aria-selected="true"[^>]*tabindex="0"/);
  assert.match(nav, /id="tab-lesson"[^>]*aria-selected="false"[^>]*tabindex="-1"/);
  assert.match(nav, /aria-controls="view"/);
});

test("FR-077: Left, Right, Home and End move between the tabs and wrap", () => {
  assert.equal(nextTab("home", "ArrowRight"), "lesson");
  assert.equal(nextTab("skills", "ArrowRight"), "home");
  assert.equal(nextTab("home", "ArrowLeft"), "skills");
  assert.equal(nextTab("lesson", "Home"), "home");
  assert.equal(nextTab("home", "End"), "skills");
  assert.equal(nextTab("home", "a"), null);
});

test("FR-002: the connection mark has a shape and a word for all three states", async () => {
  const h = await ready();
  assert.match(render(h).nav, /conn ok[^]*>AE</);
  h.app.setConnection({ state: "not_connected", started: null });
  assert.ok(render(h).nav.includes(COPY.connection.not_connected));
  assert.match(render(h).nav, /conn bad/);
  h.app.setConnection({ state: "busy", started: null });
  assert.ok(render(h).nav.includes(COPY.connection.busy));
  assert.match(render(h).nav, /conn busy/);
});

test("FR-003: the Lesson tab says why it's empty and offers two ways on; no tab is ever disabled", async () => {
  const h = await ready();
  h.app.act("tab", { tab: "lesson" });
  assert.equal(h.app.model().state, "lesson-none");
  const v = render(h).view;
  assert.ok(v.includes(COPY.lesson.none_title));
  assert.ok(v.includes(COPY.buttons.go_home));
  assert.ok(v.includes(COPY.buttons.pick_skill));
  assert.doesNotMatch(render(h).nav, /role="tab"[^>]*disabled/);
});

test("FR-013: Pick a skill goes to the Skills tab; FR-005: switching tabs sends nothing", async () => {
  const h = await ready();
  h.app.act("pick_skill");
  assert.equal(h.app.model().tab, "skills");
  h.app.act("tab", { tab: "home" });
  assert.equal(h.adapters.length, 0);
});

test("home-first (spec 014): the welcome, the ask card, then Find my next lesson; no Start lesson, no memory", async () => {
  const h = await ready();
  assert.equal(h.app.model().state, "home-first");
  const v = home(h);
  assert.ok(v.indexOf(COPY.home.welcome_first) < v.indexOf(COPY.ask.card_title));
  assert.ok(v.indexOf(COPY.ask.card_title) < v.indexOf(COPY.buttons.find_next), "the ask card leads (decisions/012)");
  assert.equal(v.includes(COPY.buttons.start), false);
  assert.equal(v.includes(COPY.home.memory_title), false, "memory moved to Skills");
  assert.equal(v.includes(COPY.home.first_why), false);
});

test("home-return (spec 014): the ask card and Find my next lesson; nothing else from the record", async () => {
  const h = await ready({ memory: { status: "ok", record: LESSON } });
  assert.equal(h.app.model().state, "home-return");
  const v = home(h);
  assert.ok(v.includes(COPY.ask.card_title));
  assert.ok(v.includes(COPY.buttons.find_next));
  for (const gone of [COPY.home.welcome_back, "Oct 26", COPY.home.next_time, COPY.home.up_next, COPY.home.memory_title, COPY.buttons.pick_skill]) assert.equal(v.includes(gone), false, gone);
});

test("home-unreadable and What happened?: a banner, not a first run; Got it returns to the first-run screen", async () => {
  const h = await ready({ memory: { status: "unreadable", record: null } });
  assert.equal(h.app.model().state, "home-unreadable");
  assert.ok(home(h).includes(COPY.home.unreadable.title));
  assert.doesNotMatch(home(h), new RegExp(COPY.home.welcome_first));
  h.app.act("what_happened");
  assert.equal(h.app.model().state, "home-unreadable-why");
  assert.ok(home(h).includes(COPY.home.unreadable_why.title));
  h.app.act("got_it_unreadable");
  assert.equal(h.app.model().state, "home-first");
});

test("home-unreachable and home-busy: banner, AE actions replaced by why in words, Try again polls", async () => {
  const h = await ready();
  h.app.setConnection({ state: "not_connected", started: null });
  assert.equal(h.app.model().state, "home-unreachable");
  let v = home(h);
  assert.ok(v.includes(COPY.home.unreachable.title));
  assert.ok(v.includes(COPY.paused.needs_ae));
  assert.match(render(h).view, /id="ask-go"[^>]*aria-disabled="true"/, "Ask paused with the reason, still focusable");
  assert.equal(v.includes(COPY.buttons.start), false);
  h.app.act("reconnect");
  assert.equal(h.polled(), 1);
  await tick();
  h.app.setConnection({ state: "busy", started: null });
  assert.equal(h.app.model().state, "home-busy");
  v = home(h);
  assert.ok(v.includes(COPY.home.busy.title));
  assert.ok(v.includes(COPY.paused.waiting_ae));
});

test("home-loading shows only after 300 ms, and the first paint comes from the record alone (SC-004)", async () => {
  let release;
  const timers = [];
  const slow = makeApp({ readRecord: () => new Promise((r) => { release = r; }), setTimeout: (fn) => timers.push(fn) });
  slow.app.init();
  assert.notEqual(slow.app.model().state, "home-loading");
  timers[0]();
  assert.equal(slow.app.model().state, "home-loading");
  assert.ok(home(slow).includes("aria-busy"));
  release({ status: "missing", record: null });
  await tick();
  assert.equal(slow.app.model().state, "home-first");
  assert.equal(slow.adapters.length, 0, "no mentor turn to draw Home");
});

test("a pending read draws no first-run card before the record answers", () => {
  const pending = makeApp({ readRecord: () => new Promise(() => {}) });
  pending.app.init();
  assert.equal(renderApp(pending.app.model()).view.includes(COPY.buttons.start), false);
});

test("Home at 260 wide: every button in a card is a real button (FR-079)", async () => {
  const h = await ready();
  const v = home(h);
  assert.equal((v.match(/<button/g) || []).length, (v.match(/<\/button>/g) || []).length);
  assert.doesNotMatch(v, /<div[^>]+onclick/);
});
