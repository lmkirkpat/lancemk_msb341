#!/usr/bin/env node
// The ask eval runner (spec 014 T031; FR-061). Drives `/ask-mentor` through each case in cases/ with the
// ae-mentor server in fixture mode, so After Effects is never contacted, then scores it: deterministic
// checks first (checks.mjs), then a rubric judge only if those pass. Node built-ins only.
//
//   node product/evals/ask/run.mjs                    every case that runs on B1
//   node product/evals/ask/run.mjs --only 06          one case (id prefix); `--only 0` is 01 to 09, `--only 1` 10 to 17
//   node product/evals/ask/run.mjs --changed          skip cases unchanged since their last pass
//   node product/evals/ask/run.mjs --repeat 3         each case 3 times; passes on a majority
//   node product/evals/ask/run.mjs --judge-always     judge even after a failed check
//   node product/evals/ask/run.mjs --dry-run          validate cases, records, fixtures and rubric; call nothing
//   node product/evals/ask/run.mjs --runtime a        the mentor on option A (needs KNACK_EVAL_API_KEY)
//   node product/evals/ask/run.mjs --runtime a --settings <file>   an experiment; never a baseline
//
// What is different from the lesson sets:
// - The skill under test is one constant, ASK_SKILL, and its tool list is read from its SKILL.md
//   (lib/skill-tools.mjs). The skill isn't built until spec 014 T014, so a dry run falls back to the
//   contract's tool list (contracts/ask-tools.md) and says so; a real run refuses to start without it.
// - Every turn is sent as `/ask-mentor <question>`, as the panel sends it (contracts/panel-ask.md).
// - The answer is the `give_answer` call (research R2): the judge reads it rebuilt from the call, never
//   free prose, and `answer_prose_empty` fails a turn that also wrote words.
// - Checks tagged `runtimes: ["a"]` (and cases with `runtimes`) run on A only: B1 strips offered skills
//   (FR-017), so no case expects an offer or a Go deeper on B1.
// - Each run records its refusals: `give_answer` calls the tool refused, with the code (plan > Risks: a
//   guard that fires on more than 1 in 10 good answers gets loosened).

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { parseJudgeReply } from "../lib/judge-reply.mjs";
import * as ab from "../lib/ab.mjs";
import { askChecks, answerOf, answerCalls, answerCallCount, refusalsOf, renderAnswer, fixtureFacts } from "./checks.mjs";

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

// ---------- the skill under test and its tools ----------

const ASK_SKILL = "ask-mentor"; // the one place the skill's name is kept (the call below must spell it out: ready-for-a.mjs greps for it)
const HAND_OVER = "Skill";
// contracts/ask-tools.md: `ask-mentor`'s allowed-tools (FR-057). Used only until SKILL.md exists, and only for a dry run.
const CONTRACT_TOOLS = ["describe_layers", "preview_frame", "give_answer", "go_deeper", "note_said", HAND_OVER];

function loadToolSet() {
  try {
    return { ...ab.toolSets(REPO, "ask-mentor"), fromSkill: true };
  } catch (e) {
    return { mentor: CONTRACT_TOOLS, allowed: CONTRACT_TOOLS, fromSkill: false, why: e.message };
  }
}
const TOOLS = loadToolSet();
// Everything the runner recognizes as a mentor call; `Skill` appears in A's transcripts only.
const MENTOR_TOOLS = [...new Set([...TOOLS.mentor, ...CONTRACT_TOOLS])];
// What a phase-1 ask turn may call: the reads and the answer. The hand-over tools belong to phase 2, and this
// set never says yes, so a call to one is a lesson started without a yes (`no_lesson_started`).
const ASK_ALLOWED = ["describe_layers", "preview_frame", "give_answer"];
const allowedB1 = () => TOOLS.allowed.filter((t) => t !== HAND_OVER);

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

const repoFile = (p) => path.join(REPO, p);
const runsOn = (c, runtime) => (c.runtimes || ["b1", "a"]).includes(runtime);
const readJson = (p) => JSON.parse(fs.readFileSync(repoFile(p), "utf8"));
const factsOf = (c) => c.turns.map((t) => (t.project === "unreachable" || !fs.existsSync(repoFile(t.project)) ? {} : fixtureFacts(readJson(t.project))));

