#!/usr/bin/env node
// SC-004, SC-005 and cost from panel-turns.jsonl (research R9, quickstart §7).
//   node panel/dev/turns.js [--home <AEMentor folder>]
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { defaultHome } = require("../lib/config.js");

const i = process.argv.indexOf("--home");
const home = i > 0 ? process.argv[i + 1] : defaultHome();
const file = path.join(home, "panel-turns.jsonl");
const tilde = (p) => p.split(os.homedir()).join("~");

let turns;
try {
  turns = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
} catch (e) {
  console.log(`No turns logged yet (${tilde(file)}).`);
  process.exit(0);
}

const median = (xs) => {
  const s = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};
const secs = (ms) => (ms === null || ms === undefined ? "–" : `${(ms / 1000).toFixed(1)} s`);

// A lesson starts at each "start"; "continue" turns belong to the lesson before them.
const lessons = [];
for (const t of turns) {
  if (t.kind === "start" || !lessons.length) lessons.push({ start: t.at, turns: [] });
  lessons[lessons.length - 1].turns.push(t);
}

const first = turns.map((t) => t.first_event_ms);
const under = first.filter((ms) => typeof ms === "number" && ms <= 10000).length;
const share = turns.length ? Math.round((under / turns.length) * 100) : 0;
const worst = Math.max(...first.filter((x) => typeof x === "number"), 0);

console.log(`Turns: ${turns.length} in ${lessons.length} lesson(s)  (${tilde(file)})`);
console.log(`SC-004 first activity ≤ 10 s: ${under}/${turns.length} (${share}%, target ≥ 90%) ${share >= 90 ? "✓" : "✗"}`);
console.log(`  first activity: median ${secs(median(first))}, worst ${secs(worst || null)}`);
console.log(`  first words (context): median ${secs(median(turns.map((t) => t.wait_ms)))}`);
console.log("");
console.log("Lesson  Started               Turns  Duration to pass (SC-005 ≤ 15 min)  Cost");
lessons.forEach((l, n) => {
  const passed = l.turns.find((t) => t.lesson_passed);
  let dur = "not passed";
  if (passed) {
    const ms = new Date(passed.at).getTime() + (passed.total_ms || 0) - new Date(l.start).getTime();
    dur = `${(ms / 60000).toFixed(1)} min ${ms <= 15 * 60000 ? "✓" : "✗"}`;
  }
  const cost = l.turns.reduce((s, t) => s + (t.cost_usd || 0), 0);
  console.log(`${String(n + 1).padEnd(7)} ${String(l.start).slice(0, 19).padEnd(21)} ${String(l.turns.length).padEnd(6)} ${dur.padEnd(36)} $${cost.toFixed(2)}`);
});
const total = turns.reduce((s, t) => s + (t.cost_usd || 0), 0);
console.log(`\nTotal cost: $${total.toFixed(2)}${lessons.length ? `, $${(total / lessons.length).toFixed(2)} per lesson` : ""}`);
