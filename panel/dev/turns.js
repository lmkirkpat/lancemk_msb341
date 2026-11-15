#!/usr/bin/env node
// SC-004, SC-005, cost and caching from panel-turns.jsonl, per runtime (spec 003 research R9,
// spec 013 FR-029, T047, research R8's gap re-check). Reads the log; never writes it.
//   node panel/dev/turns.js [--home <AEMentor folder>] [--last N] [--ask]
// Ask thread turns (spec 014 FR-058, research R11: `thread: "ask"`) are left out of the lesson
// report; --ask reports them: answer turns (question, followup) apart from go-deeper lessons.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const GAP_LIMIT_MS = 5 * 60000; // research R8: the cache's 5-minute lifetime
const RUNTIMES = [["b1", "B1 (including lines with no runtime)"], ["a", "A"]];

const runtimeOf = (t) => (t.runtime === "a" ? "a" : "b1"); // old lines have no runtime: B1
const isNum = (x) => typeof x === "number" && isFinite(x);
const median = (xs) => {
  const s = xs.filter(isNum).sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

// A lesson starts at each "start" or "new_lesson", or when the runtime changes; "continue" and
// every other turn belong to the lesson before them.
function splitLessons(turns) {
  const lessons = [];
  for (const t of turns) {
    const rt = runtimeOf(t);
    const last = lessons[lessons.length - 1];
    if (!last || t.kind === "start" || t.kind === "new_lesson" || last.runtime !== rt) {
      lessons.push({ start: t.at, runtime: rt, turns: [] });
    }
    lessons[lessons.length - 1].turns.push(t);
  }
  return lessons;
}

// The wait between a turn's end and the next send, within one lesson. The log's `at` is the
// send time (app.js logs turn_start's), so a turn ends at `at + total_ms`. A small negative
// (clock rounding) counts as 0.
function gaps(lesson) {
  const out = [];
  for (let i = 1; i < lesson.turns.length; i++) {
    const p = lesson.turns[i - 1];
    const c = lesson.turns[i];
    const g = Date.parse(c.at) - (Date.parse(p.at) + (p.total_ms || 0));
    if (isNum(g)) out.push(Math.max(0, g));
  }
  return out;
}

function summarize(turns) {
  const out = {};
  for (const lesson of splitLessons(turns)) {
    const s = (out[lesson.runtime] = out[lesson.runtime] || { lessons: [], all: [] });
    s.lessons.push(lesson);
    s.all.push(...lesson.turns);
  }
  for (const s of Object.values(out)) {
    const first = s.all.map((t) => t.first_event_ms);
    s.turns = s.all.length;
    s.under = first.filter((ms) => isNum(ms) && ms <= 10000).length;
    s.share = s.turns ? Math.round((s.under / s.turns) * 100) : 0;
    s.median_first_ms = median(first);
    s.worst_first_ms = first.filter(isNum).length ? Math.max(...first.filter(isNum)) : null;
    s.median_wait_ms = median(s.all.map((t) => t.wait_ms));
    s.cost = s.all.reduce((sum, t) => sum + (isNum(t.cost_usd) ? t.cost_usd : 0), 0);
    s.cost_unknown = s.all.filter((t) => t.cost_usd === null || t.cost_usd === undefined).length;
    s.cost_per_lesson = s.lessons.length ? s.cost / s.lessons.length : null;
    let read = 0;
    let prompt = 0;
    for (const t of s.all) {
      const k = t.tokens;
      if (!k) continue;
      const parts = [k.input, k.cache_write, k.cache_read].filter(isNum);
      prompt += parts.reduce((a, b) => a + b, 0);
      if (isNum(k.cache_read)) read += k.cache_read;
    }
    s.cache_read_share = prompt ? Math.round((read / prompt) * 100) : null;
    const g = s.lessons.flatMap(gaps);
    s.gaps_total = g.length;
    s.gaps_over = g.filter((x) => x > GAP_LIMIT_MS).length;
    s.median_gap_ms = median(g);
    s.start_ms = median(s.all.map((t) => t.start_ms));
    delete s.all;
  }
  return out;
}

const secs = (ms) => (ms === null || ms === undefined ? "–" : `${(ms / 1000).toFixed(1)} s`);

function lessonRow(l, n) {
  const passed = l.turns.find((t) => t.lesson_passed);
  let dur = "not passed";
  if (passed) {
    const ms = Date.parse(passed.at) + (passed.total_ms || 0) - Date.parse(l.start);
    dur = `${(ms / 60000).toFixed(1)} min ${ms <= 15 * 60000 ? "✓" : "✗"}`;
  }
  const cost = l.turns.reduce((s, t) => s + (isNum(t.cost_usd) ? t.cost_usd : 0), 0);
  return `${String(n).padEnd(7)} ${String(l.start).slice(0, 19).padEnd(21)} ${String(l.turns.length).padEnd(6)} ${dur.padEnd(36)} $${cost.toFixed(2)}`;
}

function report(turns, opts) {
  const s = summarize(turns);
  const lastN = opts && opts.last;
  const out = [];
  for (const [rt, title] of RUNTIMES) {
    const r = s[rt];
    if (!r) continue;
    out.push(title);
    out.push(`  Turns: ${r.turns} in ${r.lessons.length} lesson(s)`);
    out.push(`  SC-004 first activity ≤ 10 s: ${r.under}/${r.turns} (${r.share}%, target ≥ 90%) ${r.share >= 90 ? "✓" : "✗"}`);
    out.push(`    first activity: median ${secs(r.median_first_ms)}, worst ${secs(r.worst_first_ms)}`);
    out.push(`    first words (context): median ${secs(r.median_wait_ms)}`);
    out.push(`  Cost: $${r.cost.toFixed(2)}, $${r.cost_per_lesson.toFixed(2)} per lesson${r.cost_unknown ? ` (${r.cost_unknown} turn(s) with no cost)` : ""}`);
    out.push(`  Cache read share: ${r.cache_read_share === null ? "– (no token counts logged)" : `${r.cache_read_share}%`}`);
    const over = r.gaps_total ? Math.round((r.gaps_over / r.gaps_total) * 100) : 0;
    out.push(`  Gaps over 5 min: ${r.gaps_over}/${r.gaps_total} (${over}%; R8 says revisit above 10%) ${over > 10 ? "✗" : "✓"}, median gap ${secs(r.median_gap_ms)}`);
    if (r.start_ms !== null) out.push(`  Start-up (helper spawn to ready): median ${secs(r.start_ms)}`);
    out.push("");
    out.push("  Lesson  Started               Turns  Duration to pass (SC-005 ≤ 15 min)  Cost");
    const shown = lastN ? r.lessons.slice(-lastN) : r.lessons;
    const offset = r.lessons.length - shown.length;
    shown.forEach((l, n) => out.push("  " + lessonRow(l, offset + n + 1)));
    out.push("");
  }
  return out.join("\n");
}

// ---------- spec 014: ask threads (--ask) ----------

const isAsk = (t) => t.thread === "ask";
const ANSWER_KINDS = new Set(["question", "followup"]);

// A go-deeper lesson starts at each go_deeper turn and runs until the next answer turn. Its turns
// keep the lesson kinds; the first one is the go_deeper press itself.
function splitAsk(turns) {
  const answers = [];
  const lessons = [];
  let open = null;
  for (const t of turns.filter(isAsk)) {
    if (ANSWER_KINDS.has(t.kind)) { open = null; answers.push(t); continue; }
    if (t.kind === "go_deeper" || !open || open.runtime !== runtimeOf(t)) {
      open = { start: t.at, runtime: runtimeOf(t), turns: [] };
      lessons.push(open);
    }
    open.turns.push(t);
  }
  return { answers, lessons };
}

function askReport(turns) {
  const { answers, lessons } = splitAsk(turns);
  if (!answers.length && !lessons.length) return "No ask turns logged yet.";
  const out = [];
  for (const [rt, title] of RUNTIMES) {
    const a = answers.filter((t) => runtimeOf(t) === rt);
    const l = lessons.filter((x) => x.runtime === rt);
    if (!a.length && !l.length) continue;
    out.push(`${title}, ask threads`);
    const first = a.map((t) => t.first_event_ms);
    const under = first.filter((ms) => isNum(ms) && ms <= 10000).length;
    const costs = a.map((t) => t.cost_usd).filter(isNum);
    out.push(`  Answer turns: ${a.length} (${a.filter((t) => t.kind === "question").length} questions, ${a.filter((t) => t.kind === "followup").length} follow-ups)`);
    if (a.length) {
      out.push(`    first activity ≤ 10 s: ${under}/${a.length} (FR-058), median ${secs(median(first))}`);
      out.push(`    cost: median $${(median(costs) || 0).toFixed(3)} per answer turn, $${costs.reduce((x, y) => x + y, 0).toFixed(2)} in all (SC-005 aims under $0.10)`);
      const tok = a.map((t) => t.tokens).filter(Boolean);
      if (tok.length) out.push(`    tokens: median input ${median(tok.map((k) => k.input))}, cache read ${median(tok.map((k) => k.cache_read))}, output ${median(tok.map((k) => k.output))}`);
    }
    out.push(`  Go-deeper lessons: ${l.length}`);
    l.forEach((x, n) => out.push("    " + lessonRow(x, n + 1)));
    out.push("");
  }
  return out.join("\n");
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const home = arg("--home") || require("../lib/config.js").defaultHome();
  const file = path.join(home, "panel-turns.jsonl");
  const tilde = (p) => p.split(os.homedir()).join("~");
  let turns;
  try {
    turns = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch (e) {
    turns = [];
  }
  if (!turns.length) return console.log(`No turns logged yet (${tilde(file)}).`);
  console.log(`${tilde(file)}\n`);
  if (argv.includes("--ask")) return console.log(askReport(turns));
  const lessonTurns = turns.filter((t) => !isAsk(t));
  const asked = turns.length - lessonTurns.length;
  if (lessonTurns.length) console.log(report(lessonTurns, { last: Number(arg("--last")) || 0 }));
  if (asked) console.log(`${asked} ask thread turn(s) left out; see --ask.`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { splitLessons, gaps, summarize, report, runtimeOf, splitAsk, askReport };
