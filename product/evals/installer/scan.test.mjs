import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scan } from './scan.mjs';

const SCAN = path.join(path.dirname(fileURLToPath(import.meta.url)), 'scan.mjs');

// Built from parts so this file holds no key-shaped string.
const fakeKey = (type = 'api03', n = 40) => ['sk', 'ant', type].join('-') + '-' + 'Ab9_'.repeat(Math.ceil(n / 4)).slice(0, n);

function tree(extra = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'scan-'));
  const files = {
    'release.json': '{"version":"1.0.0"}',
    '.mcp.json': '{"command":"node"}',
    'mentor/server.mjs': 'export {}',
    'bridge/paths.mjs': 'export const p = "/Users/Shared/Knack"',
    'panel/helper/main.mjs': 'export {}',
    'panel/helper/node_modules/sdk/index.js': 'ok',
    'AEMentorPanel/index.html': '<html></html>',
    'runtime/node/bin/node': Buffer.from([0, 1, 2, 255, 254, 0, 7]),
    ...extra,
  };
  for (const [rel, body] of Object.entries(files)) {
    if (body === null) { mkdirSync(path.join(root, rel), { recursive: true }); continue; }
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  return root;
}
const kinds = async (root) => (await scan(root)).map((f) => `${f.path}|${f.kind}`);

test('clean tree passes, CLI exits 0 with a pass line', () => {
  const root = tree();
  const r = spawnSync('node', [SCAN, root], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /clean/);
  rmSync(root, { recursive: true });
});

