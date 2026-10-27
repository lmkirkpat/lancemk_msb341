#!/usr/bin/env node
// The null-parenting eval runner (spec 012, Eval plan; modelled on product/evals/easing/run.mjs,
// copied rather than shared so easing's files stay another session's work). Drives headless
// Claude Code through each case in cases/, with the ae-mentor server in fixture mode so After
// Effects is never contacted, then scores it: deterministic checks first, then a rubric judge only
// if those pass. Node built-ins only.
//
//   node product/evals/null-parenting/run.mjs                  full run
//   node product/evals/null-parenting/run.mjs --only 07        one case (id prefix) or a code (US1-5, FR-005a)
//   node product/evals/null-parenting/run.mjs --changed        skip cases unchanged since their last pass
//   node product/evals/null-parenting/run.mjs --repeat 3       each case 3 times; passes on a majority
//   node product/evals/null-parenting/run.mjs --judge-always   judge even after a failed check
//   node product/evals/null-parenting/run.mjs --dry-run        validate cases, fixtures and their sources, call nothing
//   node product/evals/null-parenting/run.mjs --dry-run --strict-sources   also fail on a stale source label
//
// Fixtures are NOT copied into this folder. A case names a fixture the way
// mentor/test/fixtures/null-parenting/load.mjs does, and the runner finds it in the same order: a
// live capture, then spec 004's capture (read in place); "synthetic/..." and nothing else for
// synthetics. The stand-ins were deleted in T338, so the stand-in fallback below finds nothing; it is
// kept only so an old label would still be reported (see README › Fixtures).

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
const SKILL_FILE = ".claude/skills/null-parenting-mentor/SKILL.md";

// Where spec 012's saved snapshots and learner records live (the builder's folder, read only).
const FIX_DIR = path.join(REPO, "mentor", "test", "fixtures", "null-parenting");
const SPEC004_DIR = path.join(REPO, "mentor", "test", "fixtures", "layer-info");

const TARGET = 0.8; // SC-006
const MAX_TURNS = "12";
const TURN_TIMEOUT_MS = 5 * 60 * 1000;
const MENTOR_TOOLS = ["read_learner_record", "null_parent_snapshot", "null_parent_demo", "null_parent_check", "preview_frame", "record_lesson", "recommend_next"];
const PREFIX = "mcp__ae-mentor__";
const SKILL_CMD = "/null-parenting-mentor";
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

// → { file, source } for a fixture name, or null. Same order as mentor/test/fixtures/null-parenting/
// load.mjs: "synthetic/…" is permanent; otherwise a live capture, spec 004's capture, then the
// stand-in. `source` is what the file is: "synthetic", "live" or "stand-in".
function resolveFixture(name) {
  if (name.startsWith("synthetic/")) {
    const f = path.join(FIX_DIR, name);
    return fs.existsSync(f) ? { file: f, source: "synthetic" } : null;
  }
  for (const [dir, source] of [[FIX_DIR, "live"], [SPEC004_DIR, "live"], [path.join(FIX_DIR, "stand-in"), "stand-in"]]) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) return { file: f, source };
  }
  return null;
}

const recordFile = (name) => path.join(FIX_DIR, "records", name);
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
  const known = ["first_tool", "tools_called", "tools_not_called", "snapshot_with", "snapshot_focus_excludes", "no_focus_set", "demo_calls_min", "demo_calls_max", "demo_only_on",
    "demo_after_null_ready", "last_check", "chain_on_purpose_from_turn", "say", "record_lesson", "record_lesson_never", "preview_times_from_output", "review_mode"];
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
  "product/evals/null-parenting/rubric.md",
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

// The fixture as the mentor sees it. The builder's files carry notes for people (a `synthetic`
// field) and the synthetic comp's own project and comp names, which tell the model it is being
// tested (the "fixture tell", usage notes 2026-10-06); none of that reaches a run. Stand-ins and
// live captures already use the real project name, so only the synthetic names are renamed.
const SYNTHETIC_NAMES = { project: ["Synthetic.aep", "Lower Thirds.aep"], comp: ["Synthetic Group", "Lower Thirds"] };

