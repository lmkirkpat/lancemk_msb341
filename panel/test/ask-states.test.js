// Spec 014 T020, T021, T023 (SC-011): every phase 1 state MU adds or changes, driven from fixture
// events through the real app and screens, with no mentor. Each case says how to get there and what
// the screen must show. The give_answer results are fixtures shaped by contracts/ask-tools.md;
// the tool itself (T013) isn't built yet.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, plain, tick, SIX_PATH, SKILLS_BUILT, LESSON, CONNECTED } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { STATE_IDS } = require("../lib/view-state.js");
const { COPY } = require("../lib/copy.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");
const PHASE = require("../lib/phase.js");

// Go deeper is phase 2's (T053 to T057); these tests turn it on to check what that phase inherits.
async function withGoDeeper(fn) {
  const was = PHASE.FLAGS.go_deeper;
  PHASE.FLAGS.go_deeper = true;
  try { return await fn(); } finally { PHASE.FLAGS.go_deeper = was; }
}

const A = COPY.ask;
const Q = "How can I make the rock shake from the hammer hit?";
const GIVE = (json) => ({ name: "give_answer", ok: true, text: JSON.stringify(json), images: [], json });
const kindOnly = (kind, explanation, closing) => ({ kind, comp: null, explanation, steps: [], offered_skills: [], closing_offer: closing === undefined ? null : closing, runtime: "a", tags: {} });
const CLARIFY = kindOnly("clarify", "Do you mean the rock's shake, on Shake Control, or the shine's sweep, on Sweep Control?");
const OUTSIDE = kindOnly("outside", "Exporting is outside what I cover. I can help with how things move in Comp 1.", "Want to ask about the motion instead?");
const NOCOMP = kindOnly("no_comp", "No comp is open in After Effects, so there's nothing for me to read.");
const DESCRIBE = Object.assign(kindOnly("describe", "Sweep Control is a null with two Position keys, at 3.37 s and 3.54 s.", "Want to know what it drives?"), { comp: "Comp 1" });

