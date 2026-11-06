// The glue between a set's run.mjs and option A (spec 013 T024; contracts/eval-runtime.md): the
// switch, the per-case mentor, the allowlist check, the dry-run check, the results fields and
// the summary. B1 stays the default and its code path is untouched. Node built-ins only.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCaseMentor, helperHashFiles, startHelper, takeEvalKey, KEY_VAR } from "./runtime-a.mjs";
import { deriveAllowlist, checkRequestLogFile, describe, SKILL_PATTERN } from "./allowlist-check.mjs";
import { probeServer } from "./server-probe.mjs";
import { findBaseline, compareToBaseline, summaryLines } from "./compare.mjs";
import { allowedToolsOf, toolSets } from "./skill-tools.mjs";

export { takeEvalKey, helperHashFiles, KEY_VAR, allowedToolsOf, toolSets };

// Checks --runtime and --settings after parsing. Sets the default.
export function checkOpts(opts) {
  if (opts.runtime === undefined || opts.runtime === null) opts.runtime = "b1";
  if (opts.runtime !== "a" && opts.runtime !== "b1") throw new Error(`--runtime must be a or b1, not ${opts.runtime}`);
  if (opts.settings === undefined) opts.settings = null;
  if (opts.settings && opts.runtime !== "a") throw new Error("--settings works only with --runtime a");
  if (opts.settings && !fs.existsSync(opts.settings)) throw new Error(`--settings file not found: ${opts.settings}`);
  return opts;
}

// A run on another settings file is an experiment, never a baseline (FR-028).
export const isExperiment = (opts) => opts.runtime === "a" && !!opts.settings;

let allowlistP = null;
const allowlistFor = (repo) => (allowlistP ||= deriveAllowlist({ repo }));

let runInfo = null;
let runKey = null;

// Called once per run, before any case: A needs the key unless it's a dry run.
export function prepareRun(opts) {
  runKey = takeEvalKey(); // deleted from the environment on B1 too, so no child ever has it
  if (opts.runtime === "a" && !opts.dryRun && !runKey) {
    throw new Error(`--runtime a needs ${KEY_VAR} in the shell (the key is passed to the helper in its start command only)`);
  }
}

// One case's mentor on A. env: the AE_MENTOR_* variables B1 gets.
export function openCase({ repo, home, env, opts, baseUrl }) {
  // baseUrl is for tests against a local stand-in only; no runner passes it.
  return createCaseMentor({ repo, home, fixtureEnv: env, key: runKey, settingsFile: opts.settings, baseUrl });
}

// Stops the helper, checks the request log, and returns what the run records.
export async function closeCase({ repo, mentor, learnerTexts }) {
  await mentor.stop();
  if (mentor.info && !runInfo) runInfo = mentor.info;
  let allowlist;
  try {
    const result = checkRequestLogFile(mentor.requestLog, await allowlistFor(repo), { learnerTexts });
    allowlist = { pass: result.pass, requests: result.requests, detail: describe(result), violations: result.violations.slice(0, 20) };
  } catch (e) {
    allowlist = { pass: false, requests: 0, detail: `the allowlist couldn't be derived: ${e.message}`, violations: [] };
  }
  return {
    cost: mentor.cost,
    cost_unknown_turns: mentor.costUnknownTurns,
    other_model_turns: mentor.otherModelTurns,
    prompt_hashes: mentor.promptHashes,
    allowlist,
    // Only when a turn failed: its error kind and the end of the helper's log (T068).
    ...(mentor.failedTurns?.length ? { failed_turns: mentor.failedTurns } : {}),
  };
}

// The skills a case starts: a turn whose text starts with a `/<name>-mentor` command.
export function skillsOf(c) {
  const names = new Set();
  for (const t of c.turns || []) {
    const m = /^\s*\/([a-z0-9][a-z0-9-]*-mentor)\b/.exec(t.say || "");
    if (m) names.add(m[1]);
  }
  return names;
}

