// Spec 014 T029 (FR-054, MU › Accessibility): the new states' paused controls stay focusable with
// their reason linked, the steps toggle names what it opens, Steps is a heading, ids survive the
// redraws focus depends on, Enter sends and Shift+Enter adds a line, and nothing is under 11 px.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ready, CONNECTED, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { askBoxKey } = require("../lib/keys.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const GIVE = (json) => ({ name: "give_answer", ok: true, text: JSON.stringify(json), images: [], json });
function html(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return r.nav + r.view;
  const c = r.lesson.chat;
  return [r.nav, r.lesson.head, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n");
}
const ids = (s) => new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const refs = (s) => [...s.matchAll(/aria-(?:describedby|controls|labelledby)="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));

async function answered(opts) {
  const h = await ready(Object.assign({ runtime: "a", memory: { status: "ok", record: LESSON }, setTimeout: () => 0 }, opts));
  h.app.setDraft("How can I make the rock shake from the hit?");
  h.app.act("ask_home");
  h.adapter().emit("tool_result", GIVE(COMP1));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  return h;
}

const STATES = {
  "home-return": () => ready({ memory: { status: "ok", record: LESSON } }),
  "home-unreachable": () => ready({ connection: { state: "not_connected", started: null } }),
  "home-nocomp": () => ready({ connection: { state: "connected", started: CONNECTED.started, comp_active: false } }),
  "ask-typing": async () => { const h = await ready({ setTimeout: () => 0 }); h.app.setDraft("Why?"); return h; },
  "ask-sending": async () => { const h = await ready({ setTimeout: () => 0 }); h.app.setDraft("Why?"); h.app.act("ask_home"); return h; },
  "ask-answer": () => answered(),
  "ask-steps-open": async () => { const h = await answered(); h.app.act("toggle_steps", { short: false }); return h; },
  "ask-busy": async () => { const h = await answered(); h.app.setConnection({ state: "busy", started: CONNECTED.started }); return h; },
  "ask-reading": async () => { const h = await answered(); h.app.followUp("Why the null?"); return h; },
};

for (const [id, drive] of Object.entries(STATES)) {
  test(`${id}: every aria reference points at something on screen; no disabled control hides a reason`, async () => {
    const s = html(await drive());
    const have = new Set([...ids(s), ...ids(fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8"))]); // the tabs control index.html's #view
    for (const r of refs(s)) assert.ok(have.has(r), `${id}: ${r} isn't on screen`);
    for (const m of s.matchAll(/<button[^>]*aria-disabled="true"[^>]*>/g)) {
      if (/aria-busy="true"/.test(m[0])) continue; // a pressed button is working, not paused
      assert.match(m[0], /aria-describedby="[^"]+"/, `${id}: a paused button says why: ${m[0]}`);
    }
    assert.doesNotMatch(s, /style="[^"]*font/, `${id}: no inline font size`);
  });
}

test("Ask paused uses aria-disabled, never disabled, so it stays in the tab order with its reason linked", async () => {
  const h = await ready({ connection: { state: "not_connected", started: null } });
  const s = html(h);
  assert.match(s, /<button type="submit" id="ask-go"[^>]*aria-disabled="true" aria-describedby="ask-why"/);
  assert.doesNotMatch(s, /id="ask-go"[^>]*\sdisabled/);
});

test("an empty box links \"Type a question first.\" for screen readers; typing drops it", async () => {
  const h = await ready({ memory: { status: "ok", record: LESSON } });
  assert.match(html(h), /aria-describedby="ask-why ask-empty"/);
  assert.match(html(h), /<span class="sr" id="ask-empty">Type a question first\.<\/span>/);
  h.app.setDraft("Why?");
  assert.match(html(h), /id="ask-go"[^>]*aria-describedby="ask-why"/);
});

test("the ask box has a visible label, not only a placeholder", async () => {
  const s = html(await ready());
  assert.match(s, /<label class="small" for="ask-q">What do you want to know or change\?<\/label>/);
  assert.match(s, /<textarea id="ask-q"/);
});

test("Your steps' twirl-down is a button with aria-expanded and aria-controls on the list", async () => {
  const s = html(await answered());
  assert.match(s, /<button type="button" class="check-head" aria-expanded="false" aria-controls="ask-steps-body"/);
  assert.match(s, /<div class="check-body" id="ask-steps-body" hidden>/);
});

test("Steps in the answer is a heading that labels its section", async () => {
  const s = html(await answered());
  const m = /<section class="stepsblock" aria-labelledby="([^"]+)"><h3 class="steps-lbl" id="([^"]+)">Steps<\/h3>/.exec(s);
  assert.ok(m, "a labelled section with a heading");
  assert.equal(m[1], m[2]);
});

test("focus is never dropped: the controls a press redraws keep their ids, and boxes keep what was typed", async () => {
  const typing = html(await STATES["ask-typing"]());
  const sending = html(await STATES["ask-sending"]());
  for (const s of [typing, sending]) assert.match(s, /id="ask-go"/, "Ask and Asking… are the same control");
  assert.match(typing, /<textarea id="ask-q"[^>]*data-keep-value/);
  assert.match(typing, /data-action="ask_home" data-keep-focus/, "a press keeps focus on Ask");
  const thread = html(await answered());
  assert.match(thread, /<input id="ask-in"[^>]*data-keep-value/);
  const busy = html(await STATES["ask-reading"]());
  assert.match(busy, /<input id="ask-in"/, "the follow-up box stays while the mentor answers");
  assert.doesNotMatch(busy, /<input id="ask-in"[^>]*disabled/, "not disabled, so focus stays in it");
  assert.match(busy, /role="status"/, "the status line announces what's happening");
  const main = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
  assert.match(main, /data-keep-value/);
  assert.match(main, /again\.focus\(\)/, "main.js puts focus back on the redrawn control");
});

test("Enter sends; Shift+Enter (or any modifier, or an IME composing) doesn't", () => {
  assert.equal(askBoxKey({ key: "Enter" }), "send");
  assert.equal(askBoxKey({ key: "Enter", shiftKey: true }), null);
  assert.equal(askBoxKey({ key: "Enter", isComposing: true }), null);
  assert.equal(askBoxKey({ key: "Enter", metaKey: true }), null);
  assert.equal(askBoxKey({ key: "a" }), null);
  assert.equal(askBoxKey(null), null);
});

test("nothing new is under 11 px: every new rule's size is 11 px or more", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "panel.css"), "utf8");
  const ours = css.slice(css.indexOf("Spec 014: ask-first Home"));
  assert.ok(ours.length > 100);
  for (const m of ours.matchAll(/font-size:\s*([\d.]+)px/g)) assert.ok(Number(m[1]) >= 11, m[0]);
});

test("the quiet line's full text is its accessible name and its title (MU › Accessibility)", async () => {
  const s = html(await ready({ connection: { state: "connected", started: CONNECTED.started, comp_active: false } }));
  assert.match(s, /class="qline" aria-disabled="true" aria-describedby="quiet-why" title="Find my next lesson\. Needs an open comp\."/);
});

test("T035 item 3: pressing Ask keeps the box focusable: readonly while it's out, never disabled (FR-054)", async () => {
  const h = await ready({ setTimeout: () => 0 });
  h.app.setDraft("Why does it swing?");
  h.app.act("ask_home");
  assert.equal(h.app.model().state, "ask-sending");
  const s = html(h);
  assert.match(s, /<textarea id="ask-q"[^>]*\sreadonly/);
  assert.doesNotMatch(s, /<textarea id="ask-q"[^>]*\sdisabled/);
  assert.match(s, />Why does it swing\?<\/textarea>/, "the question stays in the box while it goes");
});
