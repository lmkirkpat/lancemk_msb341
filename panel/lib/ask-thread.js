// The ask thread (spec 014 data-model § 7, MU › Asking, research R12): what one conversation about
// the open comp holds. Pure and immutable: app.js keeps the current thread, screens.js draws it and
// panel-session.js saves it. Nothing here decides what to teach; it only keeps the learner's
// questions, each answer's view (from give_answer's data, ask-result.js) and the latest steps.
"use strict";

const { KINDS } = require("./ask-result.js");

const VERSION = 1;
const READING_LONG_MS = 6000; // MU ask-reading-long: "Still reading the open comp…" after about 6 s
// lesson_back (spec 014 phase 2, MU ask-back and ask-ended): the return from a go-deeper lesson. Its
// `text` is the divider (panel words), `hand_back` the panel's hand-back line from the record's data,
// and `prose` the mentor's reply when End lesson sent one. It draws no learner bubble.
const ENTRY_KINDS = ["question", "followup", "go_deeper", "lesson_back"];
const DEEPER_STATES = ["starting", "open", "passed", "ended"];

function newThread({ id, claude_session_id, at } = {}) {
  return { version: VERSION, id: id || null, claude_session_id: claude_session_id || null, started_at: at || null, questions: [], latest_steps: null, deeper: null, steps_open_once: false, after_lesson: false, after_deeper: false };
}

// ---------- Go deeper (spec 014 FR-050 to FR-052, data-model § 7) ----------
// deeper: null | { skill, tag, step_number, state, layer, practice, passed, saved, hand_back }. One at a
// time. passed and saved follow the lesson while it's open, so a panel closed before the return still
// knows what to draw when it reopens (fromSaved, settleOnRead).

// The press (or a typed yes the mentor took): starting, until the lesson takes over or the turn ends.
function pressDeeper(th, { skill, tag }) {
  return Object.assign({}, th, { deeper: { skill: skill || null, tag: tag || null, step_number: null, state: "starting", layer: null, practice: false, passed: false, saved: false, hand_back: null } });
}

// The mentor's go_deeper went through: the lesson is open, in the same conversation. The press's entry
// has its answer (the lesson), so it isn't a question with nothing under it.
function openDeeper(th, { skill, tag, practice }) {
  const d = Object.assign({}, th.deeper || {}, { skill: skill || (th.deeper && th.deeper.skill) || null, tag: tag || (th.deeper && th.deeper.tag) || null, state: "open", practice: practice === true });
  const q = latest(th);
  const next = q && !q.answered ? withLatest(th, { answered: true, notice: null }) : th;
  return Object.assign({}, next, { deeper: Object.assign({ step_number: null, layer: null, passed: false, saved: false, hand_back: null }, d) });
}

// The lesson's hand-in snapshot named the layer and the step (data-model § 4).
function deeperHandIn(th, { layer, step_number }) {
  if (!th.deeper) return th;
  return Object.assign({}, th, { deeper: Object.assign({}, th.deeper, { layer: typeof layer === "string" && layer ? layer : th.deeper.layer, step_number: Number.isInteger(step_number) ? step_number : th.deeper.step_number }) });
}

// The press didn't become a lesson (a refusal, or the mentor stopped at the offer): no lesson to go
// back to, and the answer's Go deeper stays as it was.
const dropDeeper = (th) => (th && th.deeper && th.deeper.state === "starting" ? Object.assign({}, th, { deeper: null }) : th);

const deeperOpen = (th) => !!th && !!th.deeper && (th.deeper.state === "open" || th.deeper.state === "starting");

// The hand-back line (contracts/panel-ask.md): "That was step n; next is step n+1: …" or "That was the
// last step.", from record_lesson's or end_lesson's hand_back. Null with none (a how-to has no step).
function handBackLine(hb, copy) {
  if (!hb || typeof hb !== "object" || !Number.isInteger(hb.step_number)) return null;
  return typeof hb.next_step === "string" && hb.next_step.trim() ? copy.hand_back(hb.step_number, hb.next_step) : copy.last_step;
}

// Back from the lesson (MU ask-back, ask-ended): everything before folds ("Your question and its
// answer"), so Go deeper is gone from its answer (FR-050); a lesson_back entry draws the divider and
// the hand-back line. `answered: false` when End lesson sends the thread a turn for its reply. The
// next follow-up switches the conversation back to the ask skill (after_deeper).
function backFromDeeper(th, { divider, hand_back, saved, answered, at }) {
  const before = th.questions.map((q) => (q.folded ? q : Object.assign({}, q, { folded: true })));
  const entry = { text: String(divider || ""), kind: "lesson_back", at: at || null, view: null, prose: null, folded: false, answered: answered !== false, notice: null, hand_back: hand_back || null };
  const deeper = th.deeper ? Object.assign({}, th.deeper, { state: saved ? "passed" : "ended", saved: !!saved }) : null;
  return Object.assign({}, th, { questions: before.concat(entry), deeper, after_deeper: true, steps_open_once: true });
}

