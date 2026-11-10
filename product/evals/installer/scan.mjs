#!/usr/bin/env node
// Scans a staged installer payload for things that must never ship (spec 006 FR-005, SC-007).
// Usage: node scan.mjs <staged folder>. Exit 0 clean, 1 findings, 2 bad usage.
// Node built-ins only. Symlinks are reported if they leave the tree, never followed.
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const CHUNK = 1 << 20;
const OVERLAP = 512;
const EXT_SEGMENTS = new Set(['AEMentorBridge', 'AEMentorPanel', 'bridge', 'panel']);

const TEXT_RULES = [
  // The shape of a real key: sk-ant-, a type segment (api03, admin01, oat01), a hyphen, then a long
  // token. The 20-character minimum keeps code and docs that only mention the prefix (guard regexes,
  // scrubbers, "sk-ant-req-..." placeholders) from tripping the scan; real tokens run to 80+.
  { kind: 'access key (sk-ant-...)', re: /sk-ant-[A-Za-z]+\d*-[A-Za-z0-9_-]{20,}/ },
  { kind: 'home path (/Users/<name>)', re: /\/Users\/(?!Shared(?![A-Za-z0-9._-]))[A-Za-z0-9._-]+/ },
];

// Extra rules for things a lesson leaves behind (spec 006 SC-007): logs, caches, the installed tree, a
// copied report. Placeholders (example.*, .invalid) are not personal data. The phone shape needs
// separators, so timestamps, versions and bare digit runs pass.
const PERSONAL_RULES = [
  { kind: 'email address', re: /[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net)\b)(?!localhost\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?!invalid\b)[A-Za-z]{2,}/ },
  { kind: 'phone number', re: /(?<![\d.])(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)\s?|\d{3}[ .-])\d{3}[ .-]\d{4}(?![\d])/ },
];
const THIRD_PARTY = new Set(['node_modules', 'runtime']);
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function nameFindings(segs, isDir) {
  const out = [];
  const base = segs[segs.length - 1];
  const dirs = isDir ? segs : segs.slice(0, -1);
  if (base === 'CLAUDE.md') out.push('CLAUDE.md');
  if (base === 'MEMORY.md' || (isDir && base === 'memory' && segs.includes('.claude')) ||
      (isDir && base === 'projects' && segs[segs.length - 2] === '.claude')) out.push('auto-memory file');
  if (dirs.includes('sprints') || (!isDir && /^sprint-\d+.*\.md$/i.test(base))) out.push('sprint notes');
  if (dirs.includes('evals') || dirs.includes('fixtures') || (isDir && base === 'fixture')) out.push('eval fixture');
  if (isDir && (base === 'test' || base === 'tests' || base === '__tests__')) out.push('test/ folder');
  if (base === '.git') out.push('.git');
  const n = segs.length;
  if (isDir && n >= 2 && segs[n - 2] === 'mentor' && base === 'fixture') out.push('mentor/fixture/');
  if (isDir && base === 'node_modules') {
    // inside an extension folder (bridge or panel), except panel/helper which ships its own
    for (let i = 0; i < n - 1; i++) {
      if (!EXT_SEGMENTS.has(segs[i])) continue;
      if (segs[i] === 'panel' && segs[i + 1] === 'helper') continue;
      if (segs[i] === 'AEMentorPanel' && segs[i + 1] === 'helper') continue;
      out.push('node_modules in extension folder');
      break;
    }
  }
  return out;
}

async function scanContent(file, extra = [], literal = '') {
  const found = new Set();
  const rules = [...TEXT_RULES, ...extra];
  let tail = '';
  for await (const buf of createReadStream(file, { highWaterMark: CHUNK })) {
    const s = tail + buf.toString('latin1');
    for (const r of rules) if (!found.has(r.kind) && r.re.test(s)) found.add(r.kind);
    if (literal && !found.has('access key (literal)') && s.includes(literal)) found.add('access key (literal)');
    tail = s.slice(-Math.max(OVERLAP, literal.length));
  }
  return [...found];
}

