#!/usr/bin/env node
// Are the lesson skills' tool replies byte-identical before and after a change? For a shared-code
// change that shouldn't reach any lesson (spec 015 T064, T065: describe_layers fields, the fine
// sweep's max_value). Runs every lesson tool, in fixture mode, on every eval fixture
// (product/evals/*/fixtures/**/*.json), once on the mentor at <base-ref> and once on the working
// tree, and compares. No AE, no learner record outside a temp folder. Dev chores only.
//
//   node mentor/dev/compare-skill-replies.mjs 9ac1b44
//
// Each tool runs on a fresh temp home: snapshot tools alone, the other lesson tools after every
// snapshot tool (so a check or demo has a lesson to act on). describe_layers, give_answer, go_deeper, end_lesson (new tools the base has none of) and
// preview_frame aren't lesson tools and are left out. Times and the temp folder's name are
// normalized. Exit 0 when identical, 1 when not (the first few differences are printed), 2 on a
// usage error.

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SELF), "..", "..");
const NOT_LESSON = new Set(["describe_layers", "end_lesson", "give_answer", "go_deeper", "preview_frame"]);

// The worker: one mentor folder, every fixture, one JSON line per fixture and tool.
async function worker(mentor, fixtures) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "compare-replies-"));
  process.env.AE_MENTOR_HOME = home;
  const state = path.join(home, "state.json");
  process.env.AE_MENTOR_FIXTURE_STATE = state;
  const { TOOLS } = await import(pathToFileURL(path.join(mentor, "tools", "index.mjs")).href);
  const order = (t) => (/snapshot/.test(t.name) ? 0 : /check|diff/.test(t.name) ? 1 : 2);
  const tools = TOOLS.filter((t) => !NOT_LESSON.has(t.name)).sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  const snapshots = tools.filter((t) => /snapshot/.test(t.name));
  const norm = (s) => s
    .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z(-[0-9a-f]{6})?/g, "<T>")
    .split(home).join("<HOME>");
  const out = [];
  for (const f of fixtures) {
    for (const t of tools) {
      for (const x of fs.readdirSync(home)) if (x !== "state.json") fs.rmSync(path.join(home, x), { recursive: true, force: true });
      fs.writeFileSync(state, JSON.stringify({ project: f }));
      let reply = "";
      for (const s of /snapshot/.test(t.name) ? [t] : [...snapshots, t]) {
        try {
          reply = (await s.handler({})).content.map((c) => c.text || "").join("");
        } catch (e) {
          reply = `ERR ${e.code || ""} ${e.message}`;
        }
      }
      out.push(JSON.stringify({ fixture: path.relative(REPO, f), tool: t.name, reply: norm(reply) }));
    }
  }
  fs.rmSync(home, { recursive: true, force: true });
  process.stdout.write(out.join("\n") + "\n");
}

function fixtures() {
  const found = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".json") && p.split(path.sep).includes("fixtures")) found.push(p);
    }
  };
  walk(path.join(REPO, "product", "evals"));
  return found.sort();
}

function run(mentor, files) {
  const r = spawnSync(process.execPath, [SELF, "--worker", mentor, ...files], { encoding: "utf8", maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`The run on ${mentor} failed:\n${r.stderr}`);
  return r.stdout.split("\n").filter(Boolean);
}

const args = process.argv.slice(2);
if (args[0] === "--worker") {
  await worker(args[1], args.slice(2));
} else {
  const base = args[0];
  if (!base) {
    console.error("usage: node mentor/dev/compare-skill-replies.mjs <base-ref>");
    process.exit(2);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "compare-base-"));
  const tar = execFileSync("git", ["-C", REPO, "archive", base, "mentor", "bridge"], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", tmp], { input: tar });
  const files = fixtures();
  const before = run(path.join(tmp, "mentor"), files);
  const after = run(path.join(REPO, "mentor"), files);
  fs.rmSync(tmp, { recursive: true, force: true });
  const diffs = before.map((line, i) => (line === after[i] ? null : JSON.parse(line))).filter(Boolean);
  const ok = (l) => !JSON.parse(l).reply.startsWith("ERR ");
  console.log(`${files.length} fixtures, ${before.length} replies before and ${after.length} after (${after.filter(ok).length} without an error).`);
  if (before.length === after.length && diffs.length === 0) {
    console.log(`Byte-identical against ${base}.`);
    process.exit(0);
  }
  console.log(`${diffs.length} replies differ${before.length !== after.length ? ", and the counts differ" : ""}:`);
  for (const d of diffs.slice(0, 10)) console.log(`  ${d.tool} on ${d.fixture}`);
  process.exit(1);
}