// The lesson's own result, kept on the thread as it happens (data-model § 7).
function deeperResult(th, { passed, saved }) {
  if (!th || !th.deeper) return th;
  const p = passed === true;
  const sv = saved === true;
  return th.deeper.passed === p && th.deeper.saved === sv ? th : Object.assign({}, th, { deeper: Object.assign({}, th.deeper, { passed: p, saved: sv }) });
}

const setAfterDeeper = (th, on) => (th && th.after_deeper !== on ? Object.assign({}, th, { after_deeper: on }) : th);

// after_lesson (amendment (e)): a lesson ended the thread's conversation and no turn has gone through
// since, so the next follow-up or Try again carries the context (contracts/panel-ask.md › Context after
// a lesson). Set by the lesson's start; cleared by the first turn that ends without a notice.
const setAfterLesson = (th, on) => (th && th.after_lesson !== on ? Object.assign({}, th, { after_lesson: on }) : th);

// The entry the context is built from: the latest one with an answer on screen (a view, or the
// mentor's words), skipping entries with nothing under them and the entry being sent (`before`).
// Its view may be null (FR-048's fallback); contextRequest then sends the prefix and text only.
function contextEntry(th, before) {
  const qs = th ? th.questions.slice(0, before === undefined ? th.questions.length : before) : [];
  // A lesson's return isn't a question and answer: the context skips it (amendment (e) sends the last
  // question the learner asked and what was shown under it).
  for (let i = qs.length - 1; i >= 0; i--) if (qs[i].kind !== "lesson_back" && (qs[i].view || qs[i].prose)) return qs[i];
  return null;
}

const latest = (th) => (th && th.questions.length ? th.questions[th.questions.length - 1] : null);

function withLatest(th, patch) {
  const qs = th.questions.slice();
  qs[qs.length - 1] = Object.assign({}, qs[qs.length - 1], patch);
  return Object.assign({}, th, { questions: qs });
}

// A new question folds every entry before it ("Earlier questions (n)"); a follow-up or a Go deeper
// press stays in view with the answer it follows (MU ask-followup, ask-new-question).
function addQuestion(th, { text, kind, at }) {
  const k = ENTRY_KINDS.includes(kind) ? kind : "question";
  const before = k === "question" ? th.questions.map((q) => (q.folded ? q : Object.assign({}, q, { folded: true }))) : th.questions.slice();
  const entry = { text: String(text || ""), kind: k, at: at || null, view: null, prose: null, folded: false, answered: false, notice: null };
  return Object.assign({}, th, { questions: before.concat(entry) });
}

// The kinds of give_answer result that make a follow-up a new question (contracts/panel-ask.md ›
// Requests, amended 2026-11-16 (d); FR-031's note). From the tool's data only, never the prose.
const NEW_QUESTION_KINDS = ["answer", "describe", "howto"];

// A follow-up the mentor answered as a new question: it becomes one, and folds what came before it,
// as a question from Home would. Anything else is left as it is.
function asNewQuestion(th) {
  const q = latest(th);
  if (!q || q.kind !== "followup") return th;
  const qs = th.questions.map((e, i) => (i === th.questions.length - 1 ? Object.assign({}, e, { kind: "question" }) : e.folded ? e : Object.assign({}, e, { folded: true })));
  return Object.assign({}, th, { questions: qs });
}

// The turn ended. view: the AskView or null. had_result: whether a give_answer result came at all.
// A result (valid or not) settles the dock: its steps, or none (FR-048 fails closed). A turn with no
// result is an ordinary prose turn: after a follow-up the dock stays (MU ask-followup); after a new
// question it's a missing result, so the dock goes.
function answer(th, { view, prose, had_result }) {
  const q = latest(th);
  if (!q) return th;
  const next = withLatest(th, { view: view || null, prose: prose || null, answered: true });
  let steps = th.latest_steps;
  if (had_result) steps = view && view.steps.length ? view.steps : null;
  else if (q.kind === "question") steps = null;
  return Object.assign(next, { latest_steps: steps });
}

// A passing error on the latest entry (MU › States still missing: "Your question's still here.").
function notice(th, n) {
  return latest(th) ? withLatest(th, { notice: { title: n.title || null, text: n.text || "" } }) : th;
}

// Try again resends the latest entry: same bubble, no answer yet.
function retry(th) {
  return latest(th) ? withLatest(th, { notice: null, answered: false, view: null, prose: null }) : th;
}

// → { earlier, earlier_count, current }: the folded entries (and how many questions they hold) and
// the ones in view.
function split(th) {
  const earlier = th.questions.filter((q) => q.folded);
  return { earlier, earlier_count: earlier.filter((q) => q.kind === "question").length, current: th.questions.filter((q) => !q.folded) };
}

// Go deeper lives inside its own answer (FR-050): an answer folded away draws none.
function offersOf(th, entry) {
  return entry && !entry.folded && entry.view ? entry.view.offers : [];
}

