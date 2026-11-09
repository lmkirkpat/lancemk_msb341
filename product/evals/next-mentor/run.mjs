#!/usr/bin/env node
// The next-mentor eval runner (spec 007 T032; spec 013 FR-042). Drives `/next-mentor` through each case in
// cases/ with the ae-mentor server in fixture mode, so After Effects is never contacted, then scores it:
// deterministic checks first, then a rubric judge only if those pass. Node built-ins only.
//
//   node product/evals/next-mentor/run.mjs                    every case that runs on B1 (the A-only ones are listed, not run)
//   node product/evals/next-mentor/run.mjs --only 06          one case (id prefix) or a code (RQ-16)
//   node product/evals/next-mentor/run.mjs --changed          skip cases unchanged since their last pass
//   node product/evals/next-mentor/run.mjs --repeat 3         each case 3 times; passes on a majority
//   node product/evals/next-mentor/run.mjs --judge-always     judge even after a failed check
//   node product/evals/next-mentor/run.mjs --dry-run          validate cases, records and fixtures; call nothing
//   node product/evals/next-mentor/run.mjs --runtime a        the mentor on option A (needs KNACK_EVAL_API_KEY); runs the A cases
//   node product/evals/next-mentor/run.mjs --runtime a --settings <file>   an experiment; never a baseline
//
// Which cases run where is the case's `runtimes` ("b1", "a"; default both). B1 can't hand over (spec 013
// research R6): its Yes-path cases stop at the recommendation and then run the panel's plain follow-on
// request in a fresh session, with that skill's own tool list (`turn.skill`, `turn.new_session`). The real
// hand-overs ("Yes, let's go.") run on A only.
//
// Tool lists are read from each skill's `allowed-tools` (lib/skill-tools.mjs), never kept by hand, and `Skill`
// is never passed on B1.

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as ab from "../lib/ab.mjs";
import { turnChecks, turnProblems, TURN_KEYS } from "../lib/turn-checks.mjs";

const { ensureRuntime } = createRequire(import.meta.url)("../../../panel/lib/runtime.js");

const EVAL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EVAL_DIR, "..", "..", "..");
const CASES_DIR = path.join(EVAL_DIR, "cases");
const RESULTS_DIR = path.join(EVAL_DIR, "results");
const RUBRIC = fs.readFileSync(path.join(EVAL_DIR, "rubric.md"), "utf8");

const TARGET = 0.8; // SC-006
const MAX_TURNS = "12";
const TURN_TIMEOUT_MS = 5 * 60 * 1000;
const PREFIX = "mcp__ae-mentor__";
const SETTINGS = ["--settings", JSON.stringify({ outputStyle: "default" })];

// ---------- tools, from the skills ----------

const OPENING_SKILL = "next-mentor";
const LESSON_SKILLS = ["ease-mentor", "key-types-mentor", "speed-graph-mentor", "offset-mentor", "anchor-mentor", "null-parenting-mentor"];
const SKILLS = [OPENING_SKILL, ...LESSON_SKILLS];
const SETS = Object.fromEntries(SKILLS.map((s) => [s, ab.toolSets(REPO, s)]));
// Every call the runner recognizes. `Skill` is on this list for A's transcripts only; B1 never passes it.
const MENTOR_TOOLS = [...new Set([...SKILLS.flatMap((s) => SETS[s].mentor), "Skill"])];
const HAND_OVER = "Skill";
const allowedFor = (skill) => SETS[skill].allowed.filter((t) => t !== HAND_OVER);
const DEMO_OR_CHANGE = /_demo$|^set_ease$|^record_lesson$/;

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
    else if (a === "--runtime") opts.runtime = argv[++i];
    else if (a === "--settings") opts.settings = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  return ab.checkOpts(opts);
}

// ---------- cases, fixtures and hashes ----------

