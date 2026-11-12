#!/usr/bin/env node
// Request timing for an A results file (spec 013 T068): how many requests, how many re-sends, the
// longest wait for headers and the longest gap inside a response, and the slowest five requests.
// Usage: node product/evals/lib/timing-report.mjs <results.json> [more.json ...]
// Reads `request_timing` and `request_events` on each case run (A runs only; B1 files have none).
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// → { requests, resends, quiet, no_headers, ends, max_headers_ms, max_gap_ms, slowest[] }
export function summarize(results) {
  const all = [];
  let resends = 0;
  let quiet = 0;
  let noHeaders = 0;
  let runsWithData = 0;
  let runs = 0;
  const ends = {};
  for (const c of results.cases || []) {
    (c.runs || []).forEach((run, i) => {
      runs++;
      if (run.request_timing || run.request_events) runsWithData++;
      for (const t of run.request_timing || []) all.push({ case: c.id, run: i + 1, ...t });
      for (const e of run.request_events || []) {
        if (e.event === "request_sent_again") resends++;
        else if (e.event === "response_went_quiet") quiet++;
        else if (e.event === "request_no_headers") noHeaders++;
      }
    });
  }
  for (const t of all) ends[t.end ?? "unknown"] = (ends[t.end ?? "unknown"] || 0) + 1;
  const max = (k) => all.reduce((m, t) => (typeof t[k] === "number" && t[k] > m ? t[k] : m), 0);
  const slowest = all
    .slice()
    .sort((a, b) => (b.total_ms || 0) - (a.total_ms || 0))
    .slice(0, 5);
  return { runs, runs_with_timing: runsWithData, requests: all.length, resends, quiet, no_headers: noHeaders, ends, max_headers_ms: max("headers_ms"), max_gap_ms: max("max_gap_ms"), slowest };
}

export function format(name, s) {
  const out = [`${name}`, `  runs ${s.runs} (${s.runs_with_timing} with timing), requests ${s.requests}, re-sends ${s.resends}, went quiet ${s.quiet}, no headers ${s.no_headers}`, `  max headers ${s.max_headers_ms} ms, max gap ${s.max_gap_ms} ms, ends ${JSON.stringify(s.ends)}`, "  slowest five (case/run/turn: total, headers, max gap, end, request):"];
  for (const t of s.slowest) out.push(`    ${t.case}/run ${t.run}/turn ${t.turn}: ${t.total_ms} ms, ${t.headers_ms} ms, ${t.max_gap_ms} ms, ${t.end}, ${t.request_id ?? "-"}${t.body_bytes != null ? `, ${t.body_bytes} B` : ""}`);
  if (!s.slowest.length) out.push("    (no timing in this file)");
  return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: node product/evals/lib/timing-report.mjs <results.json> [...]");
    process.exit(2);
  }
  for (const f of files) console.log(format(f, summarize(JSON.parse(fs.readFileSync(f, "utf8")))));
}
