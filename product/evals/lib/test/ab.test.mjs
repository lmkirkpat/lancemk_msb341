// T024: the glue every run.mjs uses for --runtime a|b1.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkOpts, isExperiment, skillsOf, dryRunA, resultFields, printSummary, prepareRun, KEY_VAR } from "../ab.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..");

test("--runtime defaults to b1; a and b1 are accepted; anything else fails; --settings is A only", () => {
  assert.equal(checkOpts({}).runtime, "b1");
  assert.equal(checkOpts({ runtime: "a" }).runtime, "a");
  assert.throws(() => checkOpts({ runtime: "c" }), /--runtime must be a or b1/);
  assert.throws(() => checkOpts({ runtime: "b1", settings: "/x.json" }), /only with --runtime a/);
  assert.throws(() => checkOpts({ runtime: "a", settings: "/nonexistent.json" }), /not found/);
  const f = path.join(os.tmpdir(), "s.json");
  fs.writeFileSync(f, "{}");
  assert.equal(isExperiment(checkOpts({ runtime: "a", settings: f })), true);
  assert.equal(isExperiment(checkOpts({ runtime: "a" })), false);
});

test("A without the key stops before any case; a dry run doesn't need it; the key leaves the environment", () => {
  delete process.env[KEY_VAR];
  assert.throws(() => prepareRun({ runtime: "a", dryRun: false }), /KNACK_EVAL_API_KEY/);
  assert.doesNotThrow(() => prepareRun({ runtime: "a", dryRun: true }));
  assert.doesNotThrow(() => prepareRun({ runtime: "b1", dryRun: false }));
  process.env[KEY_VAR] = "sk-ant-api03-ABKEY_abcdefghijklm";
  prepareRun({ runtime: "b1", dryRun: false });
  assert.equal(KEY_VAR in process.env, false);
});

test("skillsOf reads the *-mentor commands a case starts", () => {
  assert.deepEqual([...skillsOf({ turns: [{ say: "/ease-mentor" }, { say: "yes" }, { say: "/offset-mentor review" }] })].sort(), ["ease-mentor", "offset-mentor"]);
  assert.equal(skillsOf({ turns: [{ say: "hello" }] }).size, 0);
});

test("the A dry run starts the helper and the server, and checks each skill's SKILL.md and tools", async () => {
  const cases = [{ turns: [{ say: "/ease-mentor" }] }, { turns: [{ say: "/anchor-mentor" }] }];
  const r = await dryRunA({ repo: REPO, cases, opts: {} });
  assert.deepEqual(r.problems, []);
  assert.match(r.lines[0], /A helper starts: runtime a, claude-opus-5-5, effort medium/);
  assert.ok(r.lines.some((l) => /skill ease-mentor: SKILL\.md readable/.test(l)));
  assert.ok(r.lines.some((l) => /skill anchor-mentor/.test(l)));
});

test("the A dry run names a skill with no SKILL.md and a settings file that won't load", async () => {
  const r = await dryRunA({ repo: REPO, cases: [{ turns: [{ say: "/missing-mentor" }] }], opts: {} });
  assert.deepEqual(r.problems, ["skill missing-mentor: no readable SKILL.md"]);
  const bad = path.join(os.tmpdir(), `bad-settings-${process.pid}.json`);
  fs.writeFileSync(bad, JSON.stringify({ version: 2 }));
  const r2 = await dryRunA({ repo: REPO, cases: [], opts: { settings: bad } });
  assert.equal(r2.problems.length, 1);
  assert.match(r2.problems[0], /the helper doesn't start/);
});

test("results fields: B1 records its runtime only; A records model, effort, hashes, counts and the comparison", () => {
  assert.deepEqual(resultFields({ runtime: "b1" }, [], {}), { runtime: "b1" });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "results-"));
  fs.writeFileSync(path.join(dir, "2026-10-29-100000.json"), JSON.stringify({ summary: { passed: 1, total: 2 }, cases: [{ id: "01-x", pass: true }, { id: "02-x", pass: false }] }));
  const results = [
    { id: "01-x", pass: false, runs: [{ prompt_hashes: { "ease-mentor": "h" }, other_model_turns: 1, cost_unknown_turns: 0 }] },
    { id: "02-x", pass: true, runs: [{ prompt_hashes: { "ease-mentor": "h2" }, other_model_turns: 0, cost_unknown_turns: 2 }] },
  ];
  const f = resultFields({ runtime: "a", settings: null }, results, { resultsDir: dir, readme: "" });
  assert.equal(f.runtime, "a");
  assert.equal(f.non_baseline, false);
  assert.deepEqual(f.prompt_hash, { "ease-mentor": "h" });
  assert.equal(f.other_model_turns, 1);
  assert.equal(f.cost_unknown_turns, 2);
  assert.deepEqual(f.baseline, { file: "2026-10-29-100000.json", passed: 1, total: 2 });
  assert.deepEqual(f.vs_baseline, { b1_pass_a_fail: ["01-x"], b1_fail_a_pass: ["02-x"] });
  const out = [];
  const log = console.log;
  console.log = (s) => out.push(s);
  try {
    printSummary({ ...f, summary: { passed: 1, total: 2 }, cost_usd: 1.2, partial: false, model: "m", effort: "e" }, 80);
  } finally {
    console.log = log;
  }
  assert.equal(out.length, 3);
  assert.match(out[1], /vs B1 baseline 2026-10-29-100000\.json \(1\/2\): \+0; B1 pass → A fail: 01; A pass → B1 fail: 02/);
});
