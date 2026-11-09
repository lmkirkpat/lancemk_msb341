// Spec 007 T006, FR-056: every error kind → its treatment and the mockup's words, from recorded
// streams. A's kinds come from a recorded helper stream (decisions/011); B1's from Claude Code's.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { treatError, noticeText, logEntry, LOGGED_ONLY } = require("../lib/errors.js");
const { createStreamParser } = require("../lib/stream.js");
const { COPY } = require("../lib/copy.js");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
const events = (text) => { const out = []; const p = createStreamParser((e) => out.push(e)); p.push(text); p.end(); return out; };
const helperErrors = fixture("stream-errors-a.jsonl").trim().split("\n").map((l) => JSON.parse(l));

const EXPECTED = {
  start_failed: ["blocking", "err-mentor"],
  not_signed_in: ["blocking", "err-key"],
  out_of_credit: ["blocking", "err-credit"],
  rate_limited: ["passing", "lesson-pass-rate"],
  service_busy: ["passing", "lesson-pass-busy"],
  offline: ["passing", "lesson-pass-offline"],
  refused: ["passing", "lesson-pass-refused"],
  timeout: ["cut_off", "lesson-error"],
  process_exited: ["ended", "lesson-exited"],
};

test("every kind in the recorded stream gets its treatment and state on A", () => {
  const seen = new Set();
  for (const e of helperErrors) {
    seen.add(e.kind);
    const t = treatError(e.kind, { runtime: "a" });
    if (LOGGED_ONLY.includes(e.kind)) { assert.equal(t.treatment, "logged", e.kind); continue; }
    assert.deepEqual([t.treatment, t.state], EXPECTED[e.kind], e.kind);
  }
  // bad_stream is B1's only (one bad stream line, tested below).
  assert.deepEqual([...seen].sort(), [...Object.keys(EXPECTED), ...LOGGED_ONLY.filter((k) => k !== "bad_stream")].sort());
});

test("nothing from the helper's message reaches the learner", () => {
  for (const e of helperErrors) {
    const t = treatError(e.kind, { runtime: "a" });
    assert.equal(JSON.stringify(t).includes(e.message) && e.message !== "", false, e.kind);
  }
});

test("blocking errors say Needs the mentor on Home; passing ones leave Home alone", () => {
  for (const k of ["start_failed", "not_signed_in", "out_of_credit"]) assert.equal(treatError(k, { runtime: "a" }).blocks_home, true, k);
  for (const k of ["rate_limited", "service_busy", "offline", "refused", "timeout", "process_exited"]) assert.equal(treatError(k, { runtime: "a" }).blocks_home, false, k);
});

test("refused offers no Try again; the other passing kinds do", () => {
  assert.equal(treatError("refused", { runtime: "a" }).try_again, false);
  for (const k of ["rate_limited", "service_busy", "offline", "timeout"]) assert.equal(treatError(k, { runtime: "a" }).try_again, true, k);
});

test("the mockup's words, by kind", () => {
  assert.equal(noticeText("rate_limited"), "Too many requests right now. Wait a minute, then try again. Your lesson is still open.");
  assert.equal(noticeText("service_busy"), "The mentor's service is busy. Try again in a moment. Your lesson is still open.");
  assert.equal(noticeText("offline"), "Can't reach the internet. Check your connection, then try again. Your lesson is still open.");
  assert.equal(noticeText("refused"), "The mentor couldn't answer that. Try rewording it, or continue with your check.");
  assert.equal(noticeText("timeout"), "The mentor took too long to respond. Your lesson and checklist are still open.");
  assert.equal(noticeText("process_exited"), "The mentor stopped unexpectedly, so this lesson ended and wasn't saved. Your changes in the comp are still there.");
});

test("on a lesson's first turn, a passing kind is lesson-start-failed and says no lesson started", () => {
  for (const k of ["rate_limited", "service_busy", "offline", "refused"]) {
    const t = treatError(k, { runtime: "a", firstTurn: true });
    assert.equal(t.state, "lesson-start-failed", k);
    assert.equal(t.treatment, "passing", k);
    assert.ok(t.body.endsWith(COPY.errors.not_started), k);
    assert.doesNotMatch(t.body, /still open|continue with your check/, k);
  }
  assert.equal(treatError("service_busy", { runtime: "a", firstTurn: true }).body, "Try again in a moment. No lesson started, and your comp wasn't changed.");
  assert.equal(treatError("timeout", { runtime: "a", firstTurn: true }).state, "lesson-error");
  assert.equal(treatError("start_failed", { runtime: "a", firstTurn: true }).state, "err-mentor");
});

test("on B1, not_signed_in is err-mentor: it's Claude Code's sign-in, not an access key", () => {
  const stream = '{"type":"result","is_error":true,"result":"Not logged in. Please run /login","session_id":"x"}\n';
  const err = events(stream).find((e) => e.type === "error");
  assert.equal(err.kind, "not_signed_in");
  const t = treatError(err.kind, { runtime: "b1" });
  assert.equal(t.state, "err-mentor");
  assert.equal(t.title, COPY.errors.start_failed.title);
  assert.doesNotMatch(JSON.stringify(t), /access key|login/i);
});

test("logged-only kinds are named ahead of the fallback, never shown, and never block", () => {
  assert.deepEqual([...LOGGED_ONLY].sort(), ["bad_command", "bad_stream", "busy", "not_implemented"]);
  for (const k of LOGGED_ONLY) {
    const t = treatError(k, { runtime: "b1" });
    assert.equal(t.treatment, "logged", k);
    assert.equal(t.state, null, k);
    assert.equal(t.blocks_home, false, k);
    assert.equal(noticeText(k), null, k);
  }
});

test("an unknown kind falls back to start_failed, never the raw kind or an inherited name", () => {
  for (const k of ["something_new", undefined, "toString", "__proto__"]) {
    const t = treatError(k, { runtime: "a" });
    assert.equal(t.state, "err-mentor", String(k));
    assert.equal(noticeText(k), noticeText("start_failed"), String(k));
  }
});

test("one bad stream line leaves the lesson running: logged only, and the rest of the stream still arrives", () => {
  const clean = fixture("stream-check.jsonl");
  const lines = clean.trim().split("\n");
  lines.splice(3, 0, "{ this line was cut in half");
  const withBad = events(lines.join("\n") + "\n");
  const bad = withBad.filter((e) => e.type === "error");
  assert.deepEqual(bad.map((e) => e.kind), ["bad_stream"]);
  assert.equal(treatError("bad_stream", { runtime: "b1" }).treatment, "logged");
  const names = (list) => list.filter((e) => e.type === "tool_result").map((e) => e.name);
  assert.deepEqual(names(withBad), names(events(clean)));
  assert.equal(withBad.filter((e) => e.type === "turn_end").length, 1);
});

test("the log entry is a kind and a length, never the text", () => {
  const entry = logEntry({ kind: "bad_stream", message: "A Name <a.name@example.com>", length: 27 });
  assert.deepEqual(entry, { kind: "bad_stream", length: 27 });
  assert.deepEqual(logEntry({ kind: "not_signed_in", message: "Not logged in" }), { kind: "not_signed_in", length: 13 });
});
