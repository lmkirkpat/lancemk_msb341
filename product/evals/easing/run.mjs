#!/usr/bin/env node
// The easing eval runner (spec 002, T040; research R6). Drives headless Claude Code through each
// case in cases/, with the ae-mentor server in fixture mode so After Effects is never contacted,
// then scores it: deterministic checks first, then a rubric judge only if those pass.
// Node built-ins only.
//
//   node product/evals/easing/run.mjs                  full run
//   node product/evals/easing/run.mjs --only 07        one case (id prefix) or a code (FR-006, US2-3)
//   node product/evals/easing/run.mjs --changed        skip cases unchanged since their last pass
//   node product/evals/easing/run.mjs --repeat 3       each case 3 times; passes on a majority
//   node product/evals/easing/run.mjs --judge-always   judge even after a failed check
//   node product/evals/easing/run.mjs --dry-run        validate cases and fixtures, call nothing

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EVAL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EVAL_DIR, "..", "..", "..");
const CASES_DIR = path.join(EVAL_DIR, "cases");
const FIXTURES_DIR = path.join(EVAL_DIR, "fixtures");
const RESULTS_DIR = path.join(EVAL_DIR, "results");
const RUBRIC = fs.readFileSync(path.join(EVAL_DIR, "rubric.md"), "utf8");

const TARGET = 0.8; // SC-006
const MAX_TURNS = "12";
const TURN_TIMEOUT_MS = 5 * 60 * 1000;
const MENTOR_TOOLS = ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson"];
const PREFIX = "mcp__ae-mentor__";
// The repo's local settings may set a builder output style (Explanatory adds "★ Insight" notes).
// CLI settings outrank local ones, so every headless run here uses the default voice (usage notes,
// panel session 1: baseline results before this fix include builder notes).
const SETTINGS = ["--settings", JSON.stringify({ outputStyle: "default" })];

// ---------- arguments ----------