// A panel with a fake timer queue, so Asking… and Still reading are driven by hand.
async function panel(opts) {
  const timers = [];
  const h = await ready(Object.assign({ runtime: "a", memory: { status: "ok", record: LESSON }, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; } }, opts));
  h.fire = (ms) => { const due = timers.filter((x) => x.ms === ms); for (const t of due) timers.splice(timers.indexOf(t), 1); due.forEach((t) => t.fn()); };
  return h;
}
const st = (h) => h.app.model().state;
function screen(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return { html: r.nav + r.view, r };
  const c = r.lesson.chat;
  return { html: [r.nav, r.lesson.head, r.lesson.banner, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n"), r };
}
const text = (h) => plain(screen(h).html);

function askFromHome(h, q) {
  h.app.setDraft(q || Q);
  h.app.act("ask_home");
  return h.adapter();
}
function answer(h, json, kind) {
  const a = h.adapter();
  a.emit("tool_call", { name: "describe_layers" });
  a.emit("tool_result", { name: "describe_layers", ok: true, text: "{}", images: [], json: {} });
  if (json) a.emit("tool_result", GIVE(json));
  a.emit("turn_end", { ok: true, kind: kind || "question", total_ms: 4000, first_event_ms: 900 });
}
async function answered(json, opts) {
  const h = await panel(opts);
  askFromHome(h);
  answer(h, json || COMP1);
  return h;
}

// state id → [drive, markers the screen must show, markers it must not].
const CASES = {
  "ask-typing": [async () => { const h = await panel(); h.app.setDraft(Q); return h; }, [A.card_title, A.hint], []],
  "ask-sending": [async () => { const h = await panel(); askFromHome(h); return h; }, [A.pressed, A.reading, A.after_answer], []],
  "ask-reading": [async () => { const h = await panel(); askFromHome(h); h.fire(600); return h; }, [Q, A.reading, A.thread_title, A.answering], ["/ask-mentor"]],
  "ask-reading-long": [async () => { const h = await panel(); askFromHome(h); h.fire(600); h.fire(6000); return h; }, [A.reading_long], [A.reading + "<"]],
  "ask-answer": [() => answered(), ["In Comp 1, rock.png rides on Shake Control", A.steps, "Set the pivot", A.your_steps(4), A.steps_note, "Try them, or want to go deeper"], ["/ask-mentor", "✓", "Go deeper:"]],
  "ask-followup": [async () => {
    const h = await answered();
    assert.equal(h.app.followUp("Why the null?"), true);
    h.adapter().emit("text", { text: "Shake Control is the layer that moves." });
    h.adapter().emit("turn_end", { ok: true, kind: "followup" });
    return h;
  }, ["Why the null?", "Shake Control is the layer that moves.", A.your_steps(4)], []],
  "ask-steps-open": [async () => { const h = await answered(); h.app.act("toggle_steps", { short: false }); return h; }, [A.your_steps(4), "Play it back and watch the turn."], []],
  "ask-clarify": [() => answered(CLARIFY), ["Do you mean the rock's shake"], [A.steps_note, "Go deeper", A.steps.toUpperCase()]],
  "ask-outside": [() => answered(OUTSIDE), ["Exporting is outside what I cover.", A.see_covered], [A.steps_note, "Go deeper"]],
  "ask-unreachable": [async () => {
    const h = await panel();
    askFromHome(h);
    const a = h.adapter();
    a.emit("tool_call", { name: "describe_layers" });
    a.emit("tool_result", { name: "describe_layers", ok: false, text: "AE_UNREACHABLE: After Effects isn't answering.", images: [] });
    a.emit("text", { text: "I can't see After Effects right now, so I haven't read your comp." });
    a.emit("turn_end", { ok: true, kind: "question" });
    return h;
  }, ["I can't see After Effects right now", COPY.buttons.try_again, COPY.paused.needs_ae, COPY.connection.not_connected], []],
  "ask-nocomp": [() => answered(NOCOMP), ["No comp is open in After Effects", COPY.buttons.try_again], [A.steps_note]],
  "ask-busy": [async () => {
    const h = await answered();
    h.app.followUp("Why the null?");
    h.app.setConnection({ state: "busy", started: CONNECTED.started });
    return h;
  }, [A.busy_status, COPY.paused.waiting_ae, COPY.connection.busy, A.your_steps(4)], []],
  "ask-new-question": [async () => {
    const h = await answered();
    h.app.act("thread_back");
    askFromHome(h, "What does the sweep control layer do?");
    answer(h, DESCRIBE);
    return h;
  }, [A.earlier(1), "Sweep Control is a null with two Position keys"], [A.steps_note]],
  "home-thread": [async () => { const h = await answered(); h.app.act("thread_back"); return h; }, [A.card_title, A.back_to_question, COPY.buttons.find_next], []],
  "skills-due": [async () => {
    const record = { skills: { "timing.offset": { status: "learned", last_practiced: "2026-10-26T12:00:00.000Z", review_due: "2026-11-01" } }, lessons: [{ skill: "timing.offset", date: "2026-10-26T12:00:00.000Z", result: "passed" }] };
    const h = await panel({ memory: { status: "ok", record }, pathData: SIX_PATH, skillsBuilt: SKILLS_BUILT });
    h.app.act("tab", { tab: "skills" });
    return h;
  }, [COPY.skills.due_line("Oct 26"), COPY.buttons.warm_up, COPY.home.memory_title], []],
};

test("every case is a state id this panel knows", () => {
  for (const id of Object.keys(CASES)) assert.ok(STATE_IDS.includes(id), id);
});

for (const [id, [drive, show, hide]] of Object.entries(CASES)) {
  test(`SC-011: ${id} is reachable from fixture events and shows what it should`, async () => {
    const h = await drive();
    assert.equal(st(h), id);
    const t = text(h);
    for (const m of show) assert.ok(t.includes(m), `${id} should show: ${m}`);
    for (const m of hide) assert.equal(t.includes(m), false, `${id} shouldn't show: ${m}`);
  });
}

// ---------- the answer, drawn from data (FR-048, PQ-1) ----------

test("FR-048: explanation, then Steps and the numbered list, then the closing offer, then Go deeper; tags in bold italics", () => withGoDeeper(async () => {
  const h = await answered();
  const { r } = screen(h);
  const msg = r.lesson.chat.items.join("");
  const at = (s) => msg.indexOf(s);
  assert.ok(at("All three hits are the same size.") > -1 && /<ul><li>All three hits/.test(msg), "the explanation's bullets are bullets");
  assert.ok(at("All three hits") < at(`>${A.steps}<`));
  assert.ok(at(`>${A.steps}<`) < at("<ol class=\"ans\">"));
  assert.ok(at("<ol class=\"ans\">") < at("Try them, or want"));
  assert.ok(at("Try them, or want") < at(A.go_deeper("Set the pivot").replace("›", "")));
  assert.equal((msg.match(/<li>/g) || []).length, 3 + 4, "three bullets, four steps");
  assert.match(msg, /Pan Behind its pivot to where the hammer hits\. <em class="skill">Set the pivot<\/em>/);
  assert.doesNotMatch(msg, /Play it back and watch the turn\.\s*<em/, "PQ-5: the look step has no tag");
  assert.doesNotMatch(msg, /Not something I teach yet\.\s*<em/, "the not-taught words are the mentor's own, never said twice");
}));

test("T035 item 2: in phase 1 an answer that offers a skill draws no Go deeper, and a press does nothing; the closing offer still shows", async () => {
  assert.equal(PHASE.FLAGS.go_deeper, false, "off until phase 2");
  const h = await answered();
  assert.ok(COMP1.offered_skills.length > 0);
  const { html } = screen(h);
  assert.doesNotMatch(html, /Go deeper|deeper-btn|data-action="go_deeper"/);
  assert.ok(plain(html).includes("Try them, or want to go deeper on step 3 with"));
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.equal(h.adapter().sent.length, 1, "nothing sent");
  assert.equal(h.app.followUp("Why the null?"), true, "the bar isn't held by a press that didn't happen");
});

test("PQ-1, R2: prose beside a valid result isn't drawn; nothing is said twice", async () => {
  const h = await panel();
  askFromHome(h);
  const a = h.adapter();
  a.emit("text", { text: "Here's what I found in your comp, step by step." });
  a.emit("tool_result", GIVE(COMP1));
  a.emit("turn_end", { ok: true, kind: "question" });
  assert.equal(text(h).includes("step by step"), false);
  assert.ok(text(h).includes("In Comp 1, rock.png rides"));
});

// The real mentor writes no prose on an answer turn (FR-009, PQ-1), so a rejected result must never
// leave the question with nothing under it (T035 item 1).
const MALFORMED = {
  "five steps": Object.assign({}, COMP1, { steps: COMP1.steps.concat([{ text: "More.", skill: null, layer: null }]) }),
  "an unknown kind": Object.assign({}, COMP1, { kind: "essay" }),
  "an offer no step uses": Object.assign({}, COMP1, { offered_skills: ["parenting.null"], tags: { "transform.anchor": "Set the pivot", "parenting.null": "Group with a null" } }),
  "steps not an array": Object.assign({}, COMP1, { steps: "1. Open the expression." }),
};
for (const [what, json] of Object.entries(MALFORMED)) {
  test(`FR-048 fail closed with no prose: ${what} → the explanation and closing offer as text; no Steps, dock or Go deeper`, () => withGoDeeper(async () => {
    const h = await panel();
    askFromHome(h);
    answer(h, json);
    const { html, r } = screen(h);
    const t = plain(html);
    assert.ok(t.includes("In Comp 1, rock.png rides on Shake Control"), "the explanation");
    assert.ok(t.includes("Try them, or want to go deeper on step 3"), "the closing offer");
    assert.equal(r.lesson.list, "", "no dock");
    assert.doesNotMatch(html, /steps-lbl|deeper-btn|Go deeper|Open Shake Control's Position/);
    assert.equal(t.includes(A.question_still_here), false);
  }));
}

test("FR-048 fail closed: only a closing offer usable → it alone shows", async () => {
  const h = await panel();
  askFromHome(h);
  answer(h, Object.assign({}, COMP1, { explanation: 42, kind: "essay" }));
  const t = text(h);
  assert.ok(t.includes("Try them, or want to go deeper"));
  assert.equal(t.includes(A.question_still_here), false);
});

for (const [what, json] of Object.entries({ "no give_answer at all": null, "nothing usable in it": { kind: "answer", explanation: null, steps: [], closing_offer: 7 } })) {
  test(`FR-048 fail closed with nothing to show (${what}) → "Your question's still here." and Try again`, async () => {
    const h = await panel();
    askFromHome(h);
    answer(h, json);
    const t = text(h);
    assert.ok(t.includes(A.question_still_here));
    assert.ok(t.includes(COPY.buttons.try_again));
    assert.equal(screen(h).r.lesson.list, "");
    h.app.act("ask_try_again");
    assert.equal(h.adapter().sent.at(-1).text, `/ask-mentor ${Q}`);
  });
}

test("FR-017, SC-011: a b1 panel draws no Go deeper for any result", async () => {
  const h = await answered(COMP1, { runtime: "b1" });
  assert.equal(st(h), "ask-answer");
  assert.doesNotMatch(screen(h).html, /Go deeper|deeper-btn/);
  assert.ok(text(h).includes(A.your_steps(4)), "the steps still dock");
});

test("FR-049: Your steps holds only the latest steps, folded, no glyphs or ticks; opening it shows the list", async () => {
  const h = await answered();
  let dock = screen(h).r.lesson.list;
  assert.match(dock, /aria-expanded="false" aria-controls="ask-steps-body"/);
  assert.match(dock, /id="ask-steps-body" hidden/);
  assert.doesNotMatch(plain(dock), /[✓○●!?↻]/, "no glyphs");
  assert.equal(plain(dock).includes("All three hits"), false, "never the explanation");
  h.app.act("toggle_steps", { short: false });
  dock = screen(h).r.lesson.list;
  assert.match(dock, /aria-expanded="true"/);
  assert.doesNotMatch(dock, /id="ask-steps-body" hidden/);
  assert.equal((dock.match(/<li>/g) || []).length, 4);
});

test("Your steps at a short dock swaps with the chat, as the checklist does", async () => {
  const h = await answered();
  h.app.act("toggle_steps", { short: true });
  const r = screen(h).r;
  assert.equal(r.lesson.list_open, true);
  assert.doesNotMatch(r.lesson.list, /id="ask-steps-body" hidden/);
});

test("the learner's bubble shows the question as typed, never the command; the request carries it", async () => {
  const h = await answered();
  assert.deepEqual(h.adapter().sent[0], { text: `/ask-mentor ${Q}`, kind: "question" });
  assert.deepEqual(h.adapter().started[0], { skill: "ask-mentor" });
  assert.equal(text(h).includes("/ask-mentor"), false);
  h.app.followUp("Why the null?");
  assert.deepEqual(h.adapter().sent[1], { text: "Why the null?", kind: "followup" }, "a follow-up goes as typed, same conversation");
  assert.equal(h.adapters.length, 1);
});

test("a new question from Home joins the same conversation; earlier answers fold and lose their Go deeper", () => withGoDeeper(async () => {
  const h = await answered();
  h.app.act("thread_back");
  askFromHome(h, "What does the sweep control layer do?");
  assert.equal(h.adapters.length, 1, "same conversation (TD § 6 turn 7)");
  assert.equal(h.adapter().sent[1].text, "/ask-mentor What does the sweep control layer do?");
  answer(h, DESCRIBE);
  const items = screen(h).r.lesson.chat.items.join("");
  assert.doesNotMatch(items, /Go deeper/, "Go deeper stays inside its own answer, folded away (FR-050)");
  assert.equal(screen(h).r.lesson.list, "", "the dock goes away with a describe answer");
}));

test("Ask can't be pressed twice, and nothing else starts while it's out", async () => {
  const h = await panel();
  askFromHome(h);
  h.app.setDraft("Again?");
  h.app.act("ask_home");
  h.app.act("find_next");
  h.app.act("new_lesson", { skill: "timing.offset" });
  assert.equal(h.adapters.length, 1);
  assert.equal(h.adapter().sent.length, 1);
  assert.match(screen(h).html, /aria-busy="true"[^>]*>[^]*Asking…/);
});

test("Go deeper (phase 2, flag on) sends MU's sentence once, shows Starting…, and pauses the bar", () => withGoDeeper(async () => {
  const h = await answered();
  h.app.act("go_deeper", { skill: "transform.anchor" });
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.deepEqual(h.adapter().sent.slice(1), [{ text: "Yes, go deeper on Set the pivot.", kind: "go_deeper" }]);
  const t = text(h);
  assert.ok(t.includes("Yes, go deeper on Set the pivot."));
  assert.ok(t.includes(COPY.buttons.pressed.start));
  assert.ok(t.includes(COPY.status.lesson_ready));
  assert.equal(h.app.followUp("hello?"), false);
}));

test("Go deeper only for an offer the answer made", () => withGoDeeper(async () => {
  const h = await answered();
  h.app.act("go_deeper", { skill: "parenting.null" });
  assert.equal(h.adapter().sent.length, 1);
}));

test("ask-unreachable and ask-nocomp: Try again resends the same question, no second bubble", async () => {
  const h = await answered(NOCOMP);
  h.app.act("ask_try_again");
  assert.deepEqual(h.adapter().sent.at(-1), { text: `/ask-mentor ${Q}`, kind: "question" });
  assert.equal(h.app.model().thread.questions.length, 1);
  assert.ok(text(h).includes(COPY.buttons.pressed.try));
});

test("a passing error: the notice says the question's still here, and Try again resends it", async () => {
  const h = await panel();
  askFromHome(h);
  h.adapter().emit("error", { kind: "offline", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "question" });
  assert.ok(text(h).includes(COPY.errors.offline.title));
  assert.ok(text(h).includes(A.question_still_here));
  h.app.act("ask_try_again");
  assert.equal(h.adapter().sent.at(-1).text, `/ask-mentor ${Q}`);
});

test("a blocking error shows Home's banner; its Try again resends the question", async () => {
  const h = await panel();
  askFromHome(h);
  h.adapter().emit("error", { kind: "out_of_credit", message: "" });
  assert.equal(st(h), "err-credit");
  h.app.act("try_again");
  assert.equal(h.adapter().sent.at(-1).text, `/ask-mentor ${Q}`);
  assert.ok(h.adapters.length >= 2, "a new conversation start for the stopped one");
});

test("FR-058: each answer turn is logged as a question or follow-up with thread ask, never its words", async () => {
  const h = await answered();
  h.app.followUp("Why the null?");
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  assert.deepEqual(h.turns.map((t) => [t.kind, t.thread]), [["question", "ask"], ["followup", "ask"]]);
  assert.equal(JSON.stringify(h.turns).includes("rock"), false);
});

// Research R12 as amended 2026-11-16 (d), contracts/panel-ask.md rule 5 (T035 design review item 3):
// a lesson ends the thread's conversation, never the thread.
for (const [name, go] of [
  ["Find my next lesson", (h) => h.app.act("find_next")],
  ["a Skills lesson", (h) => h.app.act("new_lesson", { skill: "keyframes.types" })],
  ["Start lesson", (h) => h.app.act("start")],
]) {
  test(`${name} ends the thread's conversation but keeps its question, answer and steps (R12 (d))`, async () => {
    const h = await answered();
    h.app.act("thread_back");
    const before = h.saved.thread;
    go(h);
    assert.equal(h.adapters[0].stopped, 1, "the thread's conversation stops");
    assert.equal(h.app.model().tab, "lesson");
    assert.ok(h.saved.thread, "nothing deleted");
    assert.equal(h.saved.thread.claude_session_id, null, "the conversation is over: the next ask starts a new one");
    assert.deepEqual(h.saved.thread.questions, before.questions);
    assert.deepEqual(h.saved.thread.latest_steps, before.latest_steps);
    assert.ok(h.app.model().thread, "still in view");
  });
}

test("after the lesson, Back to your question opens the same answer and steps; a follow-up starts a new conversation with the ask skill", async () => {
  const h = await answered();
  h.app.act("thread_back");
  h.app.act("start");
  h.app.act("go_home");
  assert.ok(text(h).includes(A.back_to_question), "the way back shows while the lesson is open");
  h.adapter().emit("turn_end", { ok: true, kind: "start" }); // the lesson's first turn ends
  h.app.act("tab", { tab: "lesson" });
  h.app.act("end_lesson");
  assert.equal(st(h), "home-thread");
  assert.ok(text(h).includes(A.back_to_question));
  h.app.act("back_question");
  assert.equal(st(h), "ask-answer");
  assert.ok(text(h).includes("In Comp 1, rock.png rides on Shake Control"));
  assert.ok(text(h).includes(A.your_steps(4)));
  const n = h.adapters.length;
  assert.equal(h.app.followUp("Why the null?"), true);
  const a = h.adapter();
  assert.equal(h.adapters.length, n + 1, "a fresh conversation");
  assert.deepEqual(a.started[0], { skill: "ask-mentor" }, "not a resume");
  assert.deepEqual(a.sent[0], { text: "/ask-mentor Why the null?", kind: "followup" }, "the ask skill opens from the request");
  assert.equal(h.app.model().thread.claude_session_id, "session-1");
  assert.ok(text(h).includes("Why the null?"));
  assert.equal(text(h).includes("/ask-mentor"), false, "the bubble shows the text as typed");
  a.emit("text", { text: "It carries the rock." });
  a.emit("turn_end", { ok: true, kind: "followup" });
  h.app.followUp("And the letters?");
  assert.equal(a.sent[1].text, "And the letters?", "later follow-ups go as typed");
});

test("a new question on Home after the lesson starts a new conversation in the same visible thread", async () => {
  const h = await answered();
  h.app.act("thread_back");
  h.app.act("find_next");
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
  h.app.act("tab", { tab: "lesson" });
  h.app.act("end_lesson");
  askFromHome(h, "What does Sweep Control do?");
  assert.deepEqual(h.adapter().started[0], { skill: "ask-mentor" });
  assert.equal(h.adapter().sent[0].text, "/ask-mentor What does Sweep Control do?");
  const qs = h.app.model().thread.questions;
  assert.deepEqual(qs.map((q) => [q.text, q.folded]), [[Q, true], ["What does Sweep Control do?", false]]);
});

test("asking with a lesson waiting keeps that lesson; picking it up keeps the thread too", async () => {
  const SAVED = { version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "x", updated_at: "x", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 2 yours eased", sections: [], outside: [], stale: null, stale_kind: null, checked_at: null } }, messages: [] };
  const h = await answered(COMP1, { saved: SAVED });
  h.app.act("thread_back");
  assert.equal(st(h), "home-inprogress");
  assert.ok(text(h).includes(A.back_to_question), "both the line and the way back");
  h.app.act("continue");
  assert.equal(h.app.model().tab, "lesson");
  assert.ok(h.saved.thread, "nothing deleted");
  assert.equal(h.saved.thread.claude_session_id, null);
  assert.equal(h.saved.thread.questions[0].text, Q);
  h.app.act("go_home");
  assert.ok(text(h).includes(A.back_to_question));
});

test("the thread survives the panel closing; reopened, Home links back to it and a follow-up resumes the conversation", async () => {
  const h = await answered();
  h.app.shutdown();
  const again = await panel({ thread: h.saved.thread });
  assert.equal(st(again), "home-thread");
  again.app.act("back_question");
  assert.equal(st(again), "ask-answer");
  assert.ok(text(again).includes(A.your_steps(4)));
  again.app.followUp("Why the null?");
  assert.equal(again.adapter().started[0].resumeSessionId, "session-1");
  assert.equal(again.adapter().started[0].skill, "ask-mentor");
});

// T035 design review item 4; contracts/panel-ask.md › Requests and data-model § 7 as amended (d): a new
// question typed in the follow-up bar. The give_answer result's kind decides, never the words.
const NULL_ANSWER = { kind: "answer", comp: "Comp 1", explanation: "In Comp 1, the letters each move on their own.", steps: [{ text: "Parent the letters to a null.", skill: "parenting.null", layer: "Letters" }], offered_skills: ["parenting.null"], closing_offer: "Want to go deeper on Move a group?", runtime: "a", tags: { "parenting.null": "Move a group" } };

async function followedUp(json, prose) {
  const h = await answered();
  assert.equal(h.app.followUp("How do I move the letters together?"), true);
  const a = h.adapter();
  if (prose) a.emit("text", { text: prose });
  if (json) a.emit("tool_result", GIVE(json));
  a.emit("turn_end", { ok: true, kind: "followup" });
  return h;
}

for (const [kind, json] of [["answer", NULL_ANSWER], ["describe", DESCRIBE], ["howto", kindOnly("howto", "To move layers together, parent them to a null.", "Want to try it?")]]) {
  test(`T035 item 4: a follow-up answered with kind ${kind} is a new question: earlier entries fold, state and log say question`, async () => {
    const h = await followedUp(json);
    const qs = h.app.model().thread.questions;
    assert.deepEqual(qs.map((q) => [q.kind, q.folded]), [["question", true], ["question", false]]);
    assert.equal(st(h), "ask-new-question", "not ask-followup");
    assert.ok(text(h).includes(A.earlier(1)));
    assert.deepEqual(h.turns.map((t) => [t.kind, t.thread]), [["question", "ask"], ["question", "ask"]], "FR-058: logged as a question");
    assert.equal(h.adapter().sent[1].text, "How do I move the letters together?", "it went as typed: the decision is after the answer");
    assert.equal(h.saved.thread.questions[1].kind, "question", "saved that way");
  });
}

for (const [kind, json] of [["clarify", CLARIFY], ["outside", OUTSIDE], ["no_comp", NOCOMP]]) {
  test(`T035 item 4: a follow-up answered with kind ${kind} stays a follow-up`, async () => {
    const h = await followedUp(json);
    assert.deepEqual(h.app.model().thread.questions.map((q) => [q.kind, q.folded]), [["question", false], ["followup", false]]);
    assert.equal(h.turns[1].kind, "followup");
  });
}

test("T035 item 4: the words never decide; a prose follow-up that sounds new stays a follow-up", async () => {
  const h = await followedUp(null, "That's a new question. Here's a fresh answer about the letters.");
  assert.equal(st(h), "ask-followup");
  assert.deepEqual(h.app.model().thread.questions.map((q) => q.kind), ["question", "followup"]);
  assert.equal(h.turns[1].kind, "followup");
});

test("T035 item 4: a refused give_answer isn't a result; only the accepted one decides", async () => {
  const h = await answered();
  h.app.followUp("And the letters?");
  const a = h.adapter();
  a.emit("tool_result", { name: "give_answer", ok: false, text: "KIND_MISMATCH: An answer has one to four steps.", images: [] });
  a.emit("tool_result", GIVE(CLARIFY));
  a.emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(h.app.model().thread.questions[1].kind, "followup");
});

test("T035 item 4: Go deeper acts on the newest answer; the folded one's offer is gone", () => withGoDeeper(async () => {
  const h = await followedUp(NULL_ANSWER);
  const html = screen(h).html;
  assert.equal((html.match(/data-action="go_deeper"/g) || []).length, 1, "one Go deeper, the newest answer's");
  assert.match(html, /data-skill="parenting\.null"/);
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.equal(h.adapter().sent.length, 2, "the folded answer's offer does nothing");
  h.app.act("go_deeper", { skill: "parenting.null" });
  assert.deepEqual(h.adapter().sent[2], { text: "Yes, go deeper on Move a group.", kind: "go_deeper" });
}));

test("T035 item 4: the dock holds the new question's steps", async () => {
  const h = await followedUp(NULL_ANSWER);
  assert.ok(text(h).includes(A.your_steps(1)));
  assert.deepEqual(h.app.model().thread.latest_steps.map((x) => x.text), ["Parent the letters to a null."]);
});

test("T035 item 5: a malformed answer falls back to the words with the steps' text, and no Steps, dock or Go deeper", () => withGoDeeper(async () => {
  const bad = JSON.parse(JSON.stringify(COMP1));
  bad.offered_skills = ["transform.anchor", "parenting.null", "timing.offset"]; // 3 offers: no view
  const h = await answered(bad);
  const t = text(h);
  for (const s of COMP1.steps) assert.ok(t.includes(s.text), `step text shown: ${s.text}`);
  assert.ok(t.includes("rock.png rides on Shake Control"));
  assert.ok(t.includes("Try them, or want to go deeper"));
  assert.doesNotMatch(screen(h).html, /class="steps-lbl"|stepsblock|class="check steps"|data-action="go_deeper"|<ol/);
  assert.equal(h.app.model().thread.latest_steps, null, "no dock");
}));
