// What the panel shows for each option A error kind (spec 013 FR-027,
// contracts/helper-protocol.md › Error kinds), until spec 007's err-mentor and setup screens
// replace it. Fixed text chosen by kind only: no status code, path, tool name or key, and nothing
// from the helper's message is appended. B1's messages stay in main.js, unchanged.
"use strict";

const MESSAGES_A = Object.freeze({
  not_signed_in: "The mentor can't start: its access key is missing or isn't working. Check setup, then start the lesson again.",
  out_of_credit: "The mentor's access key has run out of credit or hit its spending limit. Check setup or top it up, then try again.",
  rate_limited: "The mentor is getting too many requests right now. Wait a minute, then try again.",
  service_busy: "The mentor's service is busy right now. Try again in a moment.",
  offline: "The mentor can't reach the internet. Check your connection, then try again.",
  refused: "The mentor couldn't answer that. Try rephrasing.",
  timeout: "The mentor took more than 5 minutes to answer, so the panel stopped waiting. Try again.",
  start_failed: "The mentor couldn't start. Close and reopen the panel; if it happens again, check setup.",
  process_exited: "The mentor stopped unexpectedly. Start the lesson again.",
});

// Never shown to a learner (the adapter logs them).
const NOT_SHOWN = Object.freeze(["busy", "bad_command", "not_implemented"]);

// → the text to show, or null for a kind that's never shown. A kind this table doesn't know gets
// start_failed's text (reopen, check setup), never the raw kind or message.
function messageForA(kind) {
  if (NOT_SHOWN.includes(kind)) return null;
  return Object.prototype.hasOwnProperty.call(MESSAGES_A, kind) ? MESSAGES_A[kind] : MESSAGES_A.start_failed;
}

module.exports = { MESSAGES_A, NOT_SHOWN, messageForA };