const bad = {
  'CLAUDE.md': [{ 'CLAUDE.md': 'x' }, 'CLAUDE.md|CLAUDE.md'],
  'nested CLAUDE.md': [{ 'mentor/CLAUDE.md': 'x' }, 'mentor/CLAUDE.md|CLAUDE.md'],
  'auto-memory': [{ 'MEMORY.md': 'x' }, 'MEMORY.md|auto-memory file'],
  'sprint notes': [{ 'sprints/sprint-4-plan.md': 'x' }, 'sprints|sprint notes'],
  'eval fixtures': [{ 'evals/easing/fixtures/a.json': '{}' }, 'evals|eval fixture'],
  'test folder': [{ 'mentor/test/a.test.mjs': 'x' }, 'mentor/test|test/ folder'],
  '.git': [{ '.git/HEAD': 'ref' }, '.git|.git'],
  'mentor/fixture': [{ 'mentor/fixture/snap.json': '{}' }, 'mentor/fixture|mentor/fixture/'],
  'sk-ant string': [{ 'panel/helper/cfg.json': 'key=' + fakeKey() }, 'panel/helper/cfg.json|access key (sk-ant-...)'],
  'home path': [{ 'mentor/log.txt': 'at /Users/jane/Documents/x' }, 'mentor/log.txt|home path (/Users/<name>)'],
  'node_modules in panel': [{ 'panel/node_modules/x/i.js': 'a' }, 'panel/node_modules|node_modules in extension folder'],
  'node_modules in bridge': [{ 'bridge/cep/node_modules/x/i.js': 'a' }, 'bridge/cep/node_modules|node_modules in extension folder'],
  'node_modules in installed extension': [{ 'AEMentorBridge/node_modules/x.js': 'a' }, 'AEMentorBridge/node_modules|node_modules in extension folder'],
};
for (const [name, [extra, expected]] of Object.entries(bad)) {
  test(`fails: ${name}`, async () => {
    const root = tree(extra);
    const got = await kinds(root);
    assert.ok(got.includes(expected), `expected ${expected} in ${JSON.stringify(got)}`);
    const r = spawnSync('node', [SCAN, root], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.ok(r.stderr.includes(expected.split('|')[0]));
    rmSync(root, { recursive: true });
  });
}

test('sk-ant string is never echoed in the report', () => {
  const root = tree({ 'a.txt': fakeKey('api03', 40).replace('Ab9_Ab9_', 'SECRETSECRET') });
  const r = spawnSync('node', [SCAN, root], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.ok(!r.stderr.includes('SECRETSECRET'));
  rmSync(root, { recursive: true });
});

test('/Users/Shared is allowed, /Users/SharedX is not', async () => {
  const root = tree({ 'ok.txt': '/Users/Shared/x', 'no.txt': '/Users/SharedX/y' });
  const got = await kinds(root);
  assert.ok(!got.some((g) => g.startsWith('ok.txt')));
  assert.ok(got.some((g) => g.startsWith('no.txt')));
  rmSync(root, { recursive: true });
});

test('binary file with a match is caught, across a chunk boundary', async () => {
  const buf = Buffer.alloc((1 << 20) - 3, 0);
  const tail = Buffer.from('\u0000/Users/bob/x\u0000');
  const root = tree({ 'runtime/node/bin/big': Buffer.concat([buf, tail]) });
  const got = await kinds(root);
  assert.ok(got.includes('runtime/node/bin/big|home path (/Users/<name>)'));
  rmSync(root, { recursive: true });
});

test('a key in a binary file is caught, across a chunk boundary', async () => {
  const pre = Buffer.alloc((1 << 20) - 30, 0);
  const root = tree({ 'runtime/node/bin/big': Buffer.concat([pre, Buffer.from('\u0000' + fakeKey('oat01', 60) + '\u0000')]) });
  const got = await kinds(root);
  assert.ok(got.includes('runtime/node/bin/big|access key (sk-ant-...)'));
  rmSync(root, { recursive: true });
});

test('a key in a text file fails with each type segment', async () => {
  for (const type of ['api03', 'admin01', 'oat01']) {
    const root = tree({ 'notes.txt': `token: ${fakeKey(type)}\n` });
    assert.ok((await kinds(root)).includes('notes.txt|access key (sk-ant-...)'), type);
    rmSync(root, { recursive: true });
  }
});

test('too-short token after the type is not a key', async () => {
  const root = tree({ 'a.txt': fakeKey('api03', 19) });
  assert.deepEqual(await kinds(root), []);
  rmSync(root, { recursive: true });
});

const falseAlarms = {
  'errors.mjs scrubber regex': "const KEY = /sk-ant-[A-Za-z0-9_-]{8,}/g;",
  'mcp-client.mjs guard regex': "if (/sk-ant-/.test(text)) throw new Error('no');",
  'SDK doc placeholder': " * Authorization: Bearer sk-ant-req-... (set by the server)",
};
for (const [name, line] of Object.entries(falseAlarms)) {
  test(`passes: ${name}`, async () => {
    const root = tree({ 'panel/helper/lib/x.mjs': line + '\n' });
    assert.deepEqual(await kinds(root), []);
    rmSync(root, { recursive: true });
  });
}

test('symlinks are not followed', async () => {
  const root = tree();
  const outside = tree({ 'CLAUDE.md': 'x' });
  symlinkSync(outside, path.join(root, 'link'));
  assert.deepEqual(await kinds(root), []);
  rmSync(root, { recursive: true });
  rmSync(outside, { recursive: true });
});

test('lists every offender, not just the first', async () => {
  const root = tree({ 'CLAUDE.md': 'x', 'mentor/test/a.mjs': 'x', 'b.txt': fakeKey('admin01') });
  assert.equal((await scan(root)).length, 3);
  rmSync(root, { recursive: true });
});

test('missing folder and no argument exit 2', () => {
  assert.equal(spawnSync('node', [SCAN, '/nonexistent-scan-dir'], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync('node', [SCAN], { encoding: 'utf8' }).status, 2);
});

// ---- after a full lesson (spec 006 T027, SC-007): installed tree, logs and caches, sample report ----
import { scanAfterLesson } from './scan.mjs';

const FAKE_USER = 'zelda_test';
const LKEY = ['sk', 'ant', 'api03'].join('-') + '-LITERALFAKE_0123456789abc'; // 20+ after the type: also key-shaped
const OPAQUE = 'opaque_token_without_the_prefix_12345'; // only the literal check can see this
const email = (n = 'person') => `${n}@${['mail', 'org'].join('.')}`;
const phone = '(' + '801' + ') ' + '555' + '-' + '0142';

function lesson(parts = {}) {
  const mk = (files) => {
    const root = mkdtempSync(path.join(tmpdir(), 'scanl-'));
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), body);
    }
    return root;
  };
  return {
    installed: mk({ 'release.json': '{}', 'mentor/server.mjs': 'export {}', ...(parts.installed || {}) }),
    logs: mk({ 'helper.log': 'started', ...(parts.logs || {}) }),
    cache: mk({ 'x.cache': '{}', ...(parts.cache || {}) }),
    report: path.join(mk({ 'report.txt': parts.report ?? 'macOS 27\nAE 26.5\nall working' }), 'report.txt'),
  };
}
const run = (l, extra = {}) => scanAfterLesson({ installed: l.installed, logs: [l.logs, l.cache], report: l.report, userName: FAKE_USER, ...extra });
const lk = (f) => f.map((x) => `${x.path}|${x.kind}`);

test('after-lesson: clean installed tree, logs, caches and report pass', async () => {
  assert.deepEqual(await run(lesson()), []);
});

test('after-lesson: the installed tree keeps the staged rules (CLAUDE.md, home path, key shape)', async () => {
  const f = lk(await run(lesson({ installed: { 'CLAUDE.md': 'x', 'mentor/a.txt': '/Users/jane/x', 'b.txt': LKEY } })));
  assert.ok(f.includes('installed/CLAUDE.md|CLAUDE.md'));
  assert.ok(f.includes('installed/mentor/a.txt|home path (/Users/<name>)'));
  assert.ok(f.includes('installed/b.txt|access key (sk-ant-...)'));
});