const EXPECT_KEYS = ["answers", "no_answer_turns", "turn_first_tool", "tools_called", "tools_not_called", "text", "prose_max_sentences"];
const ANSWER_KEYS = ["turn", "kind", "steps", "no_keyframe_skills", "step_skills_include", "step_skills_forbid", "offered_equals", "step_on_layer", "max_sentences", "step_order"];

function validate(c) {
  const problems = [];
  for (const k of ["id", "title", "covers", "turns", "expect", "rubric"]) if (!(k in c)) problems.push(`missing ${k}`);
  for (const r of c.runtimes || []) if (!["b1", "a"].includes(r)) problems.push(`runtimes: "${r}" isn't b1 or a`);
  const n = (c.turns || []).length;
  for (const t of c.turns || []) {
    if (t.project !== "unreachable" && !fs.existsSync(repoFile(t.project))) problems.push(`no fixture ${t.project}`);
    if (typeof t.say !== "string" || !t.say) problems.push("a turn has no say");
    else if (!/^\/ask-mentor /.test(t.say) && !t.followup) problems.push(`turn "${t.say.slice(0, 30)}" doesn't start with /ask-mentor (a follow-up turn says "followup": true)`);
  }
  if (c.learner_record && !fs.existsSync(repoFile(c.learner_record))) problems.push(`no learner record ${c.learner_record}`);
  const items = new Set([...RUBRIC.matchAll(/^## (R-[A-Z0-9-]+)/gm)].map((m) => m[1]));
  for (const r of c.rubric || []) if (!items.has(r)) problems.push(`unknown rubric item ${r}`);
  const e = c.expect || {};
  for (const k of Object.keys(e)) if (!EXPECT_KEYS.includes(k)) problems.push(`unknown expect key ${k}`);
  const inRange = (t, what) => { if (!Number.isInteger(t) || t < 1 || t > n) problems.push(`${what}: turn ${t} is out of range`); };
  for (const a of e.answers || []) {
    inRange(a.turn, "answers");
    for (const k of Object.keys(a)) if (!ANSWER_KEYS.includes(k)) problems.push(`answers@${a.turn}: unknown key ${k}`);
    if (!a.kind) problems.push(`answers@${a.turn}: no kind`);
  }
  for (const t of e.no_answer_turns || []) inRange(t, "no_answer_turns");
  for (const w of e.turn_first_tool || []) inRange(w.turn, "turn_first_tool");
  for (const s of e.text || []) {
    if (!s.id || !(s.must || s.never)) problems.push(`text check needs an id and must or never: ${JSON.stringify(s).slice(0, 60)}`);
    try { new RegExp(s.must || s.never); } catch { problems.push(`text ${s.id}: bad regex`); }
    for (const t of Array.isArray(s.turns) ? s.turns : []) inRange(t, `text ${s.id}`);
    if (s.in && !["all", "explanation", "steps", "offer", "prose"].includes(s.in)) problems.push(`text ${s.id}: in "${s.in}"`);
    for (const r of s.runtimes || []) if (!["b1", "a"].includes(r)) problems.push(`text ${s.id}: runtimes "${r}"`);
  }
  for (const s of e.prose_max_sentences || []) {
    if (!s.id || !Number.isInteger(s.max) || !Array.isArray(s.turns)) problems.push("prose_max_sentences needs an id, turns and max");
    for (const t of s.turns || []) inRange(t, `prose_max_sentences ${s.id}`);
  }
  const facts = factsOf(c);
  facts.forEach((f, i) => { for (const p of f.problems || []) problems.push(`fixture of turn ${i + 1}: ${p}`); });
  // A layer a check names must be in that turn's fixture.
  for (const a of e.answers || []) {
    const f = facts[a.turn - 1] || {};
    if (a.step_on_layer && !(f.layers || []).includes(a.step_on_layer)) problems.push(`answers@${a.turn}: step_on_layer ${a.step_on_layer} isn't in the fixture`);
  }
  // B1 never offers (FR-017): an offer check means something on A only.
  if ((c.runtimes || []).length === 1 && c.runtimes[0] === "b1" && (e.answers || []).some((a) => a.offered_equals)) problems.push("offered_equals can only pass on A");
  return problems;
}

// What a case's behavior depends on. --changed skips a case whose hash matches its last pass.
const exists = (f) => fs.existsSync(path.join(REPO, f));
const SHARED_INPUTS = [
  `.claude/skills/${ASK_SKILL}/SKILL.md`,
  ...fs.readdirSync(path.join(REPO, "mentor", "tools")).map((f) => `mentor/tools/${f}`),
  "mentor/fixture.mjs",
  "mentor/server.mjs",
  "mentor/errors.mjs",
  "mentor/curriculum/path.json",
  ...fs.readdirSync(path.join(REPO, "mentor", "lib")).map((f) => `mentor/lib/${f}`),
  "product/evals/ask/rubric.md",
  "product/evals/ask/checks.mjs",
  "panel/lib/runtime.js",
].filter(exists);

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

// B1: the turn's tools are the ask skill's own list (the panel launches the process that way).
function mentorTurn(say, sessionId, env, cwd) {
  const args = ["-p", say, "--mcp-config", ".mcp.json", "--strict-mcp-config", "--output-format", "json", "--verbose",
    "--max-turns", MAX_TURNS, "--tools", "ToolSearch", "--allowedTools", ...allowedB1().map((t) => PREFIX + t), ...SETTINGS];
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

// ---------- the rubric judge ----------

function renderTranscript(turns, runtime) {
  const lines = [];
  turns.forEach((t, i) => {
    lines.push(`### Turn ${i + 1}: the open comp is ${t.project === "unreachable" ? "UNREACHABLE (After Effects not answering)" : "readable"}${t.new_session ? "; a new conversation" : ""}`);
    lines.push(`LEARNER: ${t.say.replace(/^\/ask-mentor /, "")}`);
    const calls = answerCalls(t);
    for (const e of t.events) {
      if (e.kind === "say") lines.push(`MENTOR PROSE${calls.calls.length ? " (in an answer turn this is a slip; the learner sees only the answer)" : ""}: ${e.text}`);
      else if (e.name === "give_answer") continue; // rebuilt below, never the raw call
      else if (MENTOR_TOOLS.includes(e.name)) {
        lines.push(`TOOL CALL ${e.name} ${JSON.stringify(e.input)}`);
        lines.push(`TOOL RESULT (${e.ok ? "ok" : "error"}): ${(e.result ?? "").slice(0, 14000)}`);
      }
    }
    if (calls.refused.length) lines.push(`(the answer tool refused ${calls.refused.length} earlier attempt(s): ${calls.refused.map((r) => r.code).join(", ")})`);
    if (calls.calls.length) lines.push(renderAnswer(answerOf(t), runtime));
    lines.push("");
  });
  return lines.join("\n");
}

function judge(c, turns, runtime) {
  const prompt = [
    "You are grading one transcript of an After Effects mentor that answers a learner's question about their own open comp (\"ask mode\") against a rubric.",
    "The mentor's answer is delivered through an answer tool; what the learner reads is the ANSWER block rebuilt from that call, with the steps drawn by the panel from the step data. Tool results are the truth about the comp. Grade ONLY these items, in this order: " + c.rubric.join(", ") + ".",
    "Reply with JSON only, no prose and no code fence.",
    "",
    "<rubric>", RUBRIC, "</rubric>",
    "",
    `<case>${c.id}: ${c.title}${c.learner_record ? ` (starts with learner record ${path.basename(c.learner_record)})` : " (new learner, no record)"}; runtime ${runtime}</case>`,
    "",
    "<transcript>", renderTranscript(turns, runtime), "</transcript>",
  ].join("\n");
  const { result } = claude(["-p", prompt, "--output-format", "json", "--tools", "", "--strict-mcp-config", "--max-turns", "1", ...SETTINGS], {}, os.tmpdir());
  const text = String(result.result || "").trim();
  const items = parseJudgeReply(text);
  if (!items) return { items: [{ item: "judge", pass: false, reason: `unreadable judge reply: ${text.slice(0, 300)}` }], plumbing: true, cost: result.total_cost_usd || 0 };
  const missing = c.rubric.filter((r) => !items.some((x) => x.item === r));
  for (const m of missing) items.push({ item: m, pass: false, reason: "the judge didn't grade this item" });
  return { items, cost: result.total_cost_usd || 0 };
}

// ---------- one run of one case ----------

const readRecord = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };

async function runCase(c, opts) {
  if (!TOOLS.fromSkill) throw new Error(`${ASK_SKILL} isn't built yet: ${TOOLS.why}`);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  const stateFile = path.join(home, "fixture-state.json");
  const startRecord = c.learner_record ? readJson(c.learner_record) : null;
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
      if (t.new_session) sessionId = null;
      const project = t.project === "unreachable" ? "unreachable" : repoFile(t.project);
      fs.writeFileSync(stateFile, JSON.stringify({ project }));
      if (mentor) {
        const r = await mentor.turn(t.say, !!t.new_session);
        turns.push({ project: t.project, say: t.say, new_session: !!t.new_session, events: r.events, denials: [] });
        if (!r.ok) throw new Error(`turn ${turns.length} ended with ${r.error}`);
        continue;
      }
      const { messages, result } = mentorTurn(t.say, sessionId, env, runtime);
      sessionId = result.session_id;
      cost += result.total_cost_usd || 0;
      turns.push({ project: t.project, say: t.say, new_session: !!t.new_session, events: transcriptOf(messages), denials: result.permission_denials || [] });
      if (result.is_error) throw new Error(`turn ${turns.length} ended with ${result.subtype}`);
    }
  } catch (e) {
    error = e.message;
  }

  const fin = mentor ? await ab.closeCase({ repo: REPO, mentor, learnerTexts: c.turns.map((t) => t.say) }) : null;
  if (fin) cost += fin.cost;
  const rt = opts.runtime || "b1";
  const record = { start: startRecord, end: readRecord(path.join(home, "learner.json")) };
  const checks = error ? [{ check: "run", pass: false, detail: error }]
    : askChecks(c.expect, { turns, c, runtime: rt, fixtures: factsOf(c), record, allowed: ASK_ALLOWED });
  const denied = turns.flatMap((t) => t.denials || []);
  if (!error && denied.length) checks.push({ check: "no_permission_denials", pass: false, detail: `denied ${denied.map((d) => d.tool_name).join(", ")}` });
  if (fin && (!error || !fin.allowlist.pass)) checks.push({ check: "allowlist", pass: fin.allowlist.pass, detail: fin.allowlist.detail });
  const checksPass = checks.filter((x) => !x.warn).every((x) => x.pass);
  let rubric = [];
  let plumbing = false;
  if (!error && (checksPass || opts.judgeAlways)) {
    try {
      const j = judge(c, turns, rt);
      rubric = j.items;
      plumbing = !!j.plumbing;
      cost += j.cost;
    } catch (e) {
      rubric = [{ item: "judge", pass: false, reason: `judge failed to run: ${e.message}` }];
    }
  }
  const pass = !plumbing && checksPass && rubric.length > 0 && rubric.every((x) => x.pass);
  const refusals = refusalsOf(turns);
  const transcript = renderTranscript(turns, rt);
  fs.rmSync(home, { recursive: true, force: true });
  return { pass, ...(plumbing ? { plumbing: "judge reply unreadable" } : {}), checks, rubric, cost, session_id: sessionId,
    answer_calls: answerCallCount(turns), refusals, transcript,
    ...(fin ? { runtime: "a", mentor_cost_usd: Number(fin.cost.toFixed(4)), judge_cost_usd: Number((cost - fin.cost).toFixed(4)), cost_unknown_turns: fin.cost_unknown_turns, other_model_turns: fin.other_model_turns, prompt_hashes: fin.prompt_hashes, allowlist: fin.allowlist, ...(fin.failed_turns ? { failed_turns: fin.failed_turns } : {}), ...(fin.request_timing ? { request_timing: fin.request_timing } : {}), ...(fin.request_events ? { request_events: fin.request_events } : {}) } : {}) };
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
    const pending = !TOOLS.fromSkill;
    if (opts.runtime === "a") {
      // The skill isn't built until T014: its missing SKILL.md is pending, not a failure; everything else is.
      const a = await ab.dryRunA({ repo: REPO, cases, opts });
      const missing = new RegExp(`^skill ${ASK_SKILL}: no readable SKILL\\.md$`);
      const isPending = (p) => pending && missing.test(p);
      for (const l of a.lines) console.log(l);
      for (const p of a.problems) console.error(isPending(p) ? `PENDING  ${p} (spec 014 T014)` : p);
      if (a.problems.some((p) => !isPending(p))) process.exit(1);
    }
    for (const c of cases) {
      const facts = factsOf(c);
      for (const a of c.expect.answers || []) {
        for (const o of a.step_order || []) {
          if (o.needs_sweeps && !(facts[a.turn - 1] || {}).sweeps) console.log(`${c.id}  step_order "${o.id}" is inactive: ${c.turns[a.turn - 1].project} has no expression sweeps (they arrive with spec 015 T015's live capture)`);
        }
      }
    }
    console.log(pending
      ? `PENDING  ${ASK_SKILL}'s SKILL.md isn't there yet (spec 014 T014), so B1's tool list is the contract's: ${CONTRACT_TOOLS.filter((t) => t !== HAND_OVER).join(", ")}`
      : `B1 tool list (from ${ASK_SKILL}/SKILL.md; no Skill): ${allowedB1().join(", ")}`);
    console.log(`fixtures: ${[...new Set(cases.flatMap((c) => c.turns.map((t) => path.basename(t.project))))].join(", ")}`);
    console.log(`${cases.length} cases valid on ${opts.runtime} (${all.length} in the set); ${cases.reduce((n, c) => n + c.turns.length, 0)} mentor turns per run.`);
    return;
  }

  const history = previousResults();
  const results = [];
  let cost = 0;
  let answerTotal = 0;
  let refusedTotal = 0;
  const byCode = {};
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
      answerTotal += r.answer_calls;
      refusedTotal += r.refusals.length;
      for (const f of r.refusals) byCode[f.code] = (byCode[f.code] || 0) + 1;
      runs.push(r);
      const why = r.pass ? "" : "  " + [...r.checks.filter((x) => !x.pass && !x.warn).map((x) => `${x.check}: ${x.detail}`),
        ...r.rubric.filter((x) => !x.pass).map((x) => `${x.item}: ${x.reason}`)].join(" | ");
      const warns = r.checks.filter((x) => x.warn).map((x) => `${x.check}: ${x.detail}`);
      console.log(`${c.id}${opts.repeat > 1 ? ` [${i + 1}/${opts.repeat}]` : ""}  ${r.pass ? "pass" : r.plumbing ? "PLUMBING" : "FAIL"}  $${r.cost.toFixed(2)}  refused ${r.refusals.length}/${r.answer_calls}${why}${warns.length ? `  [warn: ${warns.join(" | ")}]` : ""}`);
    }
    const passes = runs.filter((r) => r.pass).length;
    const valid = runs.filter((r) => !r.plumbing).length;
    results.push({ id: c.id, title: c.title, covers: c.covers, hash, pass: passes * 2 > valid, passes, ...(valid === 0 ? { plumbing: true } : {}), runs });
  }

  const passed = results.filter((r) => r.pass).length;
  const pct = Math.round((passed / results.length) * 100);
  const out = { run_at: new Date().toISOString(), options: opts, partial: !!opts.only, not_run_on_runtime: skippedHere.map((c) => c.id), cost_usd: Number(cost.toFixed(2)),
    refusals: { answer_calls: answerTotal, refused: refusedTotal, rate: answerTotal ? Number((refusedTotal / answerTotal).toFixed(3)) : 0, by_code: byCode },
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
  console.log(`Refusals: ${refusedTotal} of ${answerTotal} answer calls${answerTotal ? ` (${Math.round((refusedTotal / answerTotal) * 100)}%; plan > Risks loosens a guard above 10%)` : ""}${refusedTotal ? `; by code ${JSON.stringify(byCode)}` : ""}.`);
  const plumbed = results.reduce((n, r) => n + (r.runs || []).filter((x) => x.plumbing).length, 0);
  if (plumbed) console.log(`${plumbed} run(s) had an unreadable judge reply: plumbing, left out of the pass counts (cases with no readable run: ${results.filter((r) => r.plumbing).map((r) => r.id.slice(0, 2)).join(", ") || "none"}).`);
  console.log(`Results: ${path.relative(REPO, file)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
