// Spec 006 T007 (data-model › Panel stamp, contracts/setup-check.md › panel_loads): at start-up the
// panel writes panel-loaded.json to the learner home with the manifest's bundle version and the
// time, by temp file and rename, and never throws.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { writeLoadedStamp, manifestVersion, FILE } = require("../lib/loaded-stamp.js");

const PANEL = path.join(__dirname, "..");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "panel-stamp-"));

function fakePanel(manifest) {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, "CSXS"));
  if (manifest !== undefined) fs.writeFileSync(path.join(dir, "CSXS", "manifest.xml"), manifest);
  return dir;
}

test("the version is the manifest's ExtensionBundleVersion", () => {
  const real = fs.readFileSync(path.join(PANEL, "CSXS", "manifest.xml"), "utf8").match(/ExtensionBundleVersion="([^"]+)"/)[1];
  assert.equal(manifestVersion(PANEL), real);
  assert.equal(manifestVersion(fakePanel('<ExtensionManifest Version="7.0" ExtensionBundleId="x" ExtensionBundleVersion="1.2.3">')), "1.2.3");
  assert.equal(manifestVersion(fakePanel("<ExtensionManifest>")), null, "no version attribute");
  assert.equal(manifestVersion(fakePanel()), null, "no manifest");
});

test("writes { version, at } to panel-loaded.json in the learner home", () => {
  const home = tmp();
  const now = new Date("2026-11-09T17:00:00.000Z");
  assert.equal(writeLoadedStamp({ home, panelDir: PANEL, now: () => now }), true);
  assert.equal(FILE, "panel-loaded.json");
  const stamp = JSON.parse(fs.readFileSync(path.join(home, FILE), "utf8"));
  assert.deepEqual(stamp, { version: manifestVersion(PANEL), at: "2026-11-09T17:00:00.000Z" });
  assert.deepEqual(fs.readdirSync(home), [FILE], "no temp file left behind, nothing else written");
});

test("rewritten on each load", () => {
  const home = tmp();
  writeLoadedStamp({ home, panelDir: fakePanel('ExtensionBundleVersion="0.1.0"'), now: () => new Date("2026-11-01T00:00:00Z") });
  writeLoadedStamp({ home, panelDir: fakePanel('ExtensionBundleVersion="0.2.0"'), now: () => new Date("2026-11-02T00:00:00Z") });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, FILE), "utf8")), { version: "0.2.0", at: "2026-11-02T00:00:00.000Z" });
});

test("the home defaults to AE_MENTOR_HOME or the AEMentor folder, as the rest of the panel", () => {
  const home = tmp();
  const saved = process.env.AE_MENTOR_HOME;
  process.env.AE_MENTOR_HOME = home;
  try {
    assert.equal(writeLoadedStamp({ panelDir: PANEL }), true);
    assert.ok(fs.existsSync(path.join(home, FILE)));
  } finally {
    if (saved === undefined) delete process.env.AE_MENTOR_HOME; else process.env.AE_MENTOR_HOME = saved;
  }
});

test("atomic: the stamp goes to a temp file, then is renamed into place", () => {
  const home = tmp();
  const calls = [];
  const spy = Object.assign({}, fs, {
    writeFileSync: (f, ...rest) => { calls.push(["write", path.basename(f)]); return fs.writeFileSync(f, ...rest); },
    renameSync: (a, b) => { calls.push(["rename", path.basename(a), path.basename(b)]); return fs.renameSync(a, b); },
  });
  writeLoadedStamp({ fs: spy, home, panelDir: PANEL });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], "write");
  assert.notEqual(calls[0][1], FILE);
  assert.deepEqual(calls[1], ["rename", calls[0][1], FILE]);
});

test("never throws: a missing home, an unreadable manifest, a failed rename", () => {
  const missing = path.join(tmp(), "not-here");
  assert.equal(writeLoadedStamp({ home: missing, panelDir: PANEL }), false);
  assert.equal(fs.existsSync(missing), false, "doesn't create the learner home");

  const home = tmp();
  assert.equal(writeLoadedStamp({ home, panelDir: fakePanel() }), false, "no version, no stamp");
  assert.deepEqual(fs.readdirSync(home), []);

  const failing = Object.assign({}, fs, { renameSync: () => { throw new Error("EACCES"); } });
  assert.equal(writeLoadedStamp({ fs: failing, home, panelDir: PANEL }), false);
  assert.deepEqual(fs.readdirSync(home), [], "the temp file is removed");

  const broken = { readFileSync: () => { throw new Error("boom"); }, writeFileSync: () => { throw new Error("boom"); } };
  assert.doesNotThrow(() => writeLoadedStamp({ fs: broken, home, panelDir: PANEL }));
});

test("touches only the manifest and the stamp: no record, project, panel config or key", () => {
  const src = fs.readFileSync(path.join(PANEL, "lib", "loaded-stamp.js"), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /learner\.json|session\.json|path\.json|panel\.json|\.aep|security|Keychain|key/i);
  assert.doesNotMatch(src, /require\("(child_process|http|https|net)"\)/);
});

test("main.js writes the stamp once, at start-up", () => {
  const main = fs.readFileSync(path.join(PANEL, "main.js"), "utf8");
  assert.equal((main.match(/writeLoadedStamp\(/g) || []).length, 1);
  assert.ok(main.indexOf("writeLoadedStamp(") < main.indexOf("loadConfig()"), "before the config, so a setup problem still shows the panel loaded");
});
