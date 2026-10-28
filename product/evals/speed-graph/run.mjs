#!/usr/bin/env node
// The speed-graph eval runner (modelled on product/evals/null-parenting/run.mjs, itself copied from
// product/evals/easing/run.mjs; copied rather than shared so no set edits another's files).
// Drives headless Claude Code through each case in cases/, with the ae-mentor server in fixture mode
// so After Effects is never contacted, then scores it: deterministic checks first, then a rubric
// judge only if those pass. Node built-ins only. Everything skill-specific is in CONFIG below.
//
//   node product/evals/speed-graph/run.mjs                  full run
//   node product/evals/speed-graph/run.mjs --only 07        one case (id prefix) or a covers code
//   node product/evals/speed-graph/run.mjs --changed        skip cases unchanged since their last pass
//   node product/evals/speed-graph/run.mjs --repeat 3       each case 3 times; passes on a majority
//   node product/evals/speed-graph/run.mjs --judge-always   judge even after a failed check
//   node product/evals/speed-graph/run.mjs --dry-run        validate cases, fixtures and their sources, call nothing
//   node product/evals/speed-graph/run.mjs --dry-run --strict-sources   also fail on a stale source label
//
// Fixtures are NOT copied into this folder. A case names a fixture the way the builder's tests do and
// the runner finds it in CONFIG.fixtureDirs order (a live capture before its stand-in), so when a
// live capture lands under the same name the case picks it up. --dry-run lists every label that is
// out of date (see README > Re-pointing).

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// The panel's runtime folder, so evals run the mentor the way the panel does: outside the repo,
// with no builder CLAUDE.md or auto-memory in context (agent audit 2026-10-12, lesson 4.5).
const { ensureRuntime } = createRequire(import.meta.url)("../../../panel/lib/runtime.js");

const EVAL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EVAL_DIR, "..", "..", "..");
const CASES_DIR = path.join(EVAL_DIR, "cases");
const RESULTS_DIR = path.join(EVAL_DIR, "results");
const RUBRIC = fs.readFileSync(path.join(EVAL_DIR, "rubric.md"), "utf8");

// ---------- CONFIG: the only skill-specific part ----------
const CONFIG = {
  "cmd": "/speed-graph-mentor",
  "skillFile": ".claude/skills/speed-graph-mentor/SKILL.md",
  "toolPrefix": "speed_graph_",
  "demoKey": "segment_id",
  "fixtureDirs": [
    "mentor/test/fixtures/speed-graph",
    "mentor/test/fixtures",
    "mentor/test/fixtures/layer-info",
    "mentor/test/fixtures/speed-graph/stand-in"
  ],
  "judgeLabel": "an After Effects mentor that teaches shaping an ease in the speed graph (influence)",
  "recordMethod": "\\binfluence\\b[^|]{0,15}\\d|\\d+ ?%|\\bbecause\\b|\\bdialog\\b|\\bdrag(?:ged|ging)?\\b|\\bso that\\b|\\bthreshold",
  "internalExtra": [
    "\\b\\d+\\/ADBE\\b",
    "[\"'`](?:not_shaped|arrives_moving|no_handle|back_to_default|long_both_ends|in_out_mixed|keys_changed|nothing_to_shape|single_target|none_in_focus)[\"'`]"
  ],
  "universal": [
    [
      "no_self_instructions",
      "review (?:is )?due\\s*(?:→|->|\\.|:|,|-)\\s*(?:run(?: the)? review|review mode)|\\bRun review\\b|\\breview mode\\b|^\\s*Learned, review due|\\breview (?:is )?due\\s*(?:→|->|[.:,;-]|so)\\s*(?:I(?:'ll| will)\\s+|we(?:'ll| will)\\s+)?(?:run|go|open|start|take)\\b|\\bstraight (?:to|into) the review\\b|\\b(?:learned|practicing)\\b[^.?!]{0,40}\\breview (?:is )?due\\b[^.?!]{0,40}(?:\\bso\\b|→|->)|\\b(?:review|lesson|restart) branch\\b|\\bbranch\\b[^.?!]{0,20}\\b(?:review|lesson)\\b|\\b(?:easing|this skill) (?:isn't|is not|hasn't been) learned,? so I(?:'ll| will)"
    ],
    [
      "no_target_number",
      "\\b\\d+(?:\\.\\d+)?\\s*%|\\binfluence (?:of|at|to|is|about) \\d|\\b(?:15|20|33|80|85)\\s*(?:and|\\/|,)\\s*(?:15|20|33|80|85)\\b|\\b\\d+ points\\b"
    ],
    [
      "no_graph_vision",
      "\\bI can (?:see|tell) (?:the|your|that) (?:graph|speed graph|Graph Editor|curve)|\\bI see (?:the|your) (?:graph|curve)\\b"
    ],
    [
      "no_unconfirmed_velocity_path",
      "Keyframe Velocity[^.]*(?:Animation\\s*>|Cmd|Ctrl|menu)|Animation\\s*>\\s*Keyframe Velocity"
    ]
  ],
  "reviewBanned": [
    [
      "method",
      "Edit Speed Graph|Graph Editor|\\bdrag|sideways|handle"
    ]
  ],
  "name": "speed-graph"
};
const FIXTURE_DIRS = CONFIG.fixtureDirs.map((d) => path.join(REPO, d));
const SKILL_FILE = CONFIG.skillFile;
const SKILL_CMD = CONFIG.cmd;
const T = CONFIG.toolPrefix;
const SNAP = `${T}snapshot`;
const DEMO = `${T}demo`;
const CHECK = `${T}check`;

