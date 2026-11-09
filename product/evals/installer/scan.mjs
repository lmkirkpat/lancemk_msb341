#!/usr/bin/env node
// Scans a staged installer payload for things that must never ship (spec 006 FR-005, SC-007).
// Usage: node scan.mjs <staged folder>. Exit 0 clean, 1 findings, 2 bad usage.
// Node built-ins only. Symlinks are reported if they leave the tree, never followed.
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHUNK = 1 << 20;
const OVERLAP = 512;
const EXT_SEGMENTS = new Set(['AEMentorBridge', 'AEMentorPanel', 'bridge', 'panel']);

const TEXT_RULES = [
  { kind: 'access key (sk-ant-)', re: /sk-ant-/ },
  { kind: 'home path (/Users/<name>)', re: /\/Users\/(?!Shared(?![A-Za-z0-9._-]))[A-Za-z0-9._-]+/ },
];

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

async function scanContent(file) {
  const found = new Set();
  let tail = '';
  for await (const buf of createReadStream(file, { highWaterMark: CHUNK })) {
    const s = tail + buf.toString('latin1');
    for (const r of TEXT_RULES) if (!found.has(r.kind) && r.re.test(s)) found.add(r.kind);
    tail = s.slice(-OVERLAP);
  }
  return [...found];
}

export async function scan(root) {
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
        for (const k of nameFindings(s, false)) findings.push({ path: rel, kind: k });
        continue;
      }
      const isDir = ent.isDirectory();
      for (const k of nameFindings(s, isDir)) findings.push({ path: rel, kind: k });
      if (isDir) {
        if (ent.name === '.git') continue; // already reported, don't wade in
        await walk(full, s);
      } else if (ent.isFile()) {
        for (const k of await scanContent(full)) findings.push({ path: rel, kind: k });
      }
    }
  }
  await walk(abs, []);
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node scan.mjs <staged folder>'); process.exit(2); }
  try {
    const f = await scan(dir);
    if (f.length === 0) { console.log(`scan: clean (${dir})`); process.exit(0); }
    console.error(`scan: ${f.length} offending ${f.length === 1 ? 'path' : 'paths'} in ${dir}`);
    for (const x of f) console.error(`  ${x.path}  [${x.kind}]`);
    process.exit(1);
  } catch (e) { console.error(`scan: ${e.message}`); process.exit(2); }
}
