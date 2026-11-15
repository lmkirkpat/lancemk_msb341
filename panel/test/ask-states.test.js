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
  "ask-answer": [() => answered(), ["In Comp 1, rock.png rides on Shake Control", A.steps, "Set the pivot", A.go_deeper("Set the pivot"), A.your_steps(4), A.steps_note, "Try them, or want to go deeper"], ["/ask-mentor", "✓"]],
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
  "home-nocomp": [() => panel({ connection: { state: "connected", started: CONNECTED.started, comp_active: false } }), [A.no_comp, A.needs_comp], []],
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

test("FR-048: explanation, then Steps and the numbered list, then the closing offer, then Go deeper; tags in bold italics", async () => {
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

const MALFORMED = {
  "missing (no give_answer)": null,
  "five steps": Object.assign({}, COMP1, { steps: COMP1.steps.concat([{ text: "More.", skill: null, layer: null }]) }),
  "an unknown kind": Object.assign({}, COMP1, { kind: "essay" }),
  "an offer no step uses": Object.assign({}, COMP1, { offered_skills: ["parenting.null"], tags: { "transform.anchor": "Set the pivot", "parenting.null": "Group with a null" } }),
};
for (const [what, json] of Object.entries(MALFORMED)) {
  test(`FR-048 fail closed in the thread: ${what} → the mentor's words, no Steps, no dock, no Go deeper`, async () => {
    const h = await panel();
    askFromHome(h);
    const a = h.adapter();
    a.emit("text", { text: "In Comp 1, rock.png rides on Shake Control.\n1. Open the expression." });
    if (json) a.emit("tool_result", GIVE(json));
    a.emit("turn_end", { ok: true, kind: "question" });
    const { html, r } = screen(h);
    assert.ok(plain(html).includes("In Comp 1, rock.png rides on Shake Control."), "the words as they came");
    assert.equal(r.lesson.list, "", "no dock");
    assert.doesNotMatch(html, /steps-lbl|deeper-btn|Go deeper/);
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

test("a new question from Home joins the same conversation; earlier answers fold and lose their Go deeper", async () => {
  const h = await answered();
  h.app.act("thread_back");
  askFromHome(h, "What does the sweep control layer do?");
  assert.equal(h.adapters.length, 1, "same conversation (TD § 6 turn 7)");
  assert.equal(h.adapter().sent[1].text, "/ask-mentor What does the sweep control layer do?");
  answer(h, DESCRIBE);
  const items = screen(h).r.lesson.chat.items.join("");
  assert.doesNotMatch(items, /Go deeper/, "Go deeper stays inside its own answer, folded away (FR-050)");
  assert.equal(screen(h).r.lesson.list, "", "the dock goes away with a describe answer");
});

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

test("Go deeper sends MU's sentence once, shows Starting…, and pauses the bar", async () => {
  const h = await answered();
  h.app.act("go_deeper", { skill: "transform.anchor" });
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.deepEqual(h.adapter().sent.slice(1), [{ text: "Yes, go deeper on Set the pivot.", kind: "go_deeper" }]);
  const t = text(h);
  assert.ok(t.includes("Yes, go deeper on Set the pivot."));
  assert.ok(t.includes(COPY.buttons.pressed.start));
  assert.ok(t.includes(COPY.status.lesson_ready));
  assert.equal(h.app.followUp("hello?"), false);
});

test("Go deeper only for an offer the answer made", async () => {
  const h = await answered();
  h.app.act("go_deeper", { skill: "parenting.null" });
  assert.equal(h.adapter().sent.length, 1);
});

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

test("a lesson from Skills or Find my next lesson ends the thread (research R12)", async () => {
  const h = await answered();
  h.app.act("thread_back");
  assert.ok(h.saved.thread, "saved");
  h.app.act("find_next");
  assert.equal(h.saved.thread, null);
  assert.equal(h.adapters[0].stopped, 1, "the thread's conversation stops");
  h.app.act("go_home");
  assert.notEqual(st(h), "home-thread");
});

test("asking with a lesson waiting keeps that lesson; picking it up ends the thread", async () => {
  const SAVED = { version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "x", updated_at: "x", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 2 yours eased", sections: [], outside: [], stale: null, stale_kind: null, checked_at: null } }, messages: [] };
  const h = await answered(COMP1, { saved: SAVED });
  h.app.act("thread_back");
  assert.equal(st(h), "home-inprogress");
  assert.ok(text(h).includes(A.back_to_question), "both the line and the way back");
  h.app.act("continue");
  assert.equal(h.saved.thread, null);
  assert.equal(h.app.model().tab, "lesson");
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
