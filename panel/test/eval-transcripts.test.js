// Spec 007 T002: panel fixtures from stored eval transcripts, and saved learner records.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { parseTranscript, toStreamLines, scrubPaths, recordFixtures } = require("../dev/eval-transcripts.js");
const { createStreamParser } = require("../lib/stream.js");

const SAMPLE = [
  '### Turn 1: the project is fixture "before"',
  "LEARNER: /ease-mentor",
  "TOOL CALL snapshot_project {}",
  'TOOL RESULT (ok): {',
  '  "lesson": "new",',
  '  "targets": ["1/a/1"]',
  "}",
  "MENTOR: First line.",
  "Second line.",
  "",
  "### Turn 2: the project is fixture \"after\"",
  "LEARNER: Show me how first.",
  'TOOL CALL set_ease {"segment_id":"1/a/1"}',
  "TOOL RESULT (error): DEMO_USED: already used",
  "",
].join("\n");

test("a transcript parses into turns with the learner's words, mentor text and tool results", () => {
  const turns = parseTranscript(SAMPLE);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].say, "/ease-mentor");
  assert.deepEqual(turns[0].events.map((e) => e.kind), ["call", "result", "say"]);
  assert.equal(turns[0].events[2].text, "First line.\nSecond line.");
  assert.equal(turns[1].events[1].ok, false);
});

test("the stream lines replay through the panel's own parser", () => {
  const events = [];
  const p = createStreamParser((e) => events.push(e));
  p.push(toStreamLines(parseTranscript(SAMPLE)).join("\n") + "\n");
  p.end();
  const results = events.filter((e) => e.type === "tool_result");
  assert.deepEqual(results.map((e) => [e.name, e.ok]), [["snapshot_project", true], ["set_ease", false]]);
  assert.deepEqual(results[0].json.targets, ["1/a/1"]);
  assert.equal(events.filter((e) => e.type === "turn_end").length, 2);
  assert.equal(events.find((e) => e.type === "text").text, "First line.\nSecond line.");
});

test("paths are scrubbed", () => {
  const out = scrubPaths('"path": "/var/folders/46/x_y/T/AEMentor-QQ/learner.json", "b": "/Users/someone/Library/x.png"');
  assert.doesNotMatch(out, /\/var\/folders|\/Users\//);
});

const FIX = path.join(__dirname, "fixtures");

test("the easing fixtures are saved, parse and hold no local path", () => {
  const files = fs.readdirSync(path.join(FIX, "eval")).filter((f) => f.startsWith("easing-"));
  assert.ok(files.length >= 4, files.join());
  for (const f of files) {
    const text = fs.readFileSync(path.join(FIX, "eval", f), "utf8");
    assert.doesNotMatch(text, /\/var\/folders|\/Users\//, f);
    const events = [];
    const p = createStreamParser((e) => events.push(e));
    p.push(text);
    p.end();
    assert.ok(events.some((e) => e.type === "tool_result" && e.json), f);
    assert.equal(events.filter((e) => e.type === "error").length, 0, f);
  }
});

test("saved records: none, one lesson, 20 lessons, unreadable, set aside", () => {
  const rec = recordFixtures();
  assert.deepEqual(Object.keys(rec).sort(), ["none", "one-lesson", "set-aside", "twenty-lessons", "unreadable"]);
  const dir = (n) => path.join(FIX, "records", n);
  assert.equal(fs.existsSync(path.join(dir("none"), "learner.json")), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir("one-lesson"), "learner.json"))).lessons.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir("twenty-lessons"), "learner.json"))).lessons.length, 20);
  assert.throws(() => JSON.parse(fs.readFileSync(path.join(dir("unreadable"), "learner.json"), "utf8")));
  const aside = fs.readdirSync(dir("set-aside"));
  assert.equal(aside.includes("learner.json"), false);
  assert.ok(aside.some((f) => f.startsWith("learner.json.unreadable-")), aside.join());
});