const TARGET = 0.8; // SC-006
const MAX_TURNS = "12";
const TURN_TIMEOUT_MS = 5 * 60 * 1000;
const MENTOR_TOOLS = ["read_learner_record", SNAP, DEMO, CHECK, "preview_frame", "record_lesson", "recommend_next"];
// FR-052 / OR-2: the lesson opens with the snapshot, so read_learner_record is no longer allowed here.
// It stays in MENTOR_TOOLS so a call to it is still seen (and fails no_read_learner_record) instead of
// reading as a foreign tool.
const ALLOWED_TOOLS = MENTOR_TOOLS.filter((t) => t !== "read_learner_record");
const PREFIX = "mcp__ae-mentor__";
// The repo's local settings may set a builder output style (Explanatory adds "★ Insight" notes).
// CLI settings outrank local ones, so every headless run here uses the default voice (usage notes,
// panel session 1: baseline results before this fix include builder notes).
const SETTINGS = ["--settings", JSON.stringify({ outputStyle: "default" })];

// ---------- arguments ----------

function parseArgs(argv) {
  const opts = { only: null, changed: false, repeat: 1, judgeAlways: false, dryRun: false, strictSources: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--only") opts.only = argv[++i];
    else if (a === "--changed") opts.changed = true;
    else if (a === "--repeat") opts.repeat = Math.max(1, Number(argv[++i]) || 1);
    else if (a === "--judge-always") opts.judgeAlways = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--strict-sources") opts.strictSources = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return opts;
}

// ---------- cases, fixtures and hashes ----------

function loadCases() {
  return fs
    .readdirSync(CASES_DIR)
    .filter((f) => /^\d\d-.*\.json$/.test(f))
    .sort()
    .map((f) => ({ file: path.join(CASES_DIR, f), ...JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf8")) }));
}

// → { file, source } for a fixture name, or null. Searches CONFIG.fixtureDirs in order, so a live
// capture (listed before its stand-in's folder) wins. `source` comes from the path:
// "synthetic" (a synthetic folder), "stand-in" (a stand-in folder) or "live".
function resolveFixture(name) {
  for (const dir of FIXTURE_DIRS) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) return { file: f, source: /[\\/]stand-in[\\/]/.test(f) ? "stand-in" : /[\\/]synthetic[\\/]/.test(f) ? "synthetic" : "live" };
  }
  return null;
}

// A learner record: a path from the repo root.
const recordFile = (name) => path.join(REPO, name);
const fixtureNames = (c) => [...new Set(c.turns.filter((t) => t.project !== "unreachable").map((t) => t.project))];

const SOURCES = ["stand-in", "synthetic", "live"];

function validate(c) {
  const problems = [];
  for (const k of ["id", "title", "covers", "fixture_sources", "turns", "expect", "rubric"]) if (!(k in c)) problems.push(`missing ${k}`);
  for (const t of c.turns || []) {
    if (t.project !== "unreachable" && !resolveFixture(t.project)) problems.push(`no fixture ${t.project}`);
  }
  // Every fixture a case uses carries a label saying what it is now, so re-pointing is mechanical.
  for (const n of fixtureNames(c)) {
    const label = (c.fixture_sources || {})[n];
    if (!label) problems.push(`no fixture_sources label for ${n}`);
    else if (!SOURCES.includes(label)) problems.push(`fixture_sources ${n}: "${label}" isn't one of ${SOURCES.join(", ")}`);
  }
  for (const n of Object.keys(c.fixture_sources || {})) if (!fixtureNames(c).includes(n)) problems.push(`fixture_sources names ${n}, which no turn uses`);
  if (c.learner_record && !fs.existsSync(recordFile(c.learner_record))) problems.push(`no learner record ${c.learner_record}`);
  const items = new Set([...RUBRIC.matchAll(/^## (R-[A-Z0-9-]+)/gm)].map((m) => m[1]));
  for (const r of c.rubric || []) if (!items.has(r)) problems.push(`unknown rubric item ${r}`);
  const known = ["first_tool", "tools_called", "tools_not_called", "snapshot_with", "demo_calls_min", "demo_calls_max", "demo_only_on",
    "last_check", "say", "record_lesson", "review_mode", "snapshot_calls_max", "snapshot_input_matches", "snapshot_input_lacks", "snapshot_reply", "focus_stable", "focus_named", "first_snapshot_without_options", "snapshot_in_turn_lacks"];
  for (const k of Object.keys(c.expect || {})) if (!known.includes(k)) problems.push(`unknown expect key ${k}`);
  for (const s of (c.expect || {}).say || []) {
    if (!s.id || !(s.must || s.never)) problems.push(`say check needs an id and must or never: ${JSON.stringify(s).slice(0, 60)}`);
    try { new RegExp(s.must || s.never); } catch (e) { problems.push(`say ${s.id}: bad regex`); }
    for (const t of Array.isArray(s.turns) ? s.turns : []) if (!Number.isInteger(t) || t < 1 || t > c.turns.length) problems.push(`say ${s.id}: turn ${t} is out of range`);
  }
  return problems;
}

// What a case's behavior depends on. --changed skips a case whose hash matches its last pass.
const dirFiles = (dir) => fs.readdirSync(path.join(REPO, dir)).filter((f) => f.endsWith(".mjs") || f.endsWith(".jsx")).map((f) => `${dir}/${f}`);
const SHARED_INPUTS = [
  SKILL_FILE,
  ...dirFiles("mentor/tools"),
  ...dirFiles("mentor/lib"),
  ...dirFiles("mentor/fixture"),
  "mentor/fixture.mjs",
  "mentor/server.mjs",
  "mentor/errors.mjs",
  `product/evals/${CONFIG.name}/rubric.md`,
  "panel/lib/runtime.js",
];

function caseHash(c) {
  const h = crypto.createHash("sha256");
  const files = [...SHARED_INPUTS.map((f) => path.join(REPO, f)), c.file];
  if (c.learner_record) files.push(recordFile(c.learner_record));
  // The resolved fixture: a live capture replacing a stand-in changes the hash, so --changed reruns.
  for (const n of fixtureNames(c)) files.push(resolveFixture(n).file);
  for (const f of [...new Set(files)]) h.update(f.slice(REPO.length)).update(fs.readFileSync(f));
  return h.digest("hex");
}

// The fixture as the mentor sees it. The builder's files carry a `synthetic` note and some use the
// project name "Synthetic.aep" and comp names that start with "Synthetic"; those tell the model it is
// being tested (the "fixture tell"), so a run gets a scrubbed copy.
function materialize(name, to) {
  const snap = JSON.parse(fs.readFileSync(resolveFixture(name).file, "utf8"));
  delete snap.synthetic;
  if (/^Synthetic\b/.test(snap.project || "")) snap.project = "Studio Reel.aep";
  if (snap.comp && /Synthetic/.test(snap.comp.name || "")) snap.comp.name = snap.comp.name.replace(/Synthetic/g, "Studio");
  const text = JSON.stringify(snap);
  if (/synthetic|stand-in/i.test(text)) throw new Error(`${name} still says synthetic or stand-in after scrubbing`);
  fs.writeFileSync(to, text);
}

// ---------- results ----------

// Results are committed (constitution IV). Claude Code puts local paths in transcripts (an image
// tool result shows where it was saved), and a home folder path usually contains a real name.
// Covers both the plain path and the dashed form in ~/.claude/projects folder names.
function scrubHome(text) {
  const home = os.homedir();
  return text.replaceAll(home, "~").replaceAll(home.replaceAll("/", "-"), "-~");
}

function previousResults() {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), "utf8")) }));
}