// The A dry run (contracts/eval-runtime.md): the helper starts, settings.json loads, and every skill
// a case uses has a readable SKILL.md and tools the server lists. No request to the service: the
// helper gets a placeholder key and is never sent a turn. → { problems[], lines[] }
export async function dryRunA({ repo, cases, opts, startHelperImpl = startHelper }) {
  const problems = [];
  const lines = [];
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  try {
    const helper = await startHelperImpl({
      repo,
      home,
      fixtureEnv: { AE_MENTOR_FIXTURE_STATE: path.join(home, "fixture-state.json") },
      key: "sk-ant-dry-run-placeholder-not-sent-anywhere",
      settingsFile: opts.settings,
    });
    const r = helper.ready;
    lines.push(`A helper starts: runtime ${r.runtime}, ${r.model}, effort ${r.effort}, settings ${String(r.settings_hash).slice(0, 12)}${r.settings_file ? ` (${path.basename(r.settings_file)}, an experiment: never a baseline)` : ""}`);
    await helper.stop();
  } catch (e) {
    problems.push(`the helper doesn't start: ${e.message}`);
  }
  let server = null;
  try {
    server = await probeServer(repo);
    lines.push(`ae-mentor lists ${server.tools.length} tools`);
  } catch (e) {
    problems.push(`ae-mentor doesn't start: ${e.message}`);
  }
  const used = new Set();
  for (const c of cases) for (const n of skillsOf(c)) used.add(n);
  const listed = new Set(server ? server.tools.map((t) => t.name) : []);
  for (const name of [...used].sort()) {
    const file = path.join(repo, ".claude", "skills", name, "SKILL.md");
    if (!SKILL_PATTERN.test(name) || !fs.existsSync(file)) {
      problems.push(`skill ${name}: no readable SKILL.md`);
      continue;
    }
    const tools = allowedToolsOf(fs.readFileSync(file, "utf8"));
    if (tools === null) {
      problems.push(`skill ${name}: SKILL.md has no frontmatter`);
      continue;
    }
    const missing = server ? tools.filter((t) => t !== "Skill" && !listed.has(t)) : [];
    if (missing.length) problems.push(`skill ${name}: allowed tools the server doesn't list: ${missing.join(", ")}`);
    else lines.push(`skill ${name}: SKILL.md readable, ${tools.length} allowed tools all listed`);
  }
  fs.rmSync(home, { recursive: true, force: true });
  return { problems, lines };
}

// Top-level results fields for a run (data-model › Eval results).
export function resultFields(opts, results, { resultsDir, readme }) {
  if (opts.runtime !== "a") return { runtime: "b1" };
  const promptHash = {};
  let otherModel = 0;
  let unknown = 0;
  let mentorCost = 0;
  let judgeCost = 0;
  for (const r of results) {
    for (const run of r.runs || []) {
      mentorCost += run.mentor_cost_usd || 0;
      judgeCost += run.judge_cost_usd || 0;
      for (const [k, v] of Object.entries(run.prompt_hashes || {})) promptHash[k] ||= v;
      otherModel += run.other_model_turns || 0;
      unknown += run.cost_unknown_turns || 0;
    }
  }
  const comparison = compareToBaseline(results, findBaseline(resultsDir, readme));
  return {
    runtime: "a",
    model: runInfo ? runInfo.model : null,
    effort: runInfo ? runInfo.effort : null,
    settings_hash: runInfo ? runInfo.settings_hash : null,
    // T063: cost_usd stays the total; these split it into what the API credit paid (the mentor) and
    // what the subscription paid (the judge, a headless claude -p).
    mentor_cost_usd: Number(mentorCost.toFixed(2)),
    judge_cost_usd: Number(judgeCost.toFixed(2)),
    ...(opts.settings ? { settings_file: path.basename(opts.settings) } : {}),
    non_baseline: isExperiment(opts),
    prompt_hash: promptHash,
    other_model_turns: otherModel,
    cost_unknown_turns: unknown,
    ...(comparison || { baseline: null, vs_baseline: null }),
  };
}

// The A summary (3 lines) from the results object main() is about to write.
export function printSummary(out, target) {
  const comparison = out.baseline ? { baseline: out.baseline, vs_baseline: out.vs_baseline } : null;
  for (const l of summaryLines({
    passed: out.summary.passed,
    total: out.summary.total,
    target,
    cost: out.cost_usd,
    mentorCost: out.mentor_cost_usd,
    judgeCost: out.judge_cost_usd,
    costUnknownTurns: out.cost_unknown_turns,
    info: { model: out.model, effort: out.effort },
    comparison,
    otherModelTurns: out.other_model_turns,
    partial: out.partial,
  })) console.log(l);
  if (out.non_baseline) console.log("Experiment: settings file in use, so this run can't become a baseline.");
}