// opts: names (default true: the payload's name rules), personal (email, phone, Mac user name),
// userName, key (the literal key text, from the caller), skipThirdParty (node_modules and runtime/
// are exempt from the personal rules only).
export async function scan(root, opts = {}) {
  const { names = true, personal = false, key = '', skipThirdParty = false } = opts;
  const userRule = personal && opts.userName
    ? { kind: 'Mac user name', re: new RegExp(`(?<![A-Za-z0-9_])${escapeRe(opts.userName)}(?![A-Za-z0-9_])`) }
    : null;
  const personalRules = personal ? [...PERSONAL_RULES, ...(userRule ? [userRule] : [])] : [];
  const findings = [];
  const abs = path.resolve(root);
  let st;
  try { st = await fs.stat(abs); } catch { throw new Error(`not found: ${root}`); }
  if (!st.isDirectory()) throw new Error(`not a folder: ${root}`);

  async function walk(dir, segs) {
    for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
      const s = [...segs, ent.name];
      const rel = s.join('/');
      const full = path.join(dir, ent.name);
      if (ent.isSymbolicLink()) {
        if (names) for (const k of nameFindings(s, false)) findings.push({ path: rel, kind: k });
        continue;
      }
      const isDir = ent.isDirectory();
      if (names) for (const k of nameFindings(s, isDir)) findings.push({ path: rel, kind: k });
      if (isDir) {
        if (ent.name === '.git') continue; // already reported, don't wade in
        await walk(full, s);
      } else if (ent.isFile()) {
        const exempt = skipThirdParty && s.some((x) => THIRD_PARTY.has(x));
        for (const k of await scanContent(full, exempt ? [] : personalRules, key)) findings.push({ path: rel, kind: k });
      }
    }
  }
  await walk(abs, []);
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind));
}

// After a full lesson (spec 006 T027, SC-007). installed: the installed tree (the payload's rules plus
// the personal-data rules on our own files). logs: log and cache folders (every file, every rule except
// the payload's name rules). report: one copied report file. Findings are labelled installed/, logs1/,
// logs2/... and report. Never returns matched text. The literal key (key) is looked for everywhere.
export async function scanAfterLesson({ installed, logs = [], report, userName = os.userInfo().username, key = '' }) {
  if (!installed) throw new Error('no installed tree given');
  const out = [];
  const add = (label, list) => { for (const f of list) out.push({ path: f.path ? `${label}/${f.path}` : label, kind: f.kind }); };
  add('installed', await scan(installed, { personal: true, userName, key, skipThirdParty: true }));
  for (let i = 0; i < logs.length; i++) add(`logs${i + 1}`, await scan(logs[i], { names: false, personal: true, userName, key }));
  if (report) {
    let st;
    try { st = await fs.stat(report); } catch { throw new Error(`not found: ${report}`); }
    if (!st.isFile()) throw new Error(`not a file: ${report}`);
    const rules = [...PERSONAL_RULES, ...(userName ? [{ kind: 'Mac user name', re: new RegExp(`(?<![A-Za-z0-9_])${escapeRe(userName)}(?![A-Za-z0-9_])`) }] : [])];
    for (const k of await scanContent(report, rules, key)) out.push({ path: '', kind: k, label: 'report' });
    for (const f of out) if (f.label) { f.path = f.label; delete f.label; }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  try {
    let f, where;
    if (args[0] === '--after-lesson') {
      const o = { logs: [] };
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--installed') o.installed = args[++i];
        else if (args[i] === '--logs') o.logs.push(args[++i]);
        else if (args[i] === '--report') o.report = args[++i];
        else if (args[i] === '--user') o.userName = args[++i];
        else { console.error(`scan: unknown option ${args[i]}`); process.exit(2); }
      }
      if (!o.installed) {
        console.error('usage: node scan.mjs --after-lesson --installed <dir> [--logs <dir>]... [--report <file>] [--user <name>]');
        process.exit(2);
      }
      f = await scanAfterLesson({ ...o, key: process.env.KNACK_EVAL_API_KEY || '' });
      where = 'the installed tree, logs, caches and report';
    } else {
      const dir = args[0];
      if (!dir) { console.error('usage: node scan.mjs <staged folder>'); process.exit(2); }
      f = await scan(dir);
      where = dir;
    }
    if (f.length === 0) { console.log(`scan: clean (${where})`); process.exit(0); }
    console.error(`scan: ${f.length} offending ${f.length === 1 ? 'path' : 'paths'} in ${where}`);
    for (const x of f) console.error(`  ${x.path}  [${x.kind}]`);
    process.exit(1);
  } catch (e) { console.error(`scan: ${e.message}`); process.exit(2); }
}
