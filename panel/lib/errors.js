// Error kinds → treatment and words (spec 007 FR-056; replaces errors-a.js). Fixed text chosen by
// kind only: nothing from an adapter's message is ever shown (FR-058). Works for both runtimes.
"use strict";

const { COPY } = require("./copy.js");

const E = COPY.errors;

// Never shown. Listed by name ahead of the fallback, so one bad stream line can't block a lesson.
const LOGGED_ONLY = Object.freeze(["bad_stream", "busy", "bad_command", "not_implemented"]);

const TREATMENTS = Object.freeze({
  start_failed: { treatment: "blocking", state: "err-mentor", copy: E.start_failed, blocks_home: true, try_again: true },
  not_signed_in: { treatment: "blocking", state: "err-key", copy: E.not_signed_in, blocks_home: true, try_again: true },
  out_of_credit: { treatment: "blocking", state: "err-credit", copy: E.out_of_credit, blocks_home: true, try_again: true },
  rate_limited: { treatment: "passing", state: "lesson-pass-rate", copy: E.rate_limited, blocks_home: false, try_again: true },
  service_busy: { treatment: "passing", state: "lesson-pass-busy", copy: E.service_busy, blocks_home: false, try_again: true },
  offline: { treatment: "passing", state: "lesson-pass-offline", copy: E.offline, blocks_home: false, try_again: true },
  refused: { treatment: "passing", state: "lesson-pass-refused", copy: E.refused, blocks_home: false, try_again: false },
  timeout: { treatment: "cut_off", state: "lesson-error", copy: E.timeout, blocks_home: false, try_again: true },
  process_exited: { treatment: "ended", state: "lesson-exited", copy: E.process_exited, blocks_home: false, try_again: false },
});

const known = (kind) => (Object.prototype.hasOwnProperty.call(TREATMENTS, kind) ? TREATMENTS[kind] : TREATMENTS.start_failed);

function bodyOf(t) {
  return t.copy.tail ? `${t.copy.body} ${t.copy.tail}` : t.copy.body;
}

// The words for a passing kind on a lesson's first turn: its own instruction, then "no lesson
// started". Refused's instruction is about a lesson that doesn't exist yet, so it's left out.
function startFailedBody(kind, t) {
  return kind === "refused" ? E.not_started : `${t.copy.body} ${E.not_started}`;
}

// opts: { runtime: "a" | "b1", firstTurn }. → { kind, treatment, state, title, body, blocks_home, try_again }.
function treatError(kind, opts) {
  const { runtime, firstTurn } = opts || {};
  if (LOGGED_ONLY.includes(kind)) return { kind, treatment: "logged", state: null, title: null, body: null, blocks_home: false, try_again: false };
  // On B1, not_signed_in means Claude Code's sign-in, not an access key.
  const t = kind === "not_signed_in" && runtime !== "a" ? TREATMENTS.start_failed : known(kind);
  const out = { kind, treatment: t.treatment, state: t.state, title: t.copy.title, body: bodyOf(t), blocks_home: t.blocks_home, try_again: t.try_again };
  if (firstTurn && t.treatment === "passing") return Object.assign(out, { state: "lesson-start-failed", body: startFailedBody(kind, t) });
  return out;
}

// One line of text for a notice, or null for a kind that's never shown.
function noticeText(kind) {
  if (LOGGED_ONLY.includes(kind)) return null;
  const t = known(kind);
  return `${t.copy.title} ${bodyOf(t)}`;
}

// What may go in the panel's log for an error event: the kind and a length, never the text (FR-068).
function logEntry(ev) {
  const length = typeof ev.length === "number" ? ev.length : String(ev.message || "").length;
  return { kind: ev.kind, length };
}

module.exports = { treatError, noticeText, logEntry, LOGGED_ONLY };
