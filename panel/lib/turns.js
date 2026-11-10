// Turn log (data-model › Turn log, research R9): one JSON line per turn in panel-turns.jsonl, for
// SC-004, SC-005 and cost. No message text, ever. Never throws: logging must not break a lesson.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const KINDS = ["start", "new_lesson", "warm_up", "find_next", "yes", "check", "hint", "show_me", "show_me_again", "ask", "continue"];
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
// Model ids, effort levels and hashes: short tokens only, so no message text can ride in (FR-029).
const id = (v) => (typeof v === "string" && /^[A-Za-z0-9._:-]{1,80}$/.test(v) ? v : null);
const errorKind = (v) => (v === null || v === undefined ? null : typeof v === "string" && /^[a-z_]{1,40}$/.test(v) ? v : "other");
const tokens = (t) => (t && typeof t === "object" ? { input: num(t.input), cache_write: num(t.cache_write), cache_read: num(t.cache_read), output: num(t.output) } : null);

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
      runtime: entry.runtime === "a" ? "a" : "b1", // B1 lines get this field only (data-model › Turn log)
    };
    if (line.runtime === "a") {
      line.model = id(entry.model);
      line.effort = id(entry.effort);
      line.settings_hash = id(entry.settings_hash);
      line.tokens = tokens(entry.tokens);
      line.other_model = entry.other_model === true;
      line.error_kind = errorKind(entry.error_kind);
      if (num(entry.start_ms) !== null) line.start_ms = entry.start_ms; // a lesson's first turn only
    }
    fs.mkdirSync(home, { recursive: true });
    fs.appendFileSync(path.join(home, "panel-turns.jsonl"), JSON.stringify(line) + "\n");
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { appendTurn, KINDS };