const readingLong = (sentAtMs, nowMs) => typeof sentAtMs === "number" && nowMs - sentAtMs >= READING_LONG_MS;

// ---------- reading a saved thread back (panel-session.js version 3) ----------

const isStr = (v) => typeof v === "string";
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

function cleanStep(s) {
  return isObj(s) && typeof s.number === "number" && isStr(s.text) ? { number: s.number, text: s.text, tag: isStr(s.tag) ? s.tag : null, not_taught: s.not_taught === true, layer: isStr(s.layer) ? s.layer : null } : null;
}

function cleanView(v) {
  if (!isObj(v) || !KINDS.includes(v.kind) || !isStr(v.explanation) || !Array.isArray(v.steps) || !Array.isArray(v.offers)) return null;
  const steps = v.steps.map(cleanStep);
  if (steps.some((s) => !s)) return null;
  const offers = v.offers.filter((o) => isObj(o) && isStr(o.skill) && isStr(o.tag)).map((o) => ({ skill: o.skill, tag: o.tag }));
  return { kind: v.kind, explanation: v.explanation, steps, offers, closing_offer: isStr(v.closing_offer) ? v.closing_offer : null };
}

function cleanHandBack(hb) {
  return isObj(hb) && Number.isInteger(hb.step_number) ? { step_number: hb.step_number, next_step: isStr(hb.next_step) ? hb.next_step : null } : null;
}

function cleanDeeper(d) {
  if (!isObj(d) || !DEEPER_STATES.includes(d.state)) return null;
  return { skill: isStr(d.skill) ? d.skill : null, tag: isStr(d.tag) ? d.tag : null, step_number: Number.isInteger(d.step_number) ? d.step_number : null, state: d.state, layer: isStr(d.layer) ? d.layer : null, practice: d.practice === true, passed: d.passed === true, saved: d.saved === true, hand_back: cleanHandBack(d.hand_back) };
}

function cleanEntry(q) {
  if (!isObj(q) || !isStr(q.text) || !ENTRY_KINDS.includes(q.kind)) return null;
  const n = isObj(q.notice) ? { title: isStr(q.notice.title) ? q.notice.title : null, text: isStr(q.notice.text) ? q.notice.text : "" } : null;
  const e = { text: q.text, kind: q.kind, at: isStr(q.at) ? q.at : null, view: cleanView(q.view), prose: isStr(q.prose) ? q.prose : null, folded: q.folded === true, answered: q.answered === true, notice: n };
  if (q.kind === "lesson_back") e.hand_back = isStr(q.hand_back) ? q.hand_back : null;
  return e;
}

// A saved thread, or null when it isn't one.
function fromSaved(s) {
  if (!isObj(s) || s.version !== VERSION || !isStr(s.id) || !Array.isArray(s.questions)) return null;
  const steps = Array.isArray(s.latest_steps) ? s.latest_steps.map(cleanStep) : null;
  return {
    version: VERSION,
    id: s.id,
    claude_session_id: isStr(s.claude_session_id) ? s.claude_session_id : null,
    started_at: isStr(s.started_at) ? s.started_at : null,
    questions: s.questions.map(cleanEntry).filter(Boolean),
    latest_steps: steps && steps.length && steps.every(Boolean) ? steps : null,
    // A go-deeper lesson doesn't outlive the panel: one still open when it closed is settled by the
    // app as it reads the thread back (settleOnRead), so its answer folds and Go deeper is gone
    // (FR-050). Its conversation was the thread's, still on the lesson's skill, so the next follow-up
    // goes with the ask command in front (after_deeper).
    deeper: cleanDeeper(s.deeper),
    steps_open_once: s.steps_open_once === true,
    after_lesson: s.after_lesson === true,
    after_deeper: s.after_deeper === true || (isObj(s.deeper) && (s.deeper.state === "open" || s.deeper.state === "starting")),
  };
}

// A thread read back with its go-deeper lesson still open (or still starting) when the panel closed:
// the lesson is over, so the thread gets its return now, as it would have on the way back (MU ask-back,
// ask-ended). `divider` is the caller's (it knows the skill's name); the hand-back line comes from the
// saved hand_back. Anything else is left as it is.
function settleOnRead(th, { divider, copy, at }) {
  if (!deeperOpen(th)) return th;
  const d = th.deeper;
  return backFromDeeper(th, { divider, hand_back: handBackLine(d.hand_back, copy), saved: d.saved === true, at });
}

module.exports = { newThread, setAfterLesson, contextEntry, pressDeeper, openDeeper, deeperHandIn, dropDeeper, deeperOpen, deeperResult, settleOnRead, handBackLine, backFromDeeper, setAfterDeeper, DEEPER_STATES, addQuestion, asNewQuestion, NEW_QUESTION_KINDS, answer, notice, retry, latest, split, offersOf, readingLong, fromSaved, READING_LONG_MS, VERSION };
