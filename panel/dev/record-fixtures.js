#!/usr/bin/env node
// Records the stream fixtures in panel/test/fixtures/ (the T005 spike, research R1 › Spike result).
// Runs one headless Claude Code process in fixture mode, sends three turns over stdin, and saves
// each turn's raw stdout with the home folder and session ids scrubbed. Re-run it after a Claude
// Code update changes the stream format, then run the panel tests. Costs about $0.25.
//   node panel/dev/record-fixtures.js
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const FIXTURES = path.join(REPO, "product", "evals", "easing", "fixtures");
const OUT = path.join(REPO, "panel", "test", "fixtures");
const PREFIX = "mcp__ae-mentor__";
const TOOLS = ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson"];
const ZERO_ID = "00000000-0000-0000-0000-000000000000";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-panel-spike-"));
const stateFile = path.join(home, "fixture-state.json");
const setProject = (name) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, `${name}.json`) }));

const sessionId = crypto.randomUUID();
const args = ["--print", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
  "--include-partial-messages", "--session-id", sessionId,
  "--mcp-config", ".mcp.json", "--strict-mcp-config", "--tools", "ToolSearch",
  "--allowedTools", ...TOOLS.map((t) => PREFIX + t), "--max-turns", "12"];

const turns = [
  { file: "stream-opening.jsonl", project: "before", say: "/ease-mentor" },
  { file: "stream-show-me.jsonl", project: "before", say: "Show me how first." },
  { file: "stream-check.jsonl", project: "after-demo", say: "I'm done. Check my work." },
];

// Scrub before saving: home folder, session ids, temp folder names (research R11).
function scrub(line) {
  return line
    .split(home).join("~/AEMentor-test")
    .split(os.homedir()).join("~")
    .split(os.homedir().split("/").join("-")).join("-~")
    .split(sessionId).join(ZERO_ID)
    .replace(/"session_id":"[0-9a-f-]{36}"/g, `"session_id":"${ZERO_ID}"`)
    .replace(/"uuid":"[0-9a-f-]{36}"/g, `"uuid":"${ZERO_ID}"`);
}

const child = spawn("claude", args, {
  cwd: REPO,
  env: { ...process.env, AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile },
  stdio: ["pipe", "pipe", "pipe"],
});
child.stderr.on("data", (d) => process.stderr.write(`[stderr] ${d}`));

let buf = "";
let current = null; // { turn, lines, sentAt, firstDelta, firstEvent }
const report = [];

function send(i) {
  const t = turns[i];
  setProject(t.project);
  current = { i, lines: [], sentAt: Date.now(), firstDelta: null, firstEvent: null };
  child.stdin.write(JSON.stringify({ type: "user", message: { role: "user", content: t.say } }) + "\n");
  console.log(`\n>>> turn ${i + 1}: ${t.say}`);
}

function onLine(line) {
  if (!current) return console.log(`(before any turn) ${line.slice(0, 200)}`);
  current.lines.push(line);
  let m;
  try { m = JSON.parse(line); } catch { return console.log(`NOT JSON: ${line.slice(0, 200)}`); }
  const ms = Date.now() - current.sentAt;
  const isDelta = m.type === "stream_event" && m.event && m.event.type === "content_block_delta" && m.event.delta && m.event.delta.type === "text_delta";
  const isToolUse = m.type === "assistant" && m.message && (m.message.content || []).some((b) => b.type === "tool_use");
  if (isDelta && current.firstDelta === null) current.firstDelta = ms;
  if ((isDelta || isToolUse) && current.firstEvent === null) current.firstEvent = ms;
  if (m.type !== "stream_event") {
    const kinds = m.message && Array.isArray(m.message.content) ? m.message.content.map((b) => b.type + (b.name ? `:${b.name}` : "")).join(",") : "";
    console.log(`${String(ms).padStart(6)} ms  ${m.type}${m.subtype ? "/" + m.subtype : ""} ${kinds}`);
  }
  if (m.type === "result") {
    const t = turns[current.i];
    fs.writeFileSync(path.join(OUT, t.file), current.lines.map(scrub).join("\n") + "\n");
    report.push({ turn: current.i + 1, say: t.say, first_delta_ms: current.firstDelta, first_event_ms: current.firstEvent, total_ms: ms, cost_usd: m.total_cost_usd, is_error: m.is_error, lines: current.lines.length });
    if (current.i + 1 < turns.length) send(current.i + 1);
    else { current = null; child.stdin.end(); }
  }
}

child.stdout.on("data", (d) => {
  buf += d;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl);
    buf = buf.slice(nl + 1);
    if (line.trim()) onLine(line);
  }
});

child.on("close", (code) => {
  console.log(`\nprocess exit ${code}`);
  console.table(report);
  fs.rmSync(home, { recursive: true, force: true });
});

send(0);
