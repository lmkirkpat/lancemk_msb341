#!/usr/bin/env node
// Looks for the API access key in the places it must never reach (spec 013 SC-005, T041).
//   KNACK_EVAL_API_KEY=... node key-scan.mjs [--home <learner home>] [--results <dir>]...
//                                            [--report <file>] [--processes] [--no-processes]
// Places: a learner home (every file, the frames folder as bytes, panel-conversation.json), eval
// results folders, one copied report, and the environments of running `node` processes whose command
// line is the panel helper or mentor/server.mjs. Prints counts per place only, never the key or the
// text around it. Exit 0 clean, 1 found (or a place missing), 2 bad usage. Node built-ins only.
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Non-overlapping occurrences of key in a buffer (text or binary).
export function countIn(buf, key) {
  const needle = Buffer.from(key, "latin1");
  let n = 0;
  let i = 0;
  while ((i = buf.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

async function* walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) yield* walk(full);
    else if (ent.isFile()) yield full;
  }
}

async function scanPath(place, target, key) {
  let st;
  try {
    st = await fs.stat(target);
  } catch {
    return { place, missing: true, files: 0, filesWithKey: 0, occurrences: 0 };
  }
  const files = st.isDirectory() ? walk(target) : [target];
  let n = 0, withKey = 0, occ = 0;
  for await (const f of files) {
    n++;
    const c = countIn(await fs.readFile(f), key);
    if (c) { withKey++; occ += c; }
  }
  return { place, files: n, filesWithKey: withKey, occurrences: occ };
}

// `ps eww -o pid=,command=` lines → [{pid, line}] for node processes of the helper or the mentor server.
export function parsePs(text) {
  const out = [];
  for (const raw of text.split("\n")) {
    const m = raw.match(/^\s*(\d+)\s+(.*)$/);
    if (!m) continue;
    const line = m[2];
    const cmd = line.split(/\s+/)[0];
    if (!/(^|\/)node$/.test(cmd)) continue;
    if (!/panel\/helper|mentor\/server\.mjs/.test(line)) continue;
    out.push({ pid: Number(m[1]), line });
  }
  return out;
}

function livePs() {
  const r = spawnSync("ps", ["eww", "-axo", "pid=,command="], { encoding: "latin1", maxBuffer: 64 << 20 });
  return r.stdout || "";
}

// → { places: [{place, ...counts}], total, ok }. psText is for tests; processes:true reads the live table.
export async function scanKey({ key, learnerHome, resultsDirs = [], report, psText, processes = false }) {
  if (!key) throw new Error("KNACK_EVAL_API_KEY is not set");
  if (key.length < 8) throw new Error("the key is too short to scan for safely");
  const places = [];
  if (learnerHome) places.push(await scanPath("learner home", learnerHome, key));
  for (let i = 0; i < resultsDirs.length; i++) places.push(await scanPath(`results ${i + 1}`, resultsDirs[i], key));
  if (report) places.push(await scanPath("report", report, key));
  if (psText !== undefined || processes) {
    const procs = parsePs(psText !== undefined ? psText : livePs()).filter((p) => p.pid !== process.pid);
    const occ = procs.reduce((s, p) => s + countIn(Buffer.from(p.line, "latin1"), key), 0);
    places.push({ place: "process environments", processes: procs.length, occurrences: occ });
  }
  const total = places.reduce((s, p) => s + p.occurrences, 0);
  return { places, total, ok: total === 0 && !places.some((p) => p.missing) };
}

function plural(n, w) {
  return `${n} ${n === 1 ? w : w.endsWith("s") ? w + "es" : w + "s"}`;
}

function line(p) {
  if (p.missing) return `${p.place.padEnd(22)} not found`;
  const detail = p.processes !== undefined ? `${plural(p.processes, "process")}, ` : `${plural(p.files, "file")} scanned, `;
  return `${p.place.padEnd(22)} ${detail}${plural(p.occurrences, "occurrence")}`;
}

function main(argv) {
  const o = { resultsDirs: [], processes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--home") o.learnerHome = argv[++i];
    else if (a === "--results") o.resultsDirs.push(argv[++i]);
    else if (a === "--report") o.report = argv[++i];
    else if (a === "--processes") o.processes = true;
    else if (a === "--no-processes") o.processes = false;
    else { console.error(`key-scan: unknown option ${a}`); return 2; }
  }
  if (!o.learnerHome && !o.resultsDirs.length && !o.report && !o.processes) {
    console.error("usage: KNACK_EVAL_API_KEY=... node key-scan.mjs [--home dir] [--results dir]... [--report file] [--processes]");
    return 2;
  }
  return scanKey({ key: process.env.KNACK_EVAL_API_KEY, ...o }).then(
    (r) => {
      for (const p of r.places) console.log(line(p));
      console.log(r.total === 0 ? (r.ok ? "key-scan: 0 occurrences everywhere" : "key-scan: 0 occurrences, but a place was not found") : `key-scan: ${plural(r.total, "occurrence")} found`);
      return r.ok ? 0 : 1;
    },
    (e) => { console.error(`key-scan: ${e.message}`); return 2; },
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(await main(process.argv.slice(2)));
}
