// Spec 004 tasks-wave-b T189 (second pass; FR-044, research R25 as amended): the server hashes only
// what it runs (its folder's `git ls-tree HEAD` listing without `test` and `dev`), and never starts
// git without a `.git` folder or file in its folder or above. The listing read and the process start
// are injected: no real git here. server-current.test.mjs (T175) stands unchanged.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "practice2-before.json") }));

const current = await import("../lib/server-current.mjs");
const { TOOLS } = await import("../tools/index.mjs");
after(() => current.setHashReader(null));

const h = (c) => c.repeat(40);
const ENTRIES = {
  dev: `040000 tree ${h("1")}\tdev`,
  fixture: `040000 tree ${h("2")}\tfixture`,
  "fixture.mjs": `100644 blob ${h("3")}\tfixture.mjs`,
  jsx: `040000 tree ${h("4")}\tjsx`,
  lib: `040000 tree ${h("5")}\tlib`,
  "package.json": `100644 blob ${h("6")}\tpackage.json`,
  "server.mjs": `100644 blob ${h("7")}\tserver.mjs`,
  test: `040000 tree ${h("8")}\ttest`,
  tools: `040000 tree ${h("9")}\ttools`,
};
const listing = (changed = null) =>
  Object.entries(ENTRIES).map(([name, line]) => (name === changed ? line.replace(/ ([0-9a-f]{40})\t/, ` ${h("f")}\t`) : line)).join("\n") + "\n";

// A folder with a `.git` file two levels up, as in a worktree, so the read starts its (injected)
// process wherever this test runs, a copy with no checkout included.
function checkoutDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-checkout-"));
  const dir = path.join(root, "a", "mentor");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(root, ".git"), "gitdir: /somewhere/.git/worktrees/x\n");
  return dir;
}
const CHECKOUT = checkoutDir();

// A server started on `atStart`, then asked with `now`, through the real default read on the
// folder above, with only the process start replaced.
async function verdict(atStart, now) {
  let text = atStart;
  const run = async () => text;
  current.setHashReader(current.listingReader({ dir: CHECKOUT, run }), { timeoutMs: 200 });
  await current.recordStart();
  text = now;
  return current.serverCurrent();
}

for (const name of ["test", "dev"]) {
  test(`listings that differ only on the ${name} line: true`, async () => {
    assert.equal(await verdict(listing(), listing(name)), true);
  });
}

for (const name of ["lib", "tools", "jsx", "fixture", "fixture.mjs", "server.mjs", "package.json"]) {
  test(`listings that differ on ${name}: false`, async () => {
    assert.equal(await verdict(listing(), listing(name)), false);
  });
}

test("a new runtime entry at the top counts: false", async () => {
  assert.equal(await verdict(listing(), listing() + `040000 tree ${h("a")}\tnewdir\n`), false);
});

for (const [what, bad] of [["empty", ""], ["malformed", "fatal: not a tree object\n"], ["partly malformed", listing() + "garbage\n"], ["only test and dev", `${ENTRIES.test}\n${ENTRIES.dev}\n`]]) {
  test(`an ${what} listing, at start or now: null`, async () => {
    assert.equal(await verdict(bad, listing()), null, "at start");
    assert.equal(await verdict(listing(), bad), null, "now");
  });
}

test("a process start that fails: null", async () => {
  current.setHashReader(current.listingReader({ dir: CHECKOUT, run: async () => { throw new Error("git: command not found"); } }), { timeoutMs: 200 });
  await current.recordStart();
  assert.equal(await current.serverCurrent(), null);
});

test("git is started in the reader's folder (the server's by default), with ls-tree HEAD", async () => {
  const seen = [];
  const reader = current.listingReader({ dir: CHECKOUT, run: async (args, opts) => { seen.push({ args, cwd: opts.cwd }); return listing(); } });
  assert.match(await reader(), /^[0-9a-f]{64}$/);
  assert.deepEqual(seen, [{ args: ["ls-tree", "HEAD"], cwd: CHECKOUT }]);
});

const tmpInCheckout = current.hasCheckoutAbove(os.tmpdir());

test("no .git in the folder or any folder above it: null, and git is never started", { skip: tmpInCheckout && "the OS temp folder is inside a checkout" }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-nogit-"));
  const deep = path.join(dir, "a", "mentor");
  fs.mkdirSync(deep, { recursive: true });
  let started = 0;
  const reader = current.listingReader({ dir: deep, run: async () => { started += 1; return listing(); } });
  assert.equal(await reader(), null);
  assert.equal(started, 0);
  current.setHashReader(reader, { timeoutMs: 200 });
  await current.recordStart();
  assert.equal(await current.serverCurrent(), null);
  assert.equal(started, 0, "neither at start nor now");
});

test("a .git file two levels up, as in a worktree: git is started", { skip: tmpInCheckout && "the OS temp folder is inside a checkout" }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-worktree-"));
  const deep = path.join(dir, "a", "mentor");
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(dir, ".git"), "gitdir: /somewhere/.git/worktrees/x\n");
  let started = 0;
  const reader = current.listingReader({ dir: deep, run: async () => { started += 1; return listing(); } });
  assert.match(await reader(), /^[0-9a-f]{64}$/);
  assert.equal(started, 1);
});

test("no reply carries the hash, the listing or a path", async () => {
  let text = listing();
  current.setHashReader(current.listingReader({ dir: CHECKOUT, run: async () => text }), { timeoutMs: 200 });
  await current.recordStart();
  text = listing("lib");
  const hashes = [listing(), listing("lib")].map((l) => current.listingHash(l));
  for (const [name, args] of [["read_learner_record", {}], ["speed_graph_snapshot", {}], ["key_types_snapshot", {}], ["offset_snapshot", {}]]) {
    const out = (await TOOLS.find((t) => t.name === name).handler(args)).content[0].text;
    assert.equal(JSON.parse(out).server_current, false, name);
    for (const hash of hashes) assert.ok(!out.includes(hash), `${name} has no hash`);
    assert.ok(!out.includes(h("5")) && !out.includes("ls-tree"), `${name} has no listing`);
    assert.ok(!out.includes(current.MENTOR_DIR) && !out.includes(CHECKOUT), `${name} has no path`);
  }
});