// The most recent passing run of this case with the same hash, if any.
function lastPassWithHash(results, id, hash) {
  for (const r of [...results].reverse()) {
    const c = r.cases.find((x) => x.id === id);
    if (c && c.pass && c.hash === hash) return { ...c, from: r.file };
  }
  return null;
}

// ---------- running claude ----------

function claude(args, env, cwd) {
  const r = spawnSync("claude", args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: TURN_TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) throw new Error(`claude failed to run: ${r.error.message}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    throw new Error(`claude returned no JSON (exit ${r.status}): ${(r.stderr || r.stdout).slice(0, 500)}`);
  }
  // With some settings the output is an array of messages; otherwise just the result object.
  const messages = Array.isArray(parsed) ? parsed : [parsed];
  const result = messages.findLast((m) => m.type === "result");
  if (!result) throw new Error("claude output has no result message");
  return { messages, result };
}

function mentorTurn(say, sessionId, env, cwd) {
  const args = ["-p", say, "--mcp-config", ".mcp.json", "--strict-mcp-config", "--output-format", "json", "--verbose",
    "--max-turns", MAX_TURNS, "--tools", "ToolSearch", "--allowedTools", ...ALLOWED_TOOLS.map((t) => PREFIX + t), ...SETTINGS];
  if (sessionId) args.push("--resume", sessionId);
  return claude(args, env, cwd);
}

// The turn's transcript: what the mentor said and every tool call with its result.
function transcriptOf(messages) {
  const events = [];
  const byId = new Map();
  for (const m of messages) {
    const content = m.message && Array.isArray(m.message.content) ? m.message.content : [];
    if (m.type === "assistant") {
      for (const b of content) {
        if (b.type === "text" && b.text.trim()) events.push({ kind: "say", text: b.text });
        if (b.type === "tool_use") {
          const ev = { kind: "tool", name: b.name.replace(PREFIX, ""), input: b.input, ok: null, result: null };
          byId.set(b.id, ev);
          events.push(ev);
        }
      }
    } else if (m.type === "user") {
      for (const b of content) {
        if (b.type !== "tool_result" || !byId.has(b.tool_use_id)) continue;
        const ev = byId.get(b.tool_use_id);
        const text = Array.isArray(b.content) ? b.content.filter((x) => x.type === "text").map((x) => x.text).join("\n") : String(b.content ?? "");
        ev.ok = !b.is_error;
        ev.result = text;
      }
    }
  }
  return events;
}

// ---------- deterministic checks ----------

const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };
const toolEvents = (turn) => turn.events.filter((e) => e.kind === "tool");
const mentorCalls = (turns) => turns.flatMap((t) => toolEvents(t).filter((e) => MENTOR_TOOLS.includes(e.name)));
const saysOf = (turn) => turn.events.filter((e) => e.kind === "say").map((e) => e.text);

// Every check below that reads a regex from a case uses the "i" flag unless the case says "cs".
const rx = (s) => new RegExp(s.must || s.never, s.cs ? "" : "i");

// Run on every case, with no expect key (agent audit 2026-10-12, lessons 4.3 and 4.4). The learner
// sees every word, so no field or value name from tool output, and no narrated calls.
const INTERNAL_NAME = new RegExp([
  String.raw`\b[a-z]+_[a-z_]+\b`, // parenting_passed, pivot_region, slides_only, null_ready
  String.raw`\b(?:easing|keyframes|transform|parenting|timing|motion)\.[a-z_]+\b`, // skill ids
  String.raw`\bparent\/[A-Z]`, // target IDs
  "[\"'`](?:top-left|top-center|top-right|middle-left|middle-right|bottom-left|bottom-center|bottom-right|center|continued|resumed|passed|partial|not_checked)[\"'`]",
].concat(CONFIG.internalExtra || []).join("|"));
const NARRATION = /\bmust (?:call|run|check|diff|snapshot|read)\b[^.]*\bfirst\b|\b(?:let me|I'll|I will|now I'll) (?:call|run|use) (?:the )?(?:check|snapshot|diff|tool|null_parent)/i;
// A keyboard shortcut: the skills quote none until their live check logs it.
const SHORTCUT = /\b(?:cmd|command|ctrl|control|shift|option|alt|opt)\s*\+\s*[a-z0-9]|\bshift\s*\+?\s*f[0-9]+\b/i;
const SYNTH_TELL = /\bsynthetic\b|\bfixture\b|\bstand-in\b|\bthe eval\b|\bthis test\b/i;
const RECORD_METHOD = new RegExp(CONFIG.recordMethod, "i");

