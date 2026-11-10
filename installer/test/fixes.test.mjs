// installer/lib/fixes.mjs (T025, FR-022, US2 scenario 4): Fix re-runs one part from the installer's
// payload or makes a missing folder, then checks again. It's offered only where that's safe, and
// it never touches the learner record.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { install } from "../install.mjs";
import { layout } from "../lib/layout.mjs";
import { fixesFor, applyFix, FIX_TEXT } from "../lib/fixes.mjs";
import { runChecks, TEXT } from "../lib/checks.mjs";
import { tmpdir, write, makePayload, makeNodeDir, makeApps, makeRun, snapshot } from "./fixtures.mjs";

async function setup(t, o = {}) {
  const sandbox = tmpdir(t, "knack-fix-");
  const home = path.join(sandbox, "home");
  fs.mkdirSync(home);
  const L = layout(home);
  const apps = makeApps(t, ["26.5"]);
  const state = { macos: "27.0.1", aeOpen: false };
  const run = makeRun(state);
  const payloadDir = makePayload(t, { version: o.version || "0.1.0" });
  assert.equal((await install({ home, payloadDir, nodeDir: makeNodeDir(t), run, dirs: [apps] })).ok, true);
  write(L.learner, "learner.json", '{"lessons":[1]}');
  write(L.learner, "panel-loaded.json", JSON.stringify({ version: o.version || "0.1.0", at: "2026-11-09T12:00:00.000Z" }));
  const deps = { L, run, dirs: [apps], keyCheck: async () => "works", budgetMs: 4000 };
  const check = async () => runChecks(deps);
  return { home, L, run, state, apps, payloadDir, deps, check };
}
const line = (r, id) => r.checks.find((c) => c.id === id);

test("a missing learner home: Fix makes the folder, checks again, and nothing else changes", async (t) => {
  const s = await setup(t);
  fs.rmSync(s.L.learner, { recursive: true });
  const before = snapshot(s.L.support);
  const r1 = await s.check();
  assert.deepEqual(fixesFor(r1, { L: s.L }), ["record_folder"], "offered with no payload too");
  const f = await applyFix("record_folder", { ...s.deps });
  assert.equal(f.ok, true);
  assert.equal(f.text, FIX_TEXT.fixed);
  assert.equal(line(f.result, "record_folder").state, "working");
  const after = snapshot(s.L.support);
  assert.deepEqual(Object.keys(after).filter((k) => !(k in before)), ["AEMentor"], "only the folder was added");
});

test("a learner home that's a file, or can't be written, isn't offered, and Fix leaves it alone", async (t) => {
  const s = await setup(t);
  fs.rmSync(s.L.learner, { recursive: true });
  write(path.dirname(s.L.learner), "AEMentor", "not a folder");
  const r = await s.check();
  assert.equal(line(r, "record_folder").state, "not_working");
  assert.deepEqual(fixesFor(r, { L: s.L }), []);
  const f = await applyFix("record_folder", s.deps);
  assert.deepEqual([f.ok, f.reason, f.text], [false, "not_fixable", FIX_TEXT.not_fixable]);
  assert.equal(fs.readFileSync(s.L.learner, "utf8"), "not a folder");
});