test('after-lesson: logs, caches and the report are labelled and checked for key, path, email, phone, user name', async () => {
  const l = lesson({
    logs: { 'run.log': `warn ${LKEY}`, 'p.log': 'cwd /Users/jane/Documents', 'e.log': `from ${email()}`, 't.log': `call ${phone}` },
    cache: { 'sub/c.json': `{"owner":"${FAKE_USER}"}` },
    report: `AE 26.5\n${email('x')}\n`,
  });
  const f = lk(await run(l));
  assert.ok(f.includes('logs1/run.log|access key (sk-ant-...)'));
  assert.ok(f.includes('logs1/p.log|home path (/Users/<name>)'));
  assert.ok(f.includes('logs1/e.log|email address'));
  assert.ok(f.includes('logs1/t.log|phone number'));
  assert.ok(f.includes('logs2/sub/c.json|Mac user name'));
  assert.ok(f.includes('report|email address'));
});

test('after-lesson: the literal key is found even without the sk-ant shape, and never echoed', async () => {
  const l = lesson({ logs: { 'a.log': `x ${OPAQUE} y` } });
  const f = await run(l, { key: OPAQUE });
  assert.deepEqual(lk(f), ['logs1/a.log|access key (literal)']);
  assert.ok(!JSON.stringify(f).includes(OPAQUE));
});

test('after-lesson: placeholder emails, ordinary numbers and timestamps are not personal data', async () => {
  const l = lesson({ logs: { 'a.log': 'to you@example.com at 2026-11-09 12:30:45 id 1234567890 v1.2.3 801 ms' }, report: 'Tests: 801-555\n' });
  assert.deepEqual(await run(l), []);
});

test('after-lesson: third-party code under node_modules and runtime/ is exempt from email, phone and name checks only', async () => {
  const l = lesson({
    installed: {
      'panel/helper/node_modules/sdk/package.json': `{"author":"${email('dev')}","tel":"${phone}","u":"${FAKE_USER}"}`,
      'runtime/node/LICENSE': `contact ${email('lic')}`,
      'panel/helper/node_modules/sdk/leak.js': '/Users/jane/x',
    },
  });
  assert.deepEqual(lk(await run(l)), ['installed/panel/helper/node_modules/sdk/leak.js|home path (/Users/<name>)']);
});

test('after-lesson: our own installed files are not exempt from email and phone checks', async () => {
  const f = lk(await run(lesson({ installed: { 'panel.json': `{"contact":"${email()}"}`, 'mentor/n.txt': phone } })));
  assert.ok(f.includes('installed/panel.json|email address'));
  assert.ok(f.includes('installed/mentor/n.txt|phone number'));
});

test('after-lesson: the user name must stand alone, not sit inside another word', async () => {
  const l = lesson({ logs: { 'a.log': `${FAKE_USER}x and x${FAKE_USER} ok` } });
  assert.deepEqual(await run(l), []);
});

test('after-lesson: a missing folder or report throws', async () => {
  await assert.rejects(scanAfterLesson({ installed: '/nonexistent-scan-dir', userName: FAKE_USER }), /not found/);
  const l = lesson();
  await assert.rejects(scanAfterLesson({ installed: l.installed, report: '/nonexistent-report.txt', userName: FAKE_USER }), /not found/);
});

test('after-lesson CLI: exit 1 lists labelled paths and kinds, not the matched text', () => {
  const l = lesson({ logs: { 'e.log': `from ${email('sneaky')}` } });
  const r = spawnSync('node', [SCAN, '--after-lesson', '--installed', l.installed, '--logs', l.logs, '--logs', l.cache, '--report', l.report, '--user', FAKE_USER], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /logs1\/e\.log {2}\[email address\]/);
  assert.ok(!r.stderr.includes('sneaky'));
});

test('after-lesson CLI: clean exits 0; no --installed exits 2; the key comes from the environment only', () => {
  const l = lesson({ logs: { 'a.log': OPAQUE } });
  const args = ['--after-lesson', '--installed', l.installed, '--logs', l.logs, '--user', FAKE_USER];
  assert.equal(spawnSync('node', [SCAN, ...args], { encoding: 'utf8', env: { ...process.env, KNACK_EVAL_API_KEY: '' } }).status, 0);
  const hit = spawnSync('node', [SCAN, ...args], { encoding: 'utf8', env: { ...process.env, KNACK_EVAL_API_KEY: OPAQUE } });
  assert.equal(hit.status, 1);
  assert.ok(!hit.stderr.includes(OPAQUE) && !hit.stdout.includes(OPAQUE));
  assert.equal(spawnSync('node', [SCAN, '--after-lesson'], { encoding: 'utf8' }).status, 2);
});