function said(turns, from = 1, to = turns.length) {
  return turns.slice(from - 1, to).flatMap((t) => saysOf(t).map((text) => ({ text })));
}

// Shortcuts the skill itself teaches (CONFIG.shortcutAllow, e.g. anchor's "Shift+P") are removed first.
function shortcutCheck(turns) {
  const allow = (CONFIG.shortcutAllow || []).map((a) => new RegExp(a, "gi"));
  const hit = said(turns).map((s) => allow.reduce((t, re) => t.replace(re, " "), s.text).match(SHORTCUT)).find(Boolean);
  return { check: "no_shortcuts", pass: !hit, detail: hit ? `said "${hit[0]}"` : "clean" };
}

function wordsCheck(name, re, turns) {
  const hit = said(turns).map((s) => s.text.match(re)).find(Boolean);
  return { check: name, pass: !hit, detail: hit ? `said "${hit[0]}"` : "clean" };
}

// Turn range of a say check: "last", an [from, to] pair, or all turns.
function range(turns, spec) {
  if (spec === "last") return [turns.length, turns.length];
  if (Array.isArray(spec) && spec.length === 2) return spec;
  if (Array.isArray(spec) && spec.length === 1) return [spec[0], spec[0]];
  return [1, turns.length];
}

// The first successful check of the lesson that passed, or null.
function firstPass(turns) {
  for (let i = 0; i < turns.length; i++) {
    const ev = toolEvents(turns[i]).find((e) => e.name === CHECK && e.ok && (parse(e.result) || {}).passed === true);
    if (ev) return { turn: i + 1, event: ev };
  }
  return null;
}