function loadCases() {
  return fs
    .readdirSync(CASES_DIR)
    .filter((f) => /^\d\d-.*\.json$/.test(f))
    .sort()
    .map((f) => ({ file: path.join(CASES_DIR, f), ...JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf8")) }));
}

// Fixtures and records are paths from the repo root, so a name never depends on which folder is searched.
const repoFile = (p) => path.join(REPO, p);
const runsOn = (c, runtime) => (c.runtimes || ["b1", "a"]).includes(runtime);
const skillOfTurn = (t) => t.skill || OPENING_SKILL;

function validate(c) {
  const problems = [];
  for (const k of ["id", "title", "covers", "turns", "expect", "rubric"]) if (!(k in c)) problems.push(`missing ${k}`);
  for (const r of c.runtimes || []) if (!["b1", "a"].includes(r)) problems.push(`runtimes: "${r}" isn't b1 or a`);
  for (const t of c.turns || []) {
    if (t.project !== "unreachable" && !fs.existsSync(repoFile(t.project))) problems.push(`no fixture ${t.project}`);
    if (t.skill && !LESSON_SKILLS.includes(t.skill)) problems.push(`turn skill ${t.skill} isn't a lesson skill`);
    if (typeof t.say !== "string" || !t.say) problems.push("a turn has no say");
  }
  if (c.learner_record && !fs.existsSync(repoFile(c.learner_record))) problems.push(`no learner record ${c.learner_record}`);
  const items = new Set([...RUBRIC.matchAll(/^## (R-[A-Z0-9-]+)/gm)].map((m) => m[1]));
  for (const r of c.rubric || []) if (!items.has(r)) problems.push(`unknown rubric item ${r}`);
  const known = [...TURN_KEYS, "first_tool", "tools_called", "tools_not_called", "turn_first_tool", "reply_equals", "handover", "say"];
  for (const k of Object.keys(c.expect || {})) if (!known.includes(k)) problems.push(`unknown expect key ${k}`);
  problems.push(...turnProblems(c.expect, (c.turns || []).length));
  for (const s of (c.expect || {}).say || []) {
    if (!s.id || !(s.must || s.never)) problems.push(`say check needs an id and must or never: ${JSON.stringify(s).slice(0, 60)}`);
    try { new RegExp(s.must || s.never); } catch { problems.push(`say ${s.id}: bad regex`); }
    for (const t of Array.isArray(s.turns) ? s.turns : []) if (!Number.isInteger(t) || t < 1 || t > c.turns.length) problems.push(`say ${s.id}: turn ${t} is out of range`);
  }
  for (const r of (c.expect || {}).reply_equals || []) {
    if (!Number.isInteger(r.turn) || r.turn < 1 || r.turn > (c.turns || []).length || !r.tool || typeof r.equals !== "object") problems.push(`reply_equals needs a turn, a tool and equals: ${JSON.stringify(r).slice(0, 70)}`);
  }
  for (const h of (c.expect || {}).handover || []) {
    if (!Number.isInteger(h.turn) || h.turn < 1 || h.turn > (c.turns || []).length || !LESSON_SKILLS.includes(h.skill)) problems.push(`handover needs a turn and a lesson skill: ${JSON.stringify(h).slice(0, 70)}`);
  }
  if ((c.runtimes || []).length === 1 && c.runtimes[0] === "b1" && (c.expect || {}).handover) problems.push("a handover check can only pass on A");
  return problems;
}

// What a case's behavior depends on. --changed skips a case whose hash matches its last pass.
const SHARED_INPUTS = [
  ...SKILLS.map((s) => `.claude/skills/${s}/SKILL.md`),
  ...fs.readdirSync(path.join(REPO, "mentor", "tools")).map((f) => `mentor/tools/${f}`),
  "mentor/fixture.mjs",
  "mentor/server.mjs",
  "mentor/errors.mjs",
  "mentor/curriculum/path.json",
  ...fs.readdirSync(path.join(REPO, "mentor", "lib")).map((f) => `mentor/lib/${f}`),
  "product/evals/next-mentor/rubric.md",
  "panel/lib/runtime.js",
];

function caseHash(c, opts = {}) {
  const h = crypto.createHash("sha256");
  const files = [...SHARED_INPUTS.map((f) => path.join(REPO, f)), c.file];
  if (c.learner_record) files.push(repoFile(c.learner_record));
  for (const t of c.turns) if (t.project !== "unreachable") files.push(repoFile(t.project));
  if (opts.runtime === "a") files.push(...ab.helperHashFiles(REPO, opts.settings));
  for (const f of [...new Set(files)]) h.update(f.slice(REPO.length)).update(fs.readFileSync(f));
  h.update(opts.runtime || "b1");
  return h.digest("hex");
}

// ---------- results ----------

function scrubHome(text) {
  const home = os.homedir();
  return text.replaceAll(home, "~").replaceAll(home.replaceAll("/", "-"), "-~");
}

function previousResults() {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json")).sort()
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), "utf8")) }));
}

