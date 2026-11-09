// Turns stored eval transcripts into panel stream fixtures, and writes the saved learner records the
// Home tests read (spec 007 T002). Spends nothing: it reads files already in product/evals/. The CLI
// is record-fixtures.js --from-evals <skill> and --records.
"use strict";

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const FIXTURES = path.join(REPO, "panel", "test", "fixtures");
const PREFIX = "mcp__ae-mentor__";
const ZERO_ID = "00000000-0000-0000-0000-000000000000";

// Which cases become fixtures, per skill.
const CASES = {
  easing: ["01-new-learner-opening", "03-show-me", "06-correct-attempt", "07-partial-attempt", "12-other-comp", "23-undo-then-redo"],
};

// The rendered form is run.mjs's renderTranscript. A block runs until the next line with a marker.
function parseTranscript(text) {
  const turns = [];
  let turn = null;
  let open = null; // the block new lines are added to
  for (const line of text.split("\n")) {
    let m;
    if ((m = /^### Turn \d+: /.exec(line))) {
      turn = { say: "", events: [] };
      turns.push(turn);
      open = null;
    } else if (!turn) {
      continue;
    } else if ((m = /^LEARNER: (.*)$/.exec(line))) {
      turn.say = m[1];
      open = null;
    } else if ((m = /^MENTOR: (.*)$/.exec(line))) {
      open = { kind: "say", text: m[1] };
      turn.events.push(open);
    } else if ((m = /^TOOL CALL (\w+) (.*)$/.exec(line))) {
      let input = {};
      try { input = JSON.parse(m[2]); } catch (e) { /* a call's input is never needed to replay it */ }
      turn.events.push({ kind: "call", name: m[1], input });
      open = null;
    } else if ((m = /^TOOL RESULT \((ok|error)\): (.*)$/.exec(line))) {
      open = { kind: "result", ok: m[1] === "ok", text: m[2] };
      turn.events.push(open);
    } else if (open) {
      open.text += `\n${line}`;
    }
  }
  for (const t of turns) for (const e of t.events) if (typeof e.text === "string") e.text = e.text.replace(/\n+$/, "");
  return turns;
}

// Claude Code stream-json lines, as stream.js reads them.
function toStreamLines(turns) {
  const out = [];
  let n = 0;
  turns.forEach((t) => {
    let callId = null;
    for (const e of t.events) {
      if (e.kind === "say") out.push(JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: e.text }] } }));
      if (e.kind === "call") {
        callId = `toolu_${++n}`;
        out.push(JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: callId, name: PREFIX + e.name, input: e.input }] } }));
      }
      if (e.kind === "result" && callId) {
        out.push(JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: callId, is_error: !e.ok, content: [{ type: "text", text: e.text }] }] } }));
        callId = null;
      }
    }
    out.push(JSON.stringify({ type: "result", is_error: false, total_cost_usd: 0, session_id: ZERO_ID }));
  });
  return out;
}

function scrubPaths(text) {
  return text
    .replace(/\/(?:private\/)?var\/folders\/[^"\\\s]*/g, "~/AEMentor-test")
    .replace(/\/Users\/[^"\\\s]*/g, "~/file");
}

// The newest stored run of a case, from results/*.json. → its transcript, or null.
function newestTranscript(skill, caseId) {
  const dir = path.join(REPO, "product", "evals", skill, "results");
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort().reverse()) {
    let results;
    try { results = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { continue; }
    const c = (results.cases || []).find((x) => x.id === caseId);
    const run = c && (c.runs || []).find((r) => typeof r.transcript === "string" && r.transcript);
    if (run) return { file: f, transcript: run.transcript };
  }
  return null;
}

function fromEvals(skill) {
  const ids = CASES[skill];
  if (!ids) throw new Error(`no cases listed for ${skill}`);
  const out = path.join(FIXTURES, "eval");
  fs.mkdirSync(out, { recursive: true });
  return ids.map((id) => {
    const found = newestTranscript(skill, id);
    if (!found) throw new Error(`no stored transcript for ${skill} ${id}`);
    const lines = toStreamLines(parseTranscript(found.transcript));
    fs.writeFileSync(path.join(out, `${skill}-${id}.jsonl`), scrubPaths(lines.join("\n")) + "\n");
    return `${skill}-${id}.jsonl (from ${found.file})`;
  });
}

const lesson = (i) => ({
  date: `2026-10-${String((i % 28) + 1).padStart(2, "0")}T18:00:00.000Z`,
  skill: "easing.basic",
  project: "Practice.aep",
  comp: "Mentor Practice",
  result: i % 3 === 2 ? "partial" : "passed",
  next: `Practice note ${i + 1}.`,
});

function recordFor(count) {
  const lessons = Array.from({ length: count }, (_, i) => lesson(i));
  return { version: 1, skills: { "easing.basic": { status: "learned", last_practiced: lessons[count - 1].date, times_passed: count, next: lessons[count - 1].next } }, lessons };
}

const AS_JSON = (r) => JSON.stringify(r, null, 2) + "\n";
const RECORDS = {
  none: {},
  "one-lesson": { "learner.json": AS_JSON(recordFor(1)) },
  "twenty-lessons": { "learner.json": AS_JSON(recordFor(20)) },
  unreadable: { "learner.json": "{ this is not json\n" },
  "set-aside": { "learner.json.unreadable-2026-10-20T18-00-00-000Z": "{ this is not json\n" },
};

// Writes every record folder. → the folder list, by name.
function writeRecords() {
  const out = {};
  for (const [name, files] of Object.entries(RECORDS)) {
    const dir = path.join(FIXTURES, "records", name);
    fs.mkdirSync(dir, { recursive: true });
    if (Object.keys(files).length === 0) fs.writeFileSync(path.join(dir, ".gitkeep"), "");
    for (const [file, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, file), text);
    out[name] = dir;
  }
  return out;
}

const recordFixtures = () => Object.fromEntries(Object.keys(RECORDS).map((n) => [n, path.join(FIXTURES, "records", n)]));

module.exports = { parseTranscript, toStreamLines, scrubPaths, fromEvals, writeRecords, recordFixtures, CASES };
