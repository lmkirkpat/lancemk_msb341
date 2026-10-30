// T024: the B1 baseline choice, the comparison and the summary line (contracts/eval-runtime.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findBaseline, compareToBaseline, summaryLines, shortId } from "../compare.mjs";

function resultsDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "results-"));
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), JSON.stringify(data));
  return dir;
}
const run = (passes, extra = {}) => ({ summary: { passed: passes.filter(Boolean).length, total: passes.length }, cases: passes.map((p, i) => ({ id: `${String(i + 1).padStart(2, "0")}-x`, pass: p })), ...extra });

test("the baseline is the newest full B1 results file; partial, A and experiment files are skipped; old files count as B1", () => {
  const dir = resultsDir({
    "2026-10-28-100000.json": run([true, true, false]),
    "2026-10-29-100000.json": run([true, true, true]),
    "2026-10-30-100000.json": run([true], { partial: true }),
    "2026-10-30-110000.json": run([false, false, false], { runtime: "a" }),
    "2026-10-30-120000.json": run([false, false, false], { runtime: "a", non_baseline: true }),
    "2026-10-30-130000.json": run([true, false, false], { runtime: "b1", non_baseline: true }),
  });
  const b = findBaseline(dir, "");
  assert.equal(b.file, "2026-10-29-100000.json");
  assert.deepEqual([b.passed, b.total], [3, 3]);
  const b1 = findBaseline(resultsDir({ "2026-01-01-000000.json": run([true, true]), "2026-10-30-100000.json": run([false, true], { runtime: "b1" }) }), "");
  assert.equal(b1.file, "2026-10-30-100000.json");
});

test("a README line naming the baseline wins", () => {
  const dir = resultsDir({ "2026-10-28-100000.json": run([true, false]), "2026-10-29-100000.json": run([true, true]) });
  assert.equal(findBaseline(dir, "Notes\nA-comparison baseline: `results/2026-10-28-100000.json`\n").file, "2026-10-28-100000.json");
  assert.equal(findBaseline(dir, "A-comparison baseline: 2026-10-28-100000.json").file, "2026-10-28-100000.json");
  assert.equal(findBaseline(dir, "A-comparison baseline: gone.json").file, "2026-10-29-100000.json", "a name that isn't there falls back");
});

test("no results folder or no B1 file gives no baseline", () => {
  assert.equal(findBaseline("/nonexistent/results", ""), null);
  assert.equal(findBaseline(resultsDir({ "x.json": run([true], { runtime: "a" }) }), ""), null);
});

test("the comparison lists B1 pass → A fail and A pass → B1 fail, on the cases both ran", () => {
  const baseline = { file: "b.json", passed: 2, total: 3, cases: new Map([["01-x", true], ["02-x", false], ["03-x", true], ["04-x", true]]) };
  const c = compareToBaseline([{ id: "01-x", pass: true }, { id: "02-x", pass: true }, { id: "03-x", pass: false }, { id: "09-new", pass: false }], baseline);
  assert.deepEqual(c.vs_baseline, { b1_pass_a_fail: ["03-x"], b1_fail_a_pass: ["02-x"] });
  assert.deepEqual(c.baseline, { file: "b.json", passed: 2, total: 3 });
  assert.equal(compareToBaseline([], null), null);
});

test("the summary line is the contract's, three lines", () => {
  const lines = summaryLines({
    passed: 26, total: 28, target: 80, cost: 14.8, info: { model: "claude-opus-5-5", effort: "medium" }, otherModelTurns: 0,
    comparison: { baseline: { file: "2026-10-29-144158.json", passed: 27, total: 28 }, vs_baseline: { b1_pass_a_fail: ["07-show"], b1_fail_a_pass: [] } },
  });
  assert.deepEqual(lines, [
    "26/28 passed (93%, target 80%) ✓  $14.80  runtime a, claude-opus-5-5, effort medium",
    "vs B1 baseline 2026-10-29-144158.json (27/28): -1; B1 pass → A fail: 07; A pass → B1 fail: none",
    "other-model turns: 0",
  ]);
});

test("unknown cost, a partial run, below target and no baseline are said plainly", () => {
  const l = summaryLines({ passed: 1, total: 2, target: 80, cost: 0.5, costUnknownTurns: 2, info: { model: "m", effort: "e" }, comparison: null, otherModelTurns: 3, partial: true });
  assert.match(l[0], /50%, target 80%\) ✗  \$0\.50 \(\+ 2 turns of unknown cost\)/);
  assert.equal(l[1], "vs B1 baseline: none found");
  assert.equal(l[2], "other-model turns: 3");
  const p = summaryLines({ passed: 1, total: 1, target: 80, cost: 0, info: null, comparison: { baseline: { file: "f.json", passed: 9, total: 10 }, vs_baseline: { b1_pass_a_fail: [], b1_fail_a_pass: ["21b-a"] } }, partial: true });
  assert.match(p[1], /partial run, compared on the cases run; B1 pass → A fail: none; A pass → B1 fail: 21b/);
  assert.equal(shortId("21b-something"), "21b");
});