function parseArgs(argv) {
  const opts = { only: null, changed: false, repeat: 1, judgeAlways: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--only") opts.only = argv[++i];
    else if (a === "--changed") opts.changed = true;
    else if (a === "--repeat") opts.repeat = Math.max(1, Number(argv[++i]) || 1);
    else if (a === "--judge-always") opts.judgeAlways = true;
    else if (a === "--dry-run") opts.dryRun = true;
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

const fixtureFile = (name) => path.join(FIXTURES_DIR, `${name}.json`);

function validate(c) {
  const problems = [];
  for (const k of ["id", "title", "covers", "turns", "expect", "rubric"]) if (!(k in c)) problems.push(`missing ${k}`);
  for (const t of c.turns || []) {
    if (t.project !== "unreachable" && !fs.existsSync(fixtureFile(t.project))) problems.push(`no fixture ${t.project}`);
  }
  if (c.learner_record && !fs.existsSync(path.join(CASES_DIR, c.learner_record))) problems.push(`no learner record ${c.learner_record}`);
  const items = new Set([...RUBRIC.matchAll(/^## (R-[A-Z-]+)/gm)].map((m) => m[1]));
  for (const r of c.rubric || []) if (!items.has(r)) problems.push(`unknown rubric item ${r}`);
  const known = ["first_tool", "set_ease_max", "set_ease_min", "set_ease_only_on", "verdict", "tools_called", "last_turn_tools_not_called", "last_turn_tools_called", "record_lesson"];
  for (const k of Object.keys(c.expect || {})) if (!known.includes(k)) problems.push(`unknown expect key ${k}`);
  return problems;
}

// What a case's behavior depends on. --changed skips a case whose hash matches its last pass.
const SHARED_INPUTS = [
  ".claude/skills/ease-mentor/SKILL.md",
  "mentor/tools.mjs",
  "mentor/fixture.mjs",
  "mentor/server.mjs",
  ...fs.readdirSync(path.join(REPO, "mentor", "lib")).map((f) => `mentor/lib/${f}`),
  "product/evals/easing/rubric.md",
];

function caseHash(c) {
  const h = crypto.createHash("sha256");
  const files = [...SHARED_INPUTS.map((f) => path.join(REPO, f)), c.file];
  if (c.learner_record) files.push(path.join(CASES_DIR, c.learner_record));
  for (const t of c.turns) if (t.project !== "unreachable") files.push(fixtureFile(t.project));
  for (const f of [...new Set(files)]) h.update(f.slice(REPO.length)).update(fs.readFileSync(f));
  return h.digest("hex");
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

function claude(args, env) {
  const r = spawnSync("claude", args, {
    cwd: REPO,
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

function mentorTurn(say, sessionId, env) {
  const args = ["-p", say, "--mcp-config", ".mcp.json", "--strict-mcp-config", "--output-format", "json", "--verbose",
    "--max-turns", MAX_TURNS, "--tools", "ToolSearch", "--allowedTools", ...MENTOR_TOOLS.map((t) => PREFIX + t), ...SETTINGS];
  if (sessionId) args.push("--resume", sessionId);
  return claude(args, env);
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

const tools = (turns) => turns.flatMap((t) => t.events.filter((e) => e.kind === "tool" && MENTOR_TOOLS.includes(e.name)));
const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

function verdictOf(turn) {
  const diffs = turn.events.filter((e) => e.kind === "tool" && e.name === "diff_since_last");
  const last = diffs.at(-1);
  if (!last || !last.ok) return "none";
  const r = parse(last.result);
  if (!r || !r.comp_matches) return "none";
  return r.passed ? "pass" : "fail";
}

function check(expect, turns) {
  const out = [];
  const add = (name, pass, detail) => out.push({ check: name, pass, detail });
  const calls = tools(turns);
  const okEases = calls.filter((e) => e.name === "set_ease" && e.ok);

  if ("first_tool" in expect) {
    const first = calls[0]?.name ?? "(none)";
    add("first_tool", first === expect.first_tool, `first tool was ${first}`);
  }
  if ("set_ease_max" in expect) add("set_ease_max", okEases.length <= expect.set_ease_max, `${okEases.length} successful set_ease`);
  if ("set_ease_min" in expect) add("set_ease_min", okEases.length >= expect.set_ease_min, `${okEases.length} successful set_ease`);
  if ("set_ease_only_on" in expect) {
    const other = okEases.filter((e) => e.input.segment_id !== expect.set_ease_only_on);
    add("set_ease_only_on", other.length === 0, other.length ? `eased ${other.map((e) => e.input.segment_id).join(", ")}` : "only the demo target");
  }
  if ("verdict" in expect) {
    const v = verdictOf(turns.at(-1));
    add("verdict", v === expect.verdict, `last turn's check: ${v}`);
  }
  if ("tools_called" in expect) {
    const missing = expect.tools_called.filter((n) => !calls.some((e) => e.name === n));
    add("tools_called", missing.length === 0, missing.length ? `never called ${missing.join(", ")}` : "all called");
  }
  if ("last_turn_tools_not_called" in expect) {
    const called = expect.last_turn_tools_not_called.filter((n) => tools([turns.at(-1)]).some((e) => e.name === n));
    add("last_turn_tools_not_called", called.length === 0, called.length ? `called ${called.join(", ")}` : "none called");
  }
  // Successful calls only (spec 003, case 20: Show me again must show a frame).
  if ("last_turn_tools_called" in expect) {
    const missing = expect.last_turn_tools_called.filter((n) => !tools([turns.at(-1)]).some((e) => e.name === n && e.ok));
    add("last_turn_tools_called", missing.length === 0, missing.length ? `no successful ${missing.join(", ")} in the last turn` : "all called");
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
    lines.push(`### Turn ${i + 1}: the project is ${t.project === "unreachable" ? "UNREACHABLE (After Effects not answering)" : `fixture "${t.project}"`}`);
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
    "You are grading one transcript of an After Effects easing mentor against a rubric.",
    "Grade ONLY these items, in this order: " + c.rubric.join(", ") + ".",
    "Reply with JSON only, no prose and no code fence.",
    "",
    "<rubric>", RUBRIC, "</rubric>",
    "",
    `<case>${c.id}: ${c.title}${c.learner_record ? ` (starts with learner record ${c.learner_record})` : " (new learner, no record)"}</case>`,
    "",
    "<transcript>", renderTranscript(turns), "</transcript>",
  ].join("\n");
  const { result } = claude(["-p", prompt, "--output-format", "json", "--tools", "", "--strict-mcp-config", "--max-turns", "1", ...SETTINGS], {});
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
  // in it told the mentor it was being tested (case 21, 2026-10-06).
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  const stateFile = path.join(home, "fixture-state.json");
  if (c.learner_record) fs.copyFileSync(path.join(CASES_DIR, c.learner_record), path.join(home, "learner.json"));
  const env = { AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile };

  const turns = [];
  let sessionId = null;
  let cost = 0;
  let error = null;
  try {
    for (const t of c.turns) {
      const project = t.project === "unreachable" ? "unreachable" : fixtureFile(t.project);
      fs.writeFileSync(stateFile, JSON.stringify(t.undo_demo ? { project, undo_demo: true } : { project }));
      const { messages, result } = mentorTurn(t.say, sessionId, env);
      sessionId = result.session_id;
      cost += result.total_cost_usd || 0;
      turns.push({ project: t.project, say: t.say, events: transcriptOf(messages), denials: result.permission_denials || [] });
      if (result.is_error) throw new Error(`turn ${turns.length} ended with ${result.subtype}`);
    }
  } catch (e) {
    error = e.message;
  }

  const checks = error ? [{ check: "run", pass: false, detail: error }] : check(c.expect, turns);
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

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
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
    console.log(`${cases.length} cases valid; ${cases.reduce((n, c) => n + c.turns.length, 0)} mentor turns per run.`);
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
    results.push({ id: c.id, title: c.title, covers: c.covers, hash, pass: passes * 2 > runs.length, passes, runs });
  }

  const passed = results.filter((r) => r.pass).length;
  const pct = Math.round((passed / results.length) * 100);
  const out = { run_at: new Date().toISOString(), options: opts, partial: !!opts.only, cost_usd: Number(cost.toFixed(2)),
    summary: { passed, total: results.length, percent: pct, target_percent: TARGET * 100 }, cases: results };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${stamp()}.json`);
  fs.writeFileSync(file, scrubHome(JSON.stringify(out, null, 2)) + "\n");

  // Change against the most recent previous result (US3-3).
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