function lastPassWithHash(results, id, hash) {
  for (const r of [...results].reverse()) {
    const c = r.cases.find((x) => x.id === id);
    if (c && c.pass && c.hash === hash) return { ...c, from: r.file };
  }
  return null;
}

// ---------- running claude ----------

function claude(args, env, cwd) {
  const r = spawnSync("claude", args, { cwd, env: { ...process.env, ...env }, encoding: "utf8", timeout: TURN_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`claude failed to run: ${r.error.message}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    throw new Error(`claude returned no JSON (exit ${r.status}): ${(r.stderr || r.stdout).slice(0, 500)}`);
  }
  const messages = Array.isArray(parsed) ? parsed : [parsed];
  const result = messages.findLast((m) => m.type === "result");
  if (!result) throw new Error("claude output has no result message");
  return { messages, result };
}

// B1: the turn's tools are the turn's skill's own list (the panel launches each process that way).
function mentorTurn(say, skill, sessionId, env, cwd) {
  const args = ["-p", say, "--mcp-config", ".mcp.json", "--strict-mcp-config", "--output-format", "json", "--verbose",
    "--max-turns", MAX_TURNS, "--tools", "ToolSearch", "--allowedTools", ...allowedFor(skill).map((t) => PREFIX + t), ...SETTINGS];
  if (sessionId) args.push("--resume", sessionId);
  return claude(args, env, cwd);
}

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
        ev.ok = !b.is_error;
        ev.result = Array.isArray(b.content) ? b.content.filter((x) => x.type === "text").map((x) => x.text).join("\n") : String(b.content ?? "");
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
const rx = (s) => new RegExp(s.must || s.never, s.cs ? "" : "i");
const at = (o, k) => k.split(".").reduce((x, p) => (x == null ? undefined : x[p]), o);

// The learner sees every word: no field or value name from tool output, no narrated calls (agent audit
// 2026-10-12, lessons 4.3 and 4.4; next-mentor's own hard rules).
const INTERNAL_NAME = new RegExp([
  String.raw`\b[a-z]+_[a-z_]+\b`,
  String.raw`\b(?:easing|keyframes|transform|parenting|timing|motion)\.[a-z_]+\b`,
  "[\"'`](?:continue|lesson|review|next_in_path|in_progress|review_due|nothing_left)[\"'`]",
].join("|"));
const NARRATION = /\bmust (?:call|run|check|diff|snapshot|read)\b[^.]*\bfirst\b|\b(?:let me|I'll|I will|now I'll|I'm going to) (?:call|run|use|check|read|look up) (?:the )?(?:recommend|recommendation|snapshot|tool|record|learner record|check)/i;
const SYNTH_TELL = /\bsynthetic\b|\bfixture\b|\bstand-in\b|\bthe eval\b|\bthis test\b/i;

function wordsCheck(name, re, turns) {
  const hit = turns.flatMap(saysOf).map((text) => text.match(re)).find(Boolean);
  return { check: name, pass: !hit, detail: hit ? `said "${hit[0]}"` : "clean" };
}

function check(expect, turns, c) {
  const out = [wordsCheck("plain_words", INTERNAL_NAME, turns), wordsCheck("no_narration", NARRATION, turns), wordsCheck("no_test_tell", SYNTH_TELL, turns)];
  const add = (name, pass, detail) => out.push({ check: name, pass, detail });
  out.push(...turnChecks(expect, turns, MENTOR_TOOLS));
  const calls = mentorCalls(turns);

  // Every case: only the ae-mentor tools (and the hand-over tool).
  const foreign = turns.flatMap(toolEvents).filter((e) => !MENTOR_TOOLS.includes(e.name) && e.name !== "ToolSearch");
  add("only_mentor_tools", foreign.length === 0, foreign.length ? `used ${foreign.map((e) => e.name).join(", ")}` : "ok");

  // next-mentor teaches nothing and changes nothing: no demonstration, no ease, no record, in its own turns
  // (before a hand-over, on A). The lesson turns that follow may do what their skill does.
  c.turns.forEach((t, i) => {
    if (skillOfTurn(t) !== OPENING_SKILL) return;
    const evs = turns[i] ? turns[i].events : [];
    const cut = evs.findIndex((e) => e.kind === "tool" && e.name === HAND_OVER);
    const own = cut < 0 ? evs : evs.slice(0, cut);
    const bad = own.filter((e) => e.kind === "tool" && DEMO_OR_CHANGE.test(e.name));
    add(`opening_changes_nothing@${i + 1}`, bad.length === 0, bad.length ? `called ${bad.map((e) => e.name).join(", ")} in turn ${i + 1}` : "ok");
  });
  // Hard rule 4: nothing said before the turn's first tool call (the learner sees every word).
  c.turns.forEach((t, i) => {
    if (i !== 0 || skillOfTurn(t) !== OPENING_SKILL || !turns[0]) return;
    const evs = turns[0].events;
    const first = evs.findIndex((e) => e.kind === "tool");
    const before = (first < 0 ? [] : evs.slice(0, first)).filter((e) => e.kind === "say");
    add("no_text_before_first_call", before.length === 0, before.length ? `said "${before[0].text.slice(0, 60)}" before the first call` : "clean");
  });

  if ("first_tool" in expect) add("first_tool", (calls[0]?.name ?? "(none)") === expect.first_tool, `first tool was ${calls[0]?.name ?? "(none)"}`);
  if ("tools_called" in expect) {
    const missing = expect.tools_called.filter((n) => !calls.some((e) => e.name === n));
    add("tools_called", missing.length === 0, missing.length ? `never called ${missing.join(", ")}` : "all called");
  }
  if ("tools_not_called" in expect) {
    const called = expect.tools_not_called.filter((n) => calls.some((e) => e.name === n));
    add("tools_not_called", called.length === 0, called.length ? `called ${called.join(", ")}` : "none called");
  }
  // The first tool a turn calls: [{ turn, tool }].
  for (const w of expect.turn_first_tool || []) {
    const first = toolEvents(turns[w.turn - 1] || { events: [] }).find((e) => MENTOR_TOOLS.includes(e.name));
    add(`turn_first_tool@${w.turn}`, first?.name === w.tool, `turn ${w.turn}'s first tool was ${first?.name ?? "(none)"}`);
  }
  // The first successful reply of `tool` in a turn holds these values (dotted keys allowed): [{ turn, tool, equals }].
  for (const w of expect.reply_equals || []) {
    const ev = toolEvents(turns[w.turn - 1] || { events: [] }).find((e) => e.name === w.tool && e.ok);
    const r = ev ? parse(ev.result) : null;
    const wrong = !r ? [`no successful ${w.tool} reply in turn ${w.turn}`]
      : Object.entries(w.equals).filter(([k, v]) => JSON.stringify(at(r, k)) !== JSON.stringify(v)).map(([k]) => `${k} was ${JSON.stringify(at(r, k))}`);
    add(`reply_equals:${w.tool}@${w.turn}`, wrong.length === 0, wrong.length ? wrong.join("; ") : "ok");
  }
  // A: the turn handed over to this lesson skill: [{ turn, skill, args_match? }].
  for (const h of expect.handover || []) {
    const ev = toolEvents(turns[h.turn - 1] || { events: [] }).find((e) => e.name === HAND_OVER);
    const text = ev ? JSON.stringify(ev.input || {}) : "";
    const ok = !!ev && text.includes(h.skill) && (!h.args_match || new RegExp(h.args_match, "i").test(text));
    add(`handover@${h.turn}`, ok, !ev ? `no ${HAND_OVER} call in turn ${h.turn}` : ok ? `handed over: ${text.slice(0, 80)}` : `handed over with ${text.slice(0, 100)}`);
  }
  for (const s of expect.say || []) {
    const turnsOf = Array.isArray(s.turns) ? s.turns : turns.map((_, i) => i + 1);
    const text = turnsOf.flatMap((n) => (turns[n - 1] ? saysOf(turns[n - 1]) : [])).join("\n");
    const m = text.match(rx(s));
    const where = `turn${turnsOf.length > 1 ? "s" : ""} ${turnsOf.join(", ")}`;
    if (s.must) add(`say:${s.id}`, !!m, m ? `${where}: "${m[0]}"` : `${where}: never matched /${s.must}/`);
    else add(`say:${s.id}`, !m, m ? `${where} said "${m[0]}"` : `${where}: clean`);
  }
  return out;
}

// ---------- the rubric judge ----------

function renderTranscript(turns) {
  const lines = [];
  turns.forEach((t, i) => {
    lines.push(`### Turn ${i + 1}: ${t.skill === OPENING_SKILL ? "next-mentor" : t.skill}; the project is ${t.project === "unreachable" ? "UNREACHABLE (After Effects not answering)" : "an open comp"}${t.new_session ? "; a new conversation" : ""}`);
    lines.push(`LEARNER: ${t.say}`);
    for (const e of t.events) {
      if (e.kind === "say") lines.push(`MENTOR: ${e.text}`);
      else if (MENTOR_TOOLS.includes(e.name)) {
        lines.push(`TOOL CALL ${e.name} ${JSON.stringify(e.input)}`);
        lines.push(`TOOL RESULT (${e.ok ? "ok" : "error"}): ${(e.result ?? "").slice(0, 16000)}`);
      }
    }
    lines.push("");
  });
  return lines.join("\n");
}

function judge(c, turns) {
  const prompt = [
    "You are grading one transcript of an After Effects mentor that suggests which skill to learn next (and, in the later turns of some cases, the lesson that follows) against a rubric.",
    "Grade ONLY these items, in this order: " + c.rubric.join(", ") + ".",
    "Reply with JSON only, no prose and no code fence.",
    "",
    "<rubric>", RUBRIC, "</rubric>",
    "",
    `<case>${c.id}: ${c.title}${c.learner_record ? ` (starts with learner record ${path.basename(c.learner_record)})` : " (new learner, no record)"}</case>`,
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

async function runCase(c, opts) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  const stateFile = path.join(home, "fixture-state.json");
  if (c.learner_record) fs.copyFileSync(repoFile(c.learner_record), path.join(home, "learner.json"));
  const env = { AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile };
  const mentor = opts.runtime === "a" ? ab.openCase({ repo: REPO, home, env, opts }) : null;
  const runtime = mentor ? null : ensureRuntime(REPO, path.join(home, "runtime"));

  const turns = [];
  let sessionId = null;
  let cost = 0;
  let error = null;
  try {
    for (const t of c.turns) {
      if (t.new_session) sessionId = null; // a fresh conversation; the mentor's files stay
      const project = t.project === "unreachable" ? "unreachable" : repoFile(t.project);
      fs.writeFileSync(stateFile, JSON.stringify({ project }));
      const skill = skillOfTurn(t);
      if (mentor) {
        const r = await mentor.turn(t.say, !!t.new_session);
        turns.push({ project: t.project, say: t.say, skill, new_session: !!t.new_session, events: r.events, denials: [] });
        if (!r.ok) throw new Error(`turn ${turns.length} ended with ${r.error}`);
        continue;
      }
      const { messages, result } = mentorTurn(t.say, skill, sessionId, env, runtime);
      sessionId = result.session_id;
      cost += result.total_cost_usd || 0;
      turns.push({ project: t.project, say: t.say, skill, new_session: !!t.new_session, events: transcriptOf(messages), denials: result.permission_denials || [] });
      if (result.is_error) throw new Error(`turn ${turns.length} ended with ${result.subtype}`);
    }
  } catch (e) {
    error = e.message;
  }

  const fin = mentor ? await ab.closeCase({ repo: REPO, mentor, learnerTexts: c.turns.map((t) => t.say) }) : null;
  if (fin) cost += fin.cost;
  const checks = error ? [{ check: "run", pass: false, detail: error }] : check(c.expect, turns, c);
  const denied = turns.flatMap((t) => t.denials || []);
  if (!error && denied.length) checks.push({ check: "no_permission_denials", pass: false, detail: `denied ${denied.map((d) => d.tool_name).join(", ")}` });
  if (fin && (!error || !fin.allowlist.pass)) checks.push({ check: "allowlist", pass: fin.allowlist.pass, detail: fin.allowlist.detail });
  const checksPass = checks.every((x) => x.pass);
  let rubric = [];
  if (!error && (checksPass || opts.judgeAlways)) {
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
  return { pass, checks, rubric, cost, session_id: sessionId, transcript: renderTranscript(turns),
    ...(fin ? { runtime: "a", mentor_cost_usd: Number(fin.cost.toFixed(4)), judge_cost_usd: Number((cost - fin.cost).toFixed(4)), cost_unknown_turns: fin.cost_unknown_turns, other_model_turns: fin.other_model_turns, prompt_hashes: fin.prompt_hashes, allowlist: fin.allowlist, ...(fin.failed_turns ? { failed_turns: fin.failed_turns } : {}) } : {}) };
}

// ---------- main ----------

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function newResultsFile() {
  const base = stamp();
  for (let n = 1; ; n++) {
    const file = path.join(RESULTS_DIR, n === 1 ? `${base}.json` : `${base}_${n}.json`);
    if (!fs.existsSync(file)) return file;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  ab.prepareRun(opts);
  let all = loadCases();
  if (opts.only) all = all.filter((c) => c.id.startsWith(opts.only) || c.covers.includes(opts.only));
  if (!all.length) throw new Error(`No cases match ${opts.only}`);

  const bad = all.map((c) => [c.id, validate(c)]).filter(([, p]) => p.length);
  for (const [id, p] of bad) console.error(`${id}: ${p.join("; ")}`);
  if (bad.length) process.exit(1);

  const cases = all.filter((c) => runsOn(c, opts.runtime));
  const skippedHere = all.filter((c) => !runsOn(c, opts.runtime));
  for (const c of skippedHere) console.log(`${c.id}  not run on ${opts.runtime} (${(c.runtimes || []).join(", ")} only)`);
  if (!cases.length) throw new Error(`No case runs on ${opts.runtime} for ${opts.only || "this set"}`);

  if (opts.dryRun) {
    if (opts.runtime === "a") {
      const a = await ab.dryRunA({ repo: REPO, cases, opts });
      for (const l of a.lines) console.log(l);
      for (const p of a.problems) console.error(p);
      if (a.problems.length) process.exit(1);
    }
    const lessons = new Set(cases.flatMap((c) => c.turns.map(skillOfTurn)));
    console.log(`B1 tool lists (from each SKILL.md; no Skill): ${[...lessons].map((s) => `${s} ${allowedFor(s).length}`).join(", ")}`);
    console.log(`${cases.length} cases valid on ${opts.runtime} (${all.length} in the set); ${cases.reduce((n, c) => n + c.turns.length, 0)} mentor turns per run.`);
    return;
  }

  const history = previousResults();
  const results = [];
  let cost = 0;
  for (const c of cases) {
    const hash = caseHash(c, opts);
    const prior = opts.changed ? lastPassWithHash(history, c.id, hash) : null;
    if (prior) {
      console.log(`${c.id}  skipped (unchanged since ${prior.from})`);
      results.push({ id: c.id, title: c.title, hash, pass: true, skipped: true, from: prior.from });
      continue;
    }
    const runs = [];
    for (let i = 0; i < opts.repeat; i++) {
      const r = await runCase(c, opts);
      cost += r.cost;
      runs.push(r);
      const why = r.pass ? "" : "  " + [...r.checks.filter((x) => !x.pass).map((x) => `${x.check}: ${x.detail}`),
        ...r.rubric.filter((x) => !x.pass).map((x) => `${x.item}: ${x.reason}`)].join(" | ");
      console.log(`${c.id}${opts.repeat > 1 ? ` [${i + 1}/${opts.repeat}]` : ""}  ${r.pass ? "pass" : "FAIL"}  $${r.cost.toFixed(2)}${why}${!r.pass && c.known_gap && r.checks.every((x) => x.pass) ? `  [known gap, a rubric failure: ${c.known_gap}]` : ""}`);
    }
    const passes = runs.filter((r) => r.pass).length;
    results.push({ id: c.id, title: c.title, covers: c.covers, ...(c.known_gap ? { known_gap: c.known_gap } : {}), hash, pass: passes * 2 > runs.length, passes, runs });
  }

  const passed = results.filter((r) => r.pass).length;
  const pct = Math.round((passed / results.length) * 100);
  const out = { run_at: new Date().toISOString(), options: opts, partial: !!opts.only, not_run_on_runtime: skippedHere.map((c) => c.id), cost_usd: Number(cost.toFixed(2)),
    summary: { passed, total: results.length, percent: pct, target_percent: TARGET * 100 }, cases: results };
  Object.assign(out, ab.resultFields(opts, results, { resultsDir: RESULTS_DIR, readme: fs.readFileSync(path.join(EVAL_DIR, "README.md"), "utf8") }));
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = newResultsFile();
  fs.writeFileSync(file, scrubHome(JSON.stringify(out, null, 2)) + "\n", { flag: "wx" });

  const prev = history.at(-1);
  let change = "";
  if (prev) {
    const was = new Map(prev.cases.map((c) => [c.id, c.pass]));
    const flips = results.filter((r) => was.has(r.id) && was.get(r.id) !== r.pass).map((r) => `${r.id.slice(0, 2)} now ${r.pass ? "passes" : "fails"}`);
    const delta = passed - prev.cases.filter((c) => results.some((r) => r.id === c.id) && c.pass).length;
    change = ` | vs ${prev.file}: ${delta >= 0 ? "+" : ""}${delta} pass${flips.length ? "; " + flips.join(", ") : ""}`;
  }
  if (opts.runtime === "a") {
    console.log();
    ab.printSummary(out, TARGET * 100);
  } else console.log(`\n${passed}/${results.length} passed (${pct}%, target ${TARGET * 100}%) ${pct >= TARGET * 100 ? "✓" : "✗"}  $${cost.toFixed(2)}${change}`);
  console.log(`Results: ${path.relative(REPO, file)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
