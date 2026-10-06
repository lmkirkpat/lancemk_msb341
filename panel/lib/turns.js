// Turn log (data-model › Turn log, research R9): one JSON line per turn in panel-turns.jsonl, for
// SC-004, SC-005 and cost. No message text, ever. Never throws: logging must not break a lesson.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const KINDS = ["start", "check", "hint", "show_me", "show_me_again", "ask", "continue"];
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);

function appendTurn(opts, entry) {
  try {
    const fs = (opts && opts.fs) || nodeFs;
    const home = (opts && opts.home) || defaultHome();
    const line = {
      at: entry.at || new Date().toISOString(),
      kind: KINDS.includes(entry.kind) ? entry.kind : "ask",
      wait_ms: num(entry.wait_ms),
      first_event_ms: num(entry.first_event_ms),
      total_ms: num(entry.total_ms),
      cost_usd: num(entry.cost_usd),
      ok: entry.ok === true,
      lesson_passed: entry.lesson_passed === true,
    };
    fs.mkdirSync(home, { recursive: true });
    fs.appendFileSync(path.join(home, "panel-turns.jsonl"), JSON.stringify(line) + "\n");
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { appendTurn, KINDS };
