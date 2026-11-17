// The ask thread (spec 014 data-model § 7, MU › Asking, research R12): what one conversation about
// the open comp holds. Pure and immutable: app.js keeps the current thread, screens.js draws it and
// panel-session.js saves it. Nothing here decides what to teach; it only keeps the learner's
// questions, each answer's view (from give_answer's data, ask-result.js) and the latest steps.
"use strict";

const { KINDS } = require("./ask-result.js");

const VERSION = 1;
const READING_LONG_MS = 6000; // MU ask-reading-long: "Still reading the open comp…" after about 6 s
const ENTRY_KINDS = ["question", "followup", "go_deeper"];

function newThread({ id, claude_session_id, at } = {}) {
  return { version: VERSION, id: id || null, claude_session_id: claude_session_id || null, started_at: at || null, questions: [], latest_steps: null, deeper: null, steps_open_once: false, after_lesson: false };
}

// after_lesson (amendment (e)): a lesson ended the thread's conversation and no turn has gone through
// since, so the next follow-up or Try again carries the context (contracts/panel-ask.md › Context after
// a lesson). Set by the lesson's start; cleared by the first turn that ends without a notice.
const setAfterLesson = (th, on) => (th && th.after_lesson !== on ? Object.assign({}, th, { after_lesson: on }) : th);

// The entry the context is built from: the latest one with an answer on screen (a view, or the
// mentor's words), skipping entries with nothing under them and the entry being sent (`before`).
// Its view may be null (FR-048's fallback); contextRequest then sends the prefix and text only.
function contextEntry(th, before) {
  const qs = th ? th.questions.slice(0, before === undefined ? th.questions.length : before) : [];
  for (let i = qs.length - 1; i >= 0; i--) if (qs[i].view || qs[i].prose) return qs[i];
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

function cleanEntry(q) {
  if (!isObj(q) || !isStr(q.text) || !ENTRY_KINDS.includes(q.kind)) return null;
  const n = isObj(q.notice) ? { title: isStr(q.notice.title) ? q.notice.title : null, text: isStr(q.notice.text) ? q.notice.text : "" } : null;
  return { text: q.text, kind: q.kind, at: isStr(q.at) ? q.at : null, view: cleanView(q.view), prose: isStr(q.prose) ? q.prose : null, folded: q.folded === true, answered: q.answered === true, notice: n };
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
    deeper: null, // a go-deeper lesson doesn't outlive the panel in this phase (phase 2 owns it)
    steps_open_once: s.steps_open_once === true,
    after_lesson: s.after_lesson === true,
  };
}

module.exports = { newThread, setAfterLesson, contextEntry, addQuestion, asNewQuestion, NEW_QUESTION_KINDS, answer, notice, retry, latest, split, offersOf, readingLong, fromSaved, READING_LONG_MS, VERSION };