function check(expect, turns, c) {
  const out = [
    wordsCheck("plain_words", INTERNAL_NAME, turns),
    wordsCheck("no_narration", NARRATION, turns),
    shortcutCheck(turns),
    ...CONFIG.universal.map(([name, re, flags]) => wordsCheck(name, new RegExp(re, flags ?? "i"), turns)),
    wordsCheck("no_test_tell", SYNTH_TELL, turns),
  ];
  const add = (name, pass, detail) => out.push({ check: name, pass, detail });
  const calls = mentorCalls(turns);
  const demos = calls.filter((e) => e.name === DEMO);
  const checks = calls.filter((e) => e.name === CHECK);
  const snaps = calls.filter((e) => e.name === SNAP);

  // Every case: only the ae-mentor tools, at most one demo (attempted), none in a review.
  const foreign = turns.flatMap(toolEvents).filter((e) => !MENTOR_TOOLS.includes(e.name) && e.name !== "ToolSearch");
  add("only_mentor_tools", foreign.length === 0, foreign.length ? `used ${foreign.map((e) => e.name).join(", ")}` : "ok");
  add("demo_at_most_once", demos.length <= 1, `${demos.length} demo calls`);
  // FR-052: the mode is read from a snapshot's reply (the opening call sends none), never from its input.
  const replyOf = (e) => (e.ok ? parse(e.result) : null) || {};
  const reviewMode = snaps.some((e) => replyOf(e).mode === "review");
  if (reviewMode) {
    add("review_no_demo", demos.length === 0, `${demos.length} demo calls in a review`);
    // Words a review never says before a pass (CONFIG.reviewBanned, e.g. skill 6's "null" and its method).
    // "Before a pass" by default; CONFIG.reviewBannedUntil = "check" stops at the first check call instead.
    const pass = CONFIG.reviewBannedUntil === "check"
      ? { event: turns.flatMap(toolEvents).find((e) => e.name === CHECK) }
      : firstPass(turns);
    for (const [name, re] of CONFIG.reviewBanned || []) {
      let hit = null;
      let seenPass = false;
      for (const t of turns) {
        for (const e of t.events) {
          if (pass && pass.event && e === pass.event) seenPass = true;
          if (e.kind !== "say" || seenPass) continue;
          hit = hit || (e.text.match(new RegExp(re, "i")) || [])[0];
        }
      }
      add(`review_${name}_before_pass`, !hit, hit ? `said "${hit}" before a pass` : "clean");
    }
  } else if ("review_mode" in expect) {
    add("review_mode", false, "no snapshot reply had mode review");
  }
  // The record never holds method or motive (SKILL.md step 11; agent audit).
  for (const r of calls.filter((e) => e.name === "record_lesson" && e.ok)) {
    const text = [r.input.summary, r.input.attempted, r.input.next].filter(Boolean).join(" | ");
    const m = text.match(RECORD_METHOD);
    add("record_plain", !m, m ? `record says "${m[0]}"` : "clean");
  }

  {
    // Universal (FR-052, smoke findings 2026-10-26): nothing said between the lesson's first tool call
    // and its first snapshot. The learner sees every word; the opening is one turn after the snapshot.
    const t0 = turns.find((t) => t.events.some((e) => e.kind === "tool" && e.name === SNAP));
    const idx = t0 ? t0.events.findIndex((e) => e.kind === "tool" && e.name === SNAP) : -1;
    const before = idx < 0 ? [] : t0.events.slice(0, idx).filter((e) => e.kind === "say");
    add("no_text_before_snapshot", before.length === 0, before.length ? `said "${before[0].text.slice(0, 60)}" before the first snapshot` : "clean");
    // Universal (FR-052, OR-2): the snapshot reads the record; the skill never calls read_learner_record.
    const reads = calls.filter((e) => e.name === "read_learner_record");
    add("no_read_learner_record", reads.length === 0, reads.length ? `called read_learner_record ${reads.length} time(s)` : "none called");
  }
  if ("first_tool" in expect) {
    const first = calls[0]?.name ?? "(none)";
    add("first_tool", first === expect.first_tool, `first tool was ${first}`);
  }
  if ("tools_called" in expect) {
    const missing = expect.tools_called.filter((n) => !calls.some((e) => e.name === n));
    add("tools_called", missing.length === 0, missing.length ? `never called ${missing.join(", ")}` : "all called");
  }
  if ("tools_not_called" in expect) {
    const called = expect.tools_not_called.filter((n) => calls.some((e) => e.name === n));
    add("tools_not_called", called.length === 0, called.length ? `called ${called.join(", ")}` : "none called");
  }
  if ("snapshot_with" in expect) {
    const want = expect.snapshot_with;
    const ok = snaps.some((e) => Object.entries(want).every(([k, v]) => (e.input || {})[k] === v));
    add("snapshot_with", ok, ok ? "ok" : `no snapshot call with ${JSON.stringify(want)}`);
  }
  // The first successful snapshot reply (of one turn, when `turn` is given) holds these values;
  // `equals` keys may be dotted (learner.readable).
  for (const w of expect.snapshot_reply || []) {
    const pool = (w.turn ? toolEvents(turns[w.turn - 1] || { events: [] }) : snaps).filter((e) => e.name === SNAP && e.ok);
    const r = pool.length ? parse(pool[0].result) : null;
    const at = (o, k) => k.split(".").reduce((x, p) => (x == null ? undefined : x[p]), o);
    const wrong = !r ? ["no successful snapshot reply"] : Object.entries(w.equals || {}).filter(([k, v]) => at(r, k) !== v).map(([k]) => `${k} was ${JSON.stringify(at(r, k))}`);
    add(`snapshot_reply${w.turn ? "@" + w.turn : ""}`, wrong.length === 0, wrong.length ? wrong.join("; ") : "ok");
  }
  // Phase 10 review, should-fix 2: the layer the opening call's reply focuses on stays the focus in every
  // later snapshot reply, and the mentor names that layer in the given turn (compared with this run's
  // tool output, never a fixed name).
  if (expect.focus_stable || expect.focus_named) {
    const replies = snaps.filter((e) => e.ok).map((e) => parse(e.result)).filter(Boolean);
    const focuses = replies.map((r) => JSON.stringify(r.focus));
    if (expect.focus_stable) add("focus_stable", replies.length > 0 && new Set(focuses).size === 1, replies.length ? `focus across ${replies.length} snapshot replies: ${[...new Set(focuses)].join(" then ")}` : "no snapshot reply");
    if (expect.focus_named) {
      const layer = replies.length && Array.isArray(replies[0].focus) ? replies[0].focus[0] : null;
      const text = said(turns, expect.focus_named.turn, expect.focus_named.turn).map((x) => x.text).join("\n");
      add("focus_named", !!layer && text.includes(layer), layer ? (text.includes(layer) ? `names ${layer}` : `turn ${expect.focus_named.turn} never says ${layer}`) : "the first reply has no focus");
    }
  }
  for (const re of expect.snapshot_input_matches || []) {
    const ok = snaps.some((e) => new RegExp(re).test(JSON.stringify(e.input || {})));
    add(`snapshot_input:${re.slice(0, 30)}`, ok, ok ? "ok" : `no snapshot call whose input matches /${re}/`);
  }
  for (const re of expect.snapshot_input_lacks || []) {
    const bad = snaps.find((e) => new RegExp(re).test(JSON.stringify(e.input || {})));
    add(`snapshot_input_lacks:${re.slice(0, 30)}`, !bad, bad ? `a snapshot call's input matched /${re}/: ${JSON.stringify(bad.input).slice(0, 120)}` : "ok");
  }
  // FR-047 (T199e): per turn. The first snapshot call of each listed turn sends no skill_options; and a
  // listed turn has no snapshot call whose input matches the regex (turn is 1-based).
  for (const n of expect.first_snapshot_without_options || []) {
    const first = toolEvents(turns[n - 1] || { events: [] }).find((e) => e.name === SNAP);
    const ok = !!first && !("skill_options" in (first.input || {}));
    add(`first_snapshot_without_options:${n}`, ok, !first ? `no snapshot call in turn ${n}` : ok ? "ok" : `turn ${n}'s first call sent ${JSON.stringify(first.input).slice(0, 120)}`);
  }
  for (const { turn, re } of expect.snapshot_in_turn_lacks || []) {
    const bad = toolEvents(turns[turn - 1] || { events: [] }).find((e) => e.name === SNAP && new RegExp(re).test(JSON.stringify(e.input || {})));
    add(`snapshot_in_turn_lacks:${turn}`, !bad, bad ? `turn ${turn}: ${JSON.stringify(bad.input).slice(0, 120)}` : "ok");
  }
  if ("snapshot_calls_max" in expect) add("snapshot_calls_max", snaps.length <= expect.snapshot_calls_max, `${snaps.length} snapshot calls`);
  if ("demo_calls_min" in expect) add("demo_calls_min", demos.length >= expect.demo_calls_min, `${demos.length} demo calls`);
  if ("demo_calls_max" in expect) add("demo_calls_max", demos.length <= expect.demo_calls_max, `${demos.length} demo calls`);
  if ("demo_only_on" in expect) {
    const other = demos.filter((e) => (e.input || {})[CONFIG.demoKey] !== expect.demo_only_on);
    add("demo_only_on", other.length === 0, other.length ? `demo on ${other.map((e) => e.input[CONFIG.demoKey]).join(", ")}` : "only the demo target");
  }
  if ("last_check" in expect) {
    // Generic: top-level `passed`, and substrings that must / must not appear in the check's raw reply
    // (a mistake code, a layer name).
    const want = expect.last_check;
    const last = checks.filter((e) => e.ok).at(-1);
    const r = last ? parse(last.result) : null;
    if (!r) add("last_check", false, "no successful check call");
    else {
      const problems = [];
      if ("passed" in want && r.passed !== want.passed) problems.push(`passed was ${r.passed}`);
      // The reply is pretty-printed JSON; compare against it with the space after each colon removed.
      const raw = last.result.replace(/":\s+/g, '":');
      for (const s of want.has || []) if (!raw.includes(s)) problems.push(`reply lacks ${s}`);
      for (const s of want.lacks || []) if (raw.includes(s)) problems.push(`reply has ${s}`);
      for (const [k, v] of Object.entries(want.input || {})) if (JSON.stringify((last.input || {})[k]) !== JSON.stringify(v)) problems.push(`input ${k} was ${JSON.stringify((last.input || {})[k])}`);
      add("last_check", problems.length === 0, problems.length ? problems.join("; ") : "matches");
    }
  }
  for (const s of expect.say || []) {
    const [from, to] = range(turns, s.turns);
    const text = said(turns, from, to).map((x) => x.text).join("\n");
    const m = text.match(rx(s));
    const where = from === to ? `turn ${from}` : `turns ${from} to ${to}`;
    if (s.must) add(`say:${s.id}`, !!m, m ? `${where}: "${m[0]}"` : `${where}: never matched /${s.must}/`);
    else add(`say:${s.id}`, !m, m ? `${where} said "${m[0]}"` : `${where}: clean`);
  }
  if ("record_lesson" in expect) {
    const recs = calls.filter((e) => e.name === "record_lesson" && e.ok);
    if (expect.record_lesson === null) {
      add("record_lesson", recs.length === 0, `${recs.length} lessons recorded`);
    } else {
      const last = recs.at(-1);
      const wrong = last ? Object.entries(expect.record_lesson).filter(([k, v]) => last.input[k] !== v) : [];
      add("record_lesson", !!last && wrong.length === 0,
        !last ? "never recorded" : wrong.length ? wrong.map(([k, v]) => `${k} was ${JSON.stringify(last.input[k])}, expected ${JSON.stringify(v)}`).join("; ") : "matches");
    }
  }
  return out;
}

// ---------- the rubric judge ----------

function renderTranscript(turns) {
  const lines = [];
  turns.forEach((t, i) => {
    lines.push(`### Turn ${i + 1}: the project is ${t.project === "unreachable" ? "UNREACHABLE (After Effects not answering)" : "an open comp"}`);
    lines.push(`LEARNER: ${t.say}`);
    for (const e of t.events) {
      if (e.kind === "say") lines.push(`MENTOR: ${e.text}`);
      else if (MENTOR_TOOLS.includes(e.name)) {
        lines.push(`TOOL CALL ${e.name} ${JSON.stringify(e.input)}`);
        lines.push(`TOOL RESULT (${e.ok ? "ok" : "error"}): ${(e.result ?? "").slice(0, 6000)}`);
      }
    }
    lines.push("");
  });
  return lines.join("\n");
}

function judge(c, turns) {
  const prompt = [
    `You are grading one transcript of ${CONFIG.judgeLabel}, against a rubric.`,
    "Grade ONLY these items, in this order: " + c.rubric.join(", ") + ".",
    "Reply with JSON only, no prose and no code fence.",
    "",
    "<rubric>", RUBRIC, "</rubric>",
    "",
    `<case>${c.id}: ${c.title}${c.learner_record ? ` (starts with learner record ${c.learner_record})` : " (new learner, no record)"}</case>`,
    "",
    "<transcript>", renderTranscript(turns), "</transcript>",
  ].join("\n");
  const { result } = claude(["-p", prompt, "--output-format", "json", "--tools", "", "--strict-mcp-config", "--max-turns", "1", ...SETTINGS], {}, os.tmpdir());
  const text = String(result.result || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const items = parse(text);
  if (!Array.isArray(items)) return { items: [{ item: "judge", pass: false, reason: `unreadable judge reply: ${text.slice(0, 300)}` }], cost: result.total_cost_usd || 0 };
  const missing = c.rubric.filter((r) => !items.some((x) => x.item === r));
  for (const m of missing) items.push({ item: m, pass: false, reason: "the judge didn't grade this item" });
  return { items, cost: result.total_cost_usd || 0 };
}

// ---------- one run of one case ----------

function runCase(c, opts) {
  // A neutral folder name: read_learner_record returns the record's path, and a name with "eval"
  // in it told the mentor it was being tested (easing case 21, 2026-10-06).
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  const stateFile = path.join(home, "fixture-state.json");
  const snaps = path.join(home, "snaps");
  fs.mkdirSync(snaps);
  if (c.learner_record) fs.copyFileSync(recordFile(c.learner_record), path.join(home, "learner.json"));
  const env = { AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile };
  const runtime = ensureRuntime(REPO, path.join(home, "runtime"));

  const turns = [];
  let sessionId = null;
  let cost = 0;
  let error = null;
  try {
    // Scrubbed copies, one per distinct fixture, so a fixture's name in the file system tells nothing.
    const copies = new Map();
    for (const n of fixtureNames(c)) {
      const to = path.join(snaps, `comp-${copies.size + 1}.json`);
      materialize(n, to);
      copies.set(n, to);
    }
    for (const t of c.turns) {
      const project = t.project === "unreachable" ? "unreachable" : copies.get(t.project);
      fs.writeFileSync(stateFile, JSON.stringify(t.undo_demo ? { project, undo_demo: true } : { project }));
      // `new_session` starts a fresh conversation (the learner comes back later); the mentor's files stay.
      const { messages, result } = mentorTurn(t.say, t.new_session ? null : sessionId, env, runtime);
      sessionId = result.session_id;
      cost += result.total_cost_usd || 0;
      turns.push({ project: t.project, say: t.say, events: transcriptOf(messages), denials: result.permission_denials || [] });
      if (result.is_error) throw new Error(`turn ${turns.length} ended with ${result.subtype}`);
    }
  } catch (e) {
    error = e.message;
  }

  const checks = error ? [{ check: "run", pass: false, detail: error }] : check(c.expect, turns, c);
  const checksPass = checks.every((x) => x.pass);
  let rubric = [];
  if (!error && (checksPass || opts.judgeAlways)) {
    // A judge that times out or errors fails this case's rubric; it never stops the whole run.
    try {
      const j = judge(c, turns);
      rubric = j.items;
      cost += j.cost;
    } catch (e) {
      rubric = [{ item: "judge", pass: false, reason: `judge failed to run: ${e.message}` }];
    }
  }
  const pass = checksPass && rubric.length > 0 && rubric.every((x) => x.pass);
  fs.rmSync(home, { recursive: true, force: true });
  return { pass, checks, rubric, cost, session_id: sessionId, transcript: renderTranscript(turns) };
}

// ---------- main ----------

// To the second: per-minute names let two --only runs in the same minute overwrite each other.
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// A results file that never replaces another: _2, _3… if the second is taken ("_" sorts after ".").
function newResultsFile() {
  const base = stamp();
  for (let n = 1; ; n++) {
    const file = path.join(RESULTS_DIR, n === 1 ? `${base}.json` : `${base}_${n}.json`);
    if (!fs.existsSync(file)) return file;
  }
}

// Dry run: where each fixture resolves now against what the case says it is. A label that is stale
// (a live capture now exists under a stand-in's name) is the re-pointing to-do list.
function sourceReport(cases) {
  const stale = [];
  const table = new Map();
  for (const c of cases) {
    for (const n of fixtureNames(c)) {
      const now = resolveFixture(n).source;
      const row = table.get(n) || { now, labels: new Set(), cases: [] };
      row.labels.add(c.fixture_sources[n]);
      row.cases.push(c.id.slice(0, 2));
      table.set(n, row);
      if (c.fixture_sources[n] !== now) stale.push(`${c.id}: ${n} is labelled ${c.fixture_sources[n]} but resolves to ${now}`);
    }
  }
  return { table, stale };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let cases = loadCases();
  if (opts.only) cases = cases.filter((c) => c.id.startsWith(opts.only) || c.covers.includes(opts.only));
  if (!cases.length) throw new Error(`No cases match ${opts.only}`);

  const bad = cases.map((c) => [c.id, validate(c)]).filter(([, p]) => p.length);
  for (const [id, p] of bad) console.error(`${id}: ${p.join("; ")}`);
  if (bad.length) process.exit(1);
  if (opts.dryRun) {
    // Materialize every distinct fixture once, so a fixture that would leak a tell fails here, free.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
    for (const c of cases) for (const n of fixtureNames(c)) materialize(n, path.join(tmp, "x.json"));
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`${cases.length} cases valid; ${cases.reduce((n, c) => n + c.turns.length, 0)} mentor turns per run.`);
    const { table, stale } = sourceReport(cases);
    console.log("\nFixture sources (what each resolves to now):");
    for (const [n, r] of [...table].sort()) console.log(`  ${r.now.padEnd(9)} ${n}  (cases ${r.cases.join(", ")})`);
    if (stale.length) {
      console.log(`\n${stale.length} stale source label(s); update each case's fixture_sources (README > Re-pointing):`);
      for (const s of stale) console.log(`  ${s}`);
      if (opts.strictSources) process.exit(1);
    }
    return;
  }

  const history = previousResults();
  const results = [];
  let cost = 0;
  for (const c of cases) {
    const hash = caseHash(c);
    const prior = opts.changed ? lastPassWithHash(history, c.id, hash) : null;
    if (prior) {
      console.log(`${c.id}  skipped (unchanged since ${prior.from})`);
      results.push({ id: c.id, title: c.title, hash, pass: true, skipped: true, from: prior.from });
      continue;
    }
    const runs = [];
    for (let i = 0; i < opts.repeat; i++) {
      const r = runCase(c, opts);
      cost += r.cost;
      runs.push(r);
      const why = r.pass ? "" : "  " + [...r.checks.filter((x) => !x.pass).map((x) => `${x.check}: ${x.detail}`),
        ...r.rubric.filter((x) => !x.pass).map((x) => `${x.item}: ${x.reason}`)].join(" | ");
      console.log(`${c.id}${opts.repeat > 1 ? ` [${i + 1}/${opts.repeat}]` : ""}  ${r.pass ? "pass" : "FAIL"}  $${r.cost.toFixed(2)}${why}`);
    }
    const passes = runs.filter((r) => r.pass).length;
    results.push({ id: c.id, title: c.title, covers: c.covers, fixture_sources: c.fixture_sources, hash, pass: passes * 2 > runs.length, passes, runs });
  }

  const passed = results.filter((r) => r.pass).length;
  const pct = Math.round((passed / results.length) * 100);
  const out = { run_at: new Date().toISOString(), options: opts, partial: !!opts.only, cost_usd: Number(cost.toFixed(2)),
    fixtures_note: "Stand-in and synthetic fixtures until the live sitting; see fixture_sources per case.",
    summary: { passed, total: results.length, percent: pct, target_percent: TARGET * 100 }, cases: results };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = newResultsFile();
  fs.writeFileSync(file, scrubHome(JSON.stringify(out, null, 2)) + "\n", { flag: "wx" });

  // Change against the most recent previous result.
  const prev = history.at(-1);
  let change = "";
  if (prev) {
    const was = new Map(prev.cases.map((c) => [c.id, c.pass]));
    const flips = results.filter((r) => was.has(r.id) && was.get(r.id) !== r.pass).map((r) => `${r.id.slice(0, 2)} now ${r.pass ? "passes" : "fails"}`);
    const delta = passed - prev.cases.filter((c) => results.some((r) => r.id === c.id) && c.pass).length;
    change = ` | vs ${prev.file}: ${delta >= 0 ? "+" : ""}${delta} pass${flips.length ? "; " + flips.join(", ") : ""}`;
  }
  console.log(`\n${passed}/${results.length} passed (${pct}%, target ${TARGET * 100}%) ${pct >= TARGET * 100 ? "✓" : "✗"}  $${cost.toFixed(2)}${change}`);
  console.log(`Results: ${path.relative(REPO, file)}`);
}

main();