function materialize(name, to) {
  const snap = JSON.parse(fs.readFileSync(resolveFixture(name).file, "utf8"));
  delete snap.synthetic;
  if (snap.project === SYNTHETIC_NAMES.project[0]) snap.project = SYNTHETIC_NAMES.project[1];
  if (snap.comp && snap.comp.name === SYNTHETIC_NAMES.comp[0]) snap.comp.name = SYNTHETIC_NAMES.comp[1];
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
    "--max-turns", MAX_TURNS, "--tools", "ToolSearch", "--allowedTools", ...MENTOR_TOOLS.map((t) => PREFIX + t), ...SETTINGS];
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
  String.raw`\bparenting\.null\b|\btransform\.anchor\b|\beasing\.basic\b`,
  String.raw`\bparent\/[A-Z]`, // target IDs
  "[\"'`](?:top-left|top-center|top-right|middle-left|middle-right|bottom-left|bottom-center|bottom-right|center|continued|resumed|passed|partial|not_checked)[\"'`]",
].join("|"));
const NARRATION = /\bmust (?:call|run|check|diff|snapshot|read)\b[^.]*\bfirst\b|\b(?:let me|I'll|I will|now I'll) (?:call|run|use) (?:the )?(?:check|snapshot|diff|tool|null_parent)/i;
// "Never say 1 pixel or any number as a target" (SKILL.md). A distance to a layer that jumped is
// fine ("120 px to the left"); a tolerance isn't ("within 1 px", "a pixel off is ok").
const PIXEL_TARGET = /\b(?:1|one|a single)[- ]?(?:px|pixel)\b|\bwithin (?:a |an? )?(?:few )?(?:px|pixels?)\b|\b(?:tolerance|threshold)\b/i;
// A keyboard shortcut: the skill quotes none until live check L-1 (spec 012 FR-023), and "Edit > Undo"
// is the only way to reverse.
const SHORTCUT = /\b(?:cmd|command|ctrl|control|shift|option|alt|opt)\s*\+\s*[a-z0-9]|\bshift\s*\+?\s*f4\b/i;
// Never advise holding Option or Shift while parenting (SKILL.md, L-1 at 26.5: Option keeps the
// layer's raw values and it jumps; Shift moves it onto the null). Saying what a key does, or that no
// key should be held, is fine; telling the learner to hold one is not.
const MODIFIER_ADVICE = /\b(?:hold|holding|press|pressing|use|using|try|add|with)\s+(?:down\s+)?(?:the\s+)?(?:option|alt|shift|opt)\b/i;
const NEGATED = /n['\u2019]t\b|\bnot\b|\bnever\b|\bno key\b|\bwithout\b|\binstead of\b/i;
const MATTE_HIDDEN = /matte[^.]*\bhidden\b|\bhidden\b[^.]*matte/i;
const SYNTH_TELL = /\bsynthetic\b|\bfixture\b|\bstand-in\b|\bthe eval\b|\bthis test\b/i;
const METHOD_WORDS = /pick ?whip|parent column|parent & link|layer\s*>\s*new|null object|drag (?:it|them|the)|\bshift\+|\boption\+|\bhold(?:ing)? (?:a |any |the |down )?(?:key|option|shift)\b|\bkey (?:held|to hold)\b/i;
const RECORD_METHOD = /pick ?whip|\bbecause\b|\bso that\b|tolerance|threshold|\b1 ?px\b|which key|which pick/i;

function said(turns, from = 1, to = turns.length) {
  return turns.slice(from - 1, to).flatMap((t) => saysOf(t).map((text) => ({ text })));
}

// Like wordsCheck, but a sentence that negates the advice ("never hold Option") passes.
function adviceCheck(name, re, turns) {
  const hit = said(turns).flatMap((s) => s.text.split(/(?<=[.?!])\s+/)).find((sentence) => re.test(sentence) && !NEGATED.test(sentence));
  return { check: name, pass: !hit, detail: hit ? `said "${hit.slice(0, 80)}"` : "clean" };
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

// The turn (1-based) and event position of the first null_parent_check that passed, or null.
function firstPass(turns) {
  for (let i = 0; i < turns.length; i++) {
    const ev = toolEvents(turns[i]).find((e) => e.name === "null_parent_check" && e.ok && (parse(e.result) || {}).passed === true);
    if (ev) return { turn: i + 1, event: ev };
  }
  return null;
}

function check(expect, turns, c) {
  const out = [
    wordsCheck("plain_words", INTERNAL_NAME, turns),
    wordsCheck("no_narration", NARRATION, turns),
    wordsCheck("no_pixel_target", PIXEL_TARGET, turns),
    wordsCheck("no_shortcuts", SHORTCUT, turns),
    adviceCheck("no_modifier_advice", MODIFIER_ADVICE, turns),
    wordsCheck("matte_not_hidden", MATTE_HIDDEN, turns),
    wordsCheck("no_test_tell", SYNTH_TELL, turns),
  ];
  const add = (name, pass, detail) => out.push({ check: name, pass, detail });
  const calls = mentorCalls(turns);
  const demos = calls.filter((e) => e.name === "null_parent_demo");
  const checks = calls.filter((e) => e.name === "null_parent_check");
  const snaps = calls.filter((e) => e.name === "null_parent_snapshot");

  // Every case: only the ae-mentor tools, at most one demo (attempted), none in a review.
  const foreign = turns.flatMap(toolEvents).filter((e) => !MENTOR_TOOLS.includes(e.name) && e.name !== "ToolSearch");
  add("only_mentor_tools", foreign.length === 0, foreign.length ? `used ${foreign.map((e) => e.name).join(", ")}` : "ok");
  add("demo_at_most_once", demos.length <= 1, `${demos.length} demo calls`);
  const reviewMode = snaps.some((e) => e.input && e.input.mode === "review");
  if (reviewMode) {
    add("review_no_demo", demos.length === 0, `${demos.length} demo calls in a review`);
    // SC-004: "null" is said 0 times before a pass, and no method either (SKILL.md › The review).
    const pass = firstPass(turns);
    let hit = null;
    let methodHit = null;
    let seenPass = false;
    for (const t of turns) {
      for (const e of t.events) {
        if (pass && e === pass.event) seenPass = true;
        if (e.kind !== "say" || seenPass) continue;
        hit = hit || (e.text.match(/\bnull\b/i) || [])[0];
        methodHit = methodHit || (e.text.match(METHOD_WORDS) || [])[0];
      }
    }
    add("review_no_null_before_pass", !hit, hit ? `said "${hit}" before a pass` : "0 uses before a pass");
    add("review_no_method_before_pass", !methodHit, methodHit ? `said "${methodHit}" before a pass` : "clean");
  } else if ("review_mode" in expect) {
    add("review_mode", false, "no null_parent_snapshot call used mode review");
  }
  // The record never holds method or motive (SKILL.md step 11; agent audit).
  for (const r of calls.filter((e) => e.name === "record_lesson" && e.ok)) {
    const text = [r.input.summary, r.input.attempted, r.input.next].filter(Boolean).join(" | ");
    const m = text.match(RECORD_METHOD);
    add("record_plain", !m, m ? `record says "${m[0]}"` : "clean");
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
    add("snapshot_with", ok, ok ? "ok" : `no null_parent_snapshot call with ${JSON.stringify(want)}`);
  }
  if ("snapshot_focus_excludes" in expect) {
    // A review never re-proposes an earlier lesson's layers (they are refused, SKILL.md step 1).
    const bad = snaps.flatMap((e) => ((e.input && e.input.skill_options && e.input.skill_options.focus) || []).filter((n) => expect.snapshot_focus_excludes.includes(n)));
    add("snapshot_focus_excludes", bad.length === 0, bad.length ? `focus included ${[...new Set(bad)].join(", ")}` : "none of the earlier group");
  }
  if (expect.no_focus_set) {
    const withFocus = snaps.filter((e) => e.input && e.input.skill_options && Array.isArray(e.input.skill_options.focus) && e.input.skill_options.focus.length);
    add("no_focus_set", withFocus.length === 0, withFocus.length ? `set a focus: ${JSON.stringify(withFocus[0].input.skill_options.focus)}` : "no focus set");
  }
  if ("demo_calls_min" in expect) add("demo_calls_min", demos.length >= expect.demo_calls_min, `${demos.length} demo calls`);
  if ("demo_calls_max" in expect) add("demo_calls_max", demos.length <= expect.demo_calls_max, `${demos.length} demo calls`);
  if ("demo_only_on" in expect) {
    const other = demos.filter((e) => (e.input || {}).target !== expect.demo_only_on);
    add("demo_only_on", other.length === 0, other.length ? `demo on ${other.map((e) => e.input.target).join(", ")}` : "only the demo target");
  }
  if (expect.demo_after_null_ready) {
    // No demonstration before the null passes: some check with the null ready comes before the demo call.
    let ready = false;
    let early = null;
    for (const e of turns.flatMap(toolEvents)) {
      if (e.name === "null_parent_check" && e.ok && ((parse(e.result) || {}).codes || []).includes("null_ready")) ready = true;
      if (e.name === "null_parent_demo" && !ready && !early) early = e;
    }
    add("demo_after_null_ready", !early, early ? "demo called before any check showed the null ready" : "ok");
  }
  if ("last_check" in expect) {
    const want = expect.last_check;
    const last = checks.filter((e) => e.ok).at(-1);
    const r = last ? parse(last.result) : null;
    if (!r) add("last_check", false, "no successful null_parent_check call");
    else {
      const problems = [];
      if ("passed" in want && r.passed !== want.passed) problems.push(`passed was ${r.passed}`);
      if ("parenting_passed" in want && r.parenting_passed !== want.parenting_passed) problems.push(`parenting_passed was ${r.parenting_passed}`);
      for (const code of want.codes_include || []) if (!(r.codes || []).includes(code)) problems.push(`missing code ${code} (had ${(r.codes || []).join(",") || "none"})`);
      for (const code of want.codes_exclude || []) if ((r.codes || []).includes(code)) problems.push(`unexpected code ${code}`);
      if ("region" in want && (last.input || {}).region !== want.region) problems.push(`region was ${JSON.stringify((last.input || {}).region)}`);
      add("last_check", problems.length === 0, problems.length ? problems.join("; ") : "matches");
    }
  }
  if ("chain_on_purpose_from_turn" in expect) {
    // The model passes the flag only after the learner says it's on purpose (SKILL.md › hints).
    const from = expect.chain_on_purpose_from_turn;
    const early = turns.slice(0, from - 1).flatMap((t) => toolEvents(t).filter((e) => e.name === "null_parent_check" && e.input && e.input.chain_on_purpose));
    const late = turns.slice(from - 1).flatMap((t) => toolEvents(t).filter((e) => e.name === "null_parent_check" && e.input && e.input.chain_on_purpose));
    add("chain_on_purpose_from_turn", early.length === 0 && late.length > 0,
      early.length ? `passed chain_on_purpose before turn ${from}` : late.length ? "only after the learner said so" : `never passed it from turn ${from}`);
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
  if (expect.preview_times_from_output) {
    // No preview_frame at a time that no earlier tool result held (other than a call with no time).
    // A time "appears" if any number in an earlier result equals it. before_time is in the snapshot.
    const seen = [];
    const bad = [];
    for (const e of turns.flatMap(toolEvents)) {
      if (e.name === "preview_frame" && e.input && typeof e.input.time === "number") {
        if (!seen.some((n) => Math.abs(n - e.input.time) < 0.0005)) bad.push(e.input.time);
      }
      if (MENTOR_TOOLS.includes(e.name)) for (const m of String(e.result ?? "").matchAll(/-?\d+(?:\.\d+)?/g)) seen.push(parseFloat(m[0]));
    }
    add("preview_times_from_output", bad.length === 0, bad.length ? `preview_frame at ${bad.join(", ")}, in no tool output so far` : "every preview time came from a tool output");
  }
  if (expect.record_lesson_never) {
    // Regexes (case-insensitive) that a field of the last record_lesson must not match: { field: regex }.
    const last = calls.filter((e) => e.name === "record_lesson" && e.ok).at(-1);
    if (!last) add("record_lesson_never", false, "never recorded");
    else {
      const hits = Object.entries(expect.record_lesson_never).flatMap(([k, v]) => {
        const m = String(last.input[k] ?? "").match(new RegExp(v, "i"));
        return m ? [`${k} says "${m[0]}"`] : [];
      });
      add("record_lesson_never", hits.length === 0, hits.length ? hits.join("; ") : "clean");
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
    "You are grading one transcript of an After Effects mentor that teaches moving a group of layers with a null (parenting), against a rubric.",
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
      const { messages, result } = mentorTurn(t.say, sessionId, env, runtime);
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
      console.log(`\n${stale.length} stale source label(s); update each case's fixture_sources (README › Re-pointing):`);
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
    fixtures_note: "Stand-in and synthetic fixtures until the sitting (tasks T338); see fixture_sources per case.",
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