test("a missing extension: offered only with this version's payload, refused while AE is open, then put back", async (t) => {
  const s = await setup(t);
  const panel = path.join(s.L.cep, "AEMentorPanel");
  fs.rmSync(panel, { recursive: true });
  const r = await s.check();
  assert.deepEqual(fixesFor(r, { L: s.L }), [], "no payload, nothing to put back");
  assert.deepEqual(fixesFor(r, { L: s.L, payloadDir: makePayload(t, { version: "0.2.0" }) }), [], "another version's payload is an update, not a fix");
  assert.deepEqual(fixesFor(r, { L: s.L, payloadDir: s.payloadDir }), ["ext_panel"]);

  const learner = snapshot(s.L.learner);
  const bridge = snapshot(path.join(s.L.cep, "AEMentorBridge"));
  s.state.aeOpen = true;
  const before = snapshot(s.L.support);
  const busy = await applyFix("ext_panel", { ...s.deps, payloadDir: s.payloadDir });
  assert.deepEqual([busy.ok, busy.reason, busy.text], [false, "ae_open", FIX_TEXT.ae_open]);
  assert.deepEqual(snapshot(s.L.support), before, "nothing changed while AE is open");
  s.state.aeOpen = false;

  const f = await applyFix("ext_panel", { ...s.deps, payloadDir: s.payloadDir });
  assert.equal(f.ok, true, f.text);
  assert.equal(line(f.result, "ext_panel").state, "working");
  assert.deepEqual(snapshot(panel), snapshot(path.join(s.payloadDir, "cep", "AEMentorPanel")));
  assert.deepEqual(snapshot(path.join(s.L.cep, "AEMentorBridge")), bridge, "only that part");
  assert.deepEqual(snapshot(s.L.learner), learner, "learner home untouched");
  assert.ok(!fs.existsSync(s.L.tmp), "no work folder left");
});

test("mixed versions: Fix re-places only the extension that's off, from this version's payload", async (t) => {
  const s = await setup(t);
  const m = path.join(s.L.cep, "AEMentorBridge", "CSXS", "manifest.xml");
  fs.writeFileSync(m, fs.readFileSync(m, "utf8").replace('ExtensionBundleVersion="0.1.0"', 'ExtensionBundleVersion="0.0.9"'));
  const panel = snapshot(path.join(s.L.cep, "AEMentorPanel"));
  const r = await s.check();
  assert.equal(line(r, "versions_match").text, TEXT.versions_match.mixed.text);
  assert.deepEqual(fixesFor(r, { L: s.L, payloadDir: s.payloadDir }), ["versions_match"]);
  const learner = snapshot(s.L.learner);
  const f = await applyFix("versions_match", { ...s.deps, payloadDir: s.payloadDir });
  assert.equal(f.ok, true);
  assert.equal(line(f.result, "versions_match").state, "working");
  assert.deepEqual(snapshot(path.join(s.L.cep, "AEMentorPanel")), panel);
  assert.deepEqual(snapshot(s.L.learner), learner);
});

test("never offered: a developer link, an old panel still open, the key, the scripting setting", async (t) => {
  const s = await setup(t);
  const repo = tmpdir(t, "knack-repo-");
  fs.rmSync(path.join(s.L.cep, "AEMentorPanel"), { recursive: true });
  fs.symlinkSync(repo, path.join(s.L.cep, "AEMentorPanel"));
  const r = await s.check();
  assert.equal(line(r, "ext_panel").state, "not_working");
  assert.deepEqual(fixesFor(r, { L: s.L, payloadDir: s.payloadDir }), []);
  const f = await applyFix("ext_panel", { ...s.deps, payloadDir: s.payloadDir });
  assert.equal(f.reason, "not_fixable");
  assert.ok(fs.lstatSync(path.join(s.L.cep, "AEMentorPanel")).isSymbolicLink(), "the link is left alone");
  const fake = { checks: [
    { id: "versions_match", state: "not_working", text: TEXT.versions_match.stale_panel.text },
    { id: "key", state: "not_working", text: TEXT.key.rejected.text },
    { id: "ae_scripting", state: "not_working", text: "x" },
  ] };
  assert.deepEqual(fixesFor(fake, { L: s.L, payloadDir: s.payloadDir }), []);
  assert.equal((await applyFix("key", s.deps)).reason, "not_fixable");
});

test("Fix's messages are plain (FR-022)", () => {
  for (const text of Object.values(FIX_TEXT)) {
    assert.doesNotMatch(text, /\/|`|\b[a-z]+_[a-z_]+\b|\b[A-Z]{3,}\b|\b(npm|node|bash|Terminal|JSON)\b/, text);
    assert.ok(text.split(/(?<=[.!?])\s+/).length <= 2, text);
  }
});
