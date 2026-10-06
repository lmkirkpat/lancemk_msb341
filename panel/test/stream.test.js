"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { createStreamParser } = require("../lib/stream.js");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

function parseAll(text, chunkSize) {
  const events = [];
  const p = createStreamParser((e) => events.push(e));
  if (chunkSize) for (let i = 0; i < text.length; i += chunkSize) p.push(text.slice(i, i + chunkSize));
  else p.push(text);
  p.end();
  return events;
}

const names = (events, type) => events.filter((e) => e.type === type).map((e) => e.name);

test("opening: mentor tools only, text deltas, one turn_end with cost", () => {
  const ev = parseAll(fixture("stream-opening.jsonl"));
  assert.deepEqual(names(ev, "tool_call"), ["read_learner_record", "snapshot_project"]); // ToolSearch ignored
  assert.deepEqual(names(ev, "tool_result"), ["read_learner_record", "snapshot_project"]);
  assert.ok(ev.filter((e) => e.type === "text_delta").length > 10);
  const ends = ev.filter((e) => e.type === "turn_end");
  assert.equal(ends.length, 1);
  assert.equal(ends[0].ok, true);
  assert.equal(typeof ends[0].cost_total_usd, "number");
  assert.equal(ev.filter((e) => e.type === "error").length, 0);
});

test("the full text block matches the joined deltas", () => {
  const ev = parseAll(fixture("stream-check.jsonl"));
  const deltas = ev.filter((e) => e.type === "text_delta").map((e) => e.text).join("");
  const texts = ev.filter((e) => e.type === "text").map((e) => e.text);
  assert.equal(texts.length, 1);
  assert.equal(texts[0], deltas);
});

test("snapshot result is parsed as JSON", () => {
  const ev = parseAll(fixture("stream-opening.jsonl"));
  const snap = ev.find((e) => e.type === "tool_result" && e.name === "snapshot_project");
  assert.ok(snap.json && Array.isArray(snap.json.findings));
});

test("show me: a frame arrives as an image, and set_ease succeeds", () => {
  const ev = parseAll(fixture("stream-show-me.jsonl"));
  const frame = ev.find((e) => e.type === "tool_result" && e.name === "preview_frame");
  assert.equal(frame.images.length, 1);
  assert.equal(frame.images[0].mimeType, "image/png");
  assert.ok(frame.images[0].data.length > 10);
  const ease = ev.find((e) => e.type === "tool_result" && e.name === "set_ease");
  assert.equal(ease.ok, true);
});

test("check: diff_since_last JSON has targets and passed", () => {
  const ev = parseAll(fixture("stream-check.jsonl"));
  const diff = ev.find((e) => e.type === "tool_result" && e.name === "diff_since_last");
  assert.equal(diff.ok, true);
  assert.equal(diff.json.comp_matches, true);
  assert.ok(Array.isArray(diff.json.targets) && diff.json.targets.length > 0);
  assert.equal(typeof diff.json.passed, "boolean");
});

test("chunk boundaries don't matter", () => {
  const text = fixture("stream-show-me.jsonl");
  const whole = parseAll(text).map((e) => e.type);
  assert.deepEqual(parseAll(text, 7).map((e) => e.type), whole);
  assert.deepEqual(parseAll(text, 4096).map((e) => e.type), whole);
});

test("a non-JSON line is reported and skipped", () => {
  const ev = parseAll('oops\n{"type":"result","is_error":false,"total_cost_usd":0.1}\n');
  assert.equal(ev[0].type, "error");
  assert.equal(ev[0].kind, "bad_stream");
  assert.equal(ev[1].type, "turn_end");
});

test("an auth error result becomes not_signed_in, then a failed turn_end", () => {
  const ev = parseAll(JSON.stringify({ type: "result", is_error: true, result: "Not logged in · Please run /login" }) + "\n");
  assert.deepEqual(ev.map((e) => [e.type, e.kind || e.ok]), [["error", "not_signed_in"], ["turn_end", false]]);
});

test("an error tool result has ok false", () => {
  const lines = [
    { type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "mcp__ae-mentor__diff_since_last", input: {} }] } },
    { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", is_error: true, content: "AE_UNREACHABLE: can't reach After Effects" }] } },
  ].map((m) => JSON.stringify(m)).join("\n") + "\n";
  const r = parseAll(lines).find((e) => e.type === "tool_result");
  assert.equal(r.ok, false);
  assert.match(r.text, /AE_UNREACHABLE/);
  assert.equal(r.json, undefined);
});
