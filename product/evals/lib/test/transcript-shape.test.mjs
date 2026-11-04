// T030 / FR-031: a recorded easing case 06 (three turns, a demo, a check, a record) on each runtime.
// The rendered transcripts must have the same structure, so check() and the judge prompt see the
// same events. Recorded 2026-11-04 (A: mentor on the API; B1: headless Claude Code). Only the
// words and ids differ between runs, never the structure of the lines.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rec = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "transcript-shape-06.json"), "utf8"));

// The line kinds renderTranscript() writes: turn headers, learner lines, mentor lines, tool calls
// (name only) and tool results (ok or error).
const skeleton = (t) =>
  t.split("\n").flatMap((l) => {
    if (/^### Turn \d+: /.test(l)) return ["turn"];
    if (l.startsWith("LEARNER: ")) return ["learner"];
    if (l.startsWith("MENTOR: ")) return ["mentor"];
    const call = l.match(/^TOOL CALL (\w+)/);
    if (call) return ["call " + call[1]];
    const res = l.match(/^TOOL RESULT \((ok|error)\)/);
    if (res) return ["result " + res[1]];
    return [];
  });

test("A and B1 render the same turn, learner, tool-call and tool-result lines", () => {
  const a = skeleton(rec.a.transcript);
  const b = skeleton(rec.b1.transcript);
  assert.ok(a.length > 10);
  assert.deepEqual(a.filter((x) => x.startsWith("turn")), b.filter((x) => x.startsWith("turn")));
  assert.deepEqual(a.filter((x) => x.startsWith("call")), b.filter((x) => x.startsWith("call")));
  assert.deepEqual(a.filter((x) => x.startsWith("result")), b.filter((x) => x.startsWith("result")));
  assert.equal(a.filter((x) => x === "learner").length, 3);
  assert.equal(b.filter((x) => x === "learner").length, 3);
});

test("every tool call has a result, on both runtimes", () => {
  for (const k of ["a", "b1"]) {
    const s = skeleton(rec[k].transcript);
    assert.equal(s.filter((x) => x.startsWith("call")).length, s.filter((x) => x.startsWith("result")).length, k);
  }
});

test("both runs went through the same deterministic checks (A adds only allowlist)", () => {
  assert.deepEqual(rec.a.checks.filter((c) => c !== "allowlist"), rec.b1.checks);
  assert.ok(rec.a.checks.includes("allowlist"));
});
