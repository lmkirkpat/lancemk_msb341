// Spec 014 T102 (amendment (e), contracts/panel-ask.md › Requests and › Context after a lesson,
// data-model § 7): the first follow-up or Try again after a lesson carries the thread's last question
// and answer, built from the validated AskView only, and never reaches the screen.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { askView } = require("../lib/ask-result.js");
const { REQUESTS, contextRequest } = require("../lib/requests.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const Q = "How can I make the rock shake from the hammer hit?";
const GIVE = (json) => ({ name: "give_answer", ok: true, text: JSON.stringify(json), images: [], json });
const view = (json) => askView(GIVE(json), { runtime: "a" });

// COMP1's wrapper, written out by hand from the contract's template.
const COMP1_WRAPPED = [
  "/ask-mentor Earlier question and answer, as shown in the panel:",
  `Question: ${Q}`,
  "Answer: In Comp 1, rock.png rides on Shake Control, a null moved by expressions:",
  "- All three hits are the same size.",
  "- Rotation is too small to see: 0.75° at most, gone in about 1/3 s.",
  "- The turn centers on the rock, where Shake Control sits.",
  "Steps:",
  "1. Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet. (layer: Shake Control)",
  "2. Open Shake Control's Rotation expression and look at its amounts: 0.75° at most, too small to see. Not something I teach yet. (layer: Shake Control)",
  "3. Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits. (layer: Shake Control)",
  "4. Play it back and watch the turn.",
  "Closing: Try them, or want to go deeper on step 3 with *Set the pivot*?",
  "Follow-up: Why the null?",
].join("\n");

// ---------- the request ----------

test("the wrapper's first line is a REQUESTS constant, eval-synced (T104)", () => {
  assert.equal(REQUESTS.ask_context.request, "Earlier question and answer, as shown in the panel:");
});

test("byte for byte: steps with and without a layer, and the closing offer", () => {
  const r = contextRequest({ text: Q, view: view(COMP1) }, "Why the null?");
  assert.equal(r.request, COMP1_WRAPPED);
  assert.equal(r.label, "Why the null?", "the bubble shows the text as typed");
  assert.equal(r.kind, "followup");
});

test("byte for byte: no steps means no Steps block; no closing offer means no Closing line", () => {
  const describe = { kind: "describe", comp: "Comp 1", explanation: "Sweep Control is a null with two Position keys.", steps: [], offered_skills: [], closing_offer: "Want to know what it drives?", runtime: "a", tags: {} };
  assert.equal(contextRequest({ text: "What's Sweep Control?", view: view(describe) }, "And the shine?").request,
    "/ask-mentor Earlier question and answer, as shown in the panel:\nQuestion: What's Sweep Control?\nAnswer: Sweep Control is a null with two Position keys.\nClosing: Want to know what it drives?\nFollow-up: And the shine?");
  const clarify = { kind: "clarify", comp: "Comp 1", explanation: "Do you mean the rock or the shine?", steps: [], offered_skills: [], closing_offer: null, runtime: "a", tags: {} };
  assert.equal(contextRequest({ text: "Why?", view: view(clarify) }, "The rock.").request,
    "/ask-mentor Earlier question and answer, as shown in the panel:\nQuestion: Why?\nAnswer: Do you mean the rock or the shine?\nFollow-up: The rock.");
});

test("byte for byte: a step whose layer is null has no layer note", () => {
  const one = { kind: "answer", comp: "Comp 1", explanation: "In Comp 1, the turn is small.", steps: [{ text: "Play it back.", skill: null, layer: null }, { text: "Pan Behind the pivot.", skill: "transform.anchor", layer: "Door" }], offered_skills: [], closing_offer: "Try them?", runtime: "a", tags: { "transform.anchor": "Set the pivot" } };
  assert.equal(contextRequest({ text: "Why?", view: view(one) }, "Done.").request,
    "/ask-mentor Earlier question and answer, as shown in the panel:\nQuestion: Why?\nAnswer: In Comp 1, the turn is small.\nSteps:\n1. Play it back.\n2. Pan Behind the pivot. (layer: Door)\nClosing: Try them?\nFollow-up: Done.");
});

test("no tags, offers or kind in the wrapper; a null view (FR-048's fallback) is the prefix and the text only", () => {
  const r = contextRequest({ text: Q, view: view(COMP1) }, "Why the null?").request;
  assert.doesNotMatch(r, /transform\.anchor|not_taught|offered|Go deeper|kind/, "no skill ids, offers or kind");
  assert.equal(r.split("\n").filter((l) => /^Set the pivot$/.test(l)).length, 0, "no tag lines");
  assert.equal(contextRequest({ text: Q, view: null, prose: "Something went wrong." }, "Why the null?").request, "/ask-mentor Why the null?");
  assert.equal(contextRequest(null, "Why the null?").request, "/ask-mentor Why the null?");
});

// ---------- in the panel ----------

const words = (h) => {
  const r = renderApp(h.app.model());
  if (!r.lesson) return r.nav + r.view;
  const c = r.lesson.chat;
  return [r.nav, r.lesson.head, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n");
};

async function askedThenLesson(json, opts) {
  const h = await ready(Object.assign({ runtime: "a", memory: { status: "ok", record: LESSON }, setTimeout: () => 0 }, opts));
  h.app.setDraft(Q);
  h.app.act("ask_home");
  if (json) h.adapter().emit("tool_result", GIVE(json));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  h.app.act("thread_back");
  h.app.act("find_next");
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
  h.app.act("end_lesson");
  h.app.act("back_question");
  return h;
}

test("the first follow-up after a lesson sends the wrapper; the bubble and every screen show only the text", async () => {
  const h = await askedThenLesson(COMP1);
  assert.equal(h.app.followUp("Why the null?"), true);
  assert.deepEqual(h.adapter().sent[0], { text: COMP1_WRAPPED, kind: "followup" });
  const busy = words(h);
  assert.ok(busy.includes("Why the null?"));
  for (const bit of ["Earlier question and answer", "Question:", "Follow-up:", "(layer:", "/ask-mentor"]) assert.equal(busy.includes(bit), false, `never on screen: ${bit}`);
  h.adapter().emit("text", { text: "It carries the rock." });
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  const done = words(h);
  for (const bit of ["Earlier question and answer", "Follow-up:", "(layer:"]) assert.equal(done.includes(bit), false, `never on screen: ${bit}`);
  assert.equal(JSON.stringify(h.saved.thread).includes("Earlier question and answer"), false, "the saved thread keeps the text as typed");
  assert.equal(h.turns.at(-1).kind, "followup");
});

test("only the first send is wrapped; the next follow-up is plain", async () => {
  const h = await askedThenLesson(COMP1);
  h.app.followUp("Why the null?");
  h.adapter().emit("text", { text: "It carries the rock." });
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(h.saved.thread.after_lesson, false);
  h.app.followUp("And the letters?");
  assert.equal(h.adapter().sent[1].text, "And the letters?");
});

test("Try again resends the same wrapped request, in this panel and after a close", async () => {
  const h = await askedThenLesson(COMP1);
  h.app.followUp("Why the null?");
  h.adapter().emit("turn_end", { ok: false, kind: "followup" }); // stopped: the notice and Try again
  assert.equal(h.saved.thread.after_lesson, true, "a failed send doesn't count as the context going through");
  h.app.act("ask_try_again");
  assert.equal(h.adapter().sent.at(-1).text, COMP1_WRAPPED);
  h.app.shutdown();
  const again = await ready({ runtime: "a", thread: h.saved.thread, setTimeout: () => 0 }); // closed while that retry loaded
  again.app.act("back_question");
  again.app.act("ask_try_again");
  assert.equal(again.adapter().sent[0].text, COMP1_WRAPPED);
  const bubbles = words(again).split("Why the null?").length - 1;
  assert.equal(bubbles, 1, "one bubble, the text as typed");
});

test("the wrapper is saved with the thread: reopened after the lesson, the first follow-up still carries it", async () => {
  const h = await askedThenLesson(COMP1);
  assert.equal(h.saved.thread.after_lesson, true);
  h.app.shutdown();
  const again = await ready({ runtime: "a", thread: h.saved.thread, setTimeout: () => 0 });
  again.app.act("back_question");
  again.app.followUp("Why the null?");
  assert.equal(again.adapter().sent[0].text, COMP1_WRAPPED);
});

test("the latest answer a fallback (no valid view): the prefix and the text only", async () => {
  const bad = JSON.parse(JSON.stringify(COMP1));
  bad.offered_skills = ["transform.anchor", "parenting.null", "timing.offset"];
  const h = await askedThenLesson(bad);
  assert.equal(h.app.model().thread.questions[0].view, null);
  h.app.followUp("Why the null?");
  assert.equal(h.adapter().sent[0].text, "/ask-mentor Why the null?");
});

test("only the latest answer, never an earlier one; an entry with nothing under it is skipped", async () => {
  const h = await ready({ runtime: "a", memory: { status: "ok", record: LESSON }, setTimeout: () => 0 });
  h.app.setDraft("An older question?");
  h.app.act("ask_home");
  h.adapter().emit("tool_result", GIVE({ kind: "describe", comp: "Comp 1", explanation: "Older answer.", steps: [], offered_skills: [], closing_offer: null, runtime: "a", tags: {} }));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  h.app.followUp(Q);
  h.adapter().emit("tool_result", GIVE(COMP1));
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  h.app.followUp("Lost one?");
  h.adapter().emit("turn_end", { ok: false, kind: "followup" }); // stopped: nothing under it
  h.app.act("thread_back");
  h.app.act("find_next");
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
  h.app.act("end_lesson");
  h.app.act("back_question");
  h.app.followUp("Why the null?");
  const sent = h.adapter().sent[0].text;
  assert.equal(sent, COMP1_WRAPPED);
  assert.equal(sent.includes("Older answer."), false);
});

test("no lesson, no wrapper: a follow-up goes as typed", async () => {
  const h = await ready({ runtime: "a", setTimeout: () => 0 });
  h.app.setDraft(Q);
  h.app.act("ask_home");
  h.adapter().emit("tool_result", GIVE(COMP1));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  h.app.followUp("Why the null?");
  assert.equal(h.adapter().sent[1].text, "Why the null?");
});

test("a new question on Home after a lesson goes as a question, unwrapped, and then follow-ups are plain", async () => {
  const h = await askedThenLesson(COMP1);
  h.app.act("thread_back");
  h.app.setDraft("What does Sweep Control do?");
  h.app.act("ask_home");
  assert.equal(h.adapter().sent[0].text, "/ask-mentor What does Sweep Control do?");
  h.adapter().emit("tool_result", GIVE({ kind: "describe", comp: "Comp 1", explanation: "A null.", steps: [], offered_skills: [], closing_offer: null, runtime: "a", tags: {} }));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  h.app.followUp("And?");
  assert.equal(h.adapter().sent[1].text, "And?");
});

test("each lesson arms it again", async () => {
  const h = await askedThenLesson(COMP1);
  h.app.followUp("Why the null?");
  h.adapter().emit("text", { text: "It carries the rock." });
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  h.app.act("thread_back");
  h.app.act("find_next");
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
  h.app.act("end_lesson");
  h.app.act("back_question");
  h.app.followUp("Still?");
  // The latest answered entry is the prose follow-up (no view): prefix and text only.
  assert.equal(h.adapter().sent[0].text, "/ask-mentor Still?");
});
