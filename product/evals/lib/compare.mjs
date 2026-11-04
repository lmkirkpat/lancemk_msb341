// The B1 baseline and the summary line for runs on option A (spec 013 T024, contracts/
// eval-runtime.md › Summary line). Node built-ins only.

import fs from "node:fs";
import path from "node:path";

// A set's README may name the baseline to compare against (it wins). One line, anywhere:
//   A-comparison baseline: `results/2026-10-29-144158.json`
export const README_MARKER = /^\s*A-comparison baseline\s*:\s*`?(?:results\/)?([\w.-]+\.json)`?/im;

export const isB1 = (r) => !r.runtime || r.runtime === "b1";

// The case's short id for the summary line: "07" for "07-show-me", "21b" for "21b-...".
export const shortId = (id) => String(id).split("-")[0];

// → { file, passed, total, cases: Map(id → pass) } or null. The newest full (not --only) results
// file on B1 (or from before the runtime field), unless the README names one.
export function findBaseline(resultsDir, readmeText) {
  if (!fs.existsSync(resultsDir)) return null;
  const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json")).sort();
  const read = (f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf8"));
    } catch {
      return null;
    }
  };
  const named = readmeText && README_MARKER.exec(readmeText);
  let file = named && files.includes(named[1]) ? named[1] : null;
  let data = file ? read(file) : null;
  if (!data) {
    file = null;
    for (const f of [...files].reverse()) {
      const d = read(f);
      if (d && !d.partial && isB1(d) && !d.non_baseline && d.summary) {
        file = f;
        data = d;
        break;
      }
    }
  }
  if (!data) return null;
  return { file, passed: data.summary.passed, total: data.summary.total, cases: new Map(data.cases.map((c) => [c.id, !!c.pass])) };
}

// results: this run's case results ({ id, pass }). Only cases in both runs are compared.
export function compareToBaseline(results, baseline) {
  if (!baseline) return null;
  const b1_pass_a_fail = [];
  const b1_fail_a_pass = [];
  for (const r of results) {
    if (!baseline.cases.has(r.id)) continue;
    const was = baseline.cases.get(r.id);
    if (was && !r.pass) b1_pass_a_fail.push(r.id);
    if (!was && r.pass) b1_fail_a_pass.push(r.id);
  }
  return { baseline: { file: baseline.file, passed: baseline.passed, total: baseline.total }, vs_baseline: { b1_pass_a_fail, b1_fail_a_pass } };
}

// The two or three summary lines for an A run.
export function summaryLines({ passed, total, target, cost, mentorCost, judgeCost, costUnknownTurns = 0, info, comparison, otherModelTurns = 0, partial = false }) {
  const pct = total ? Math.round((passed / total) * 100) : 0;
  // T063: with the split, say what each part paid for; the total includes the judge, which is not credit.
  const split = typeof mentorCost === "number" && typeof judgeCost === "number";
  const money = `${split ? "total " : ""}$${cost.toFixed(2)}${split ? ` (mentor $${mentorCost.toFixed(2)} on credit + judge $${judgeCost.toFixed(2)} on subscription)` : ""}${costUnknownTurns ? ` (+ ${costUnknownTurns} turn${costUnknownTurns === 1 ? "" : "s"} of unknown cost)` : ""}`;
  const lines = [`${passed}/${total} passed (${pct}%, target ${target}%) ${pct >= target ? "✓" : "✗"}  ${money}  runtime a, ${info ? info.model : "?"}, effort ${info ? info.effort : "?"}`];
  if (comparison) {
    const { baseline: b, vs_baseline: v } = comparison;
    const delta = passed - b.passed;
    const list = (a) => (a.length ? a.map(shortId).join(", ") : "none");
    lines.push(`vs B1 baseline ${b.file} (${b.passed}/${b.total}): ${partial ? "partial run, compared on the cases run" : `${delta >= 0 ? "+" : ""}${delta}`}; B1 pass → A fail: ${list(v.b1_pass_a_fail)}; A pass → B1 fail: ${list(v.b1_fail_a_pass)}`);
  } else {
    lines.push("vs B1 baseline: none found");
  }
  lines.push(`other-model turns: ${otherModelTurns}`);
  return lines;
}
