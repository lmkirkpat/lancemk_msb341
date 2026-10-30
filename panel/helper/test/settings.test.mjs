import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSettings, validateSettings, settingsHash, hashedFiles, HELPER_DIR, DEFAULT_SETTINGS } from "../lib/settings.mjs";
import { loadPrices } from "../lib/cost.mjs";

const prices = loadPrices(path.join(HELPER_DIR, "prices.json"));
const base = () => JSON.parse(fs.readFileSync(DEFAULT_SETTINGS, "utf8"));
const temps = [];
after(() => temps.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

test("the repo's settings: Opus 5.5 at B1's medium effort and adaptive thinking with updates (T001)", () => {
  const { settings, isDefault, hash, file } = loadSettings();
  assert.equal(isDefault, true);
  assert.equal(file, DEFAULT_SETTINGS);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.deepEqual({ ...settings }, {
    version: 1,
    model: "claude-opus-5-5",
    effort: "medium",
    thinking_display: "updates",
    cache_ttl: "5m",
    skill_placement: "system",
    max_steps: 12,
    turn_timeout_ms: 300000,
    max_tokens: 32000,
    fallbacks: "default",
  });
  assert.ok(Object.isFrozen(settings));
});

test("other versions, unknown or missing fields and bad values are refused", () => {
  const bad = (patch, re) => assert.throws(() => validateSettings({ ...base(), ...patch }, prices), re);
  bad({ version: 2 }, /Other versions refused/);
  bad({ effort: "turbo" }, /effort/);
  bad({ thinking_display: "full" }, /thinking_display/);
  bad({ cache_ttl: "10m" }, /cache_ttl/);
  bad({ skill_placement: "user" }, /skill_placement/);
  bad({ max_steps: 0 }, /max_steps/);
  bad({ turn_timeout_ms: "5m" }, /turn_timeout_ms/);
  bad({ max_tokens: 500000 }, /max_tokens/);
  bad({ fallbacks: [{ model: "claude-opus-5" }] }, /fallbacks/);
  bad({ temperature: 0.2 }, /Unknown setting temperature/);
  const missing = base();
  delete missing.effort;
  assert.throws(() => validateSettings(missing, prices), /Missing setting effort/);
});

test("a model without a price row refuses to start", () => {
  assert.throws(() => validateSettings({ ...base(), model: "claude-opus-4-8" }, prices), /no row in the price table/);
});

test("fallbacks is forced to null on Haiku 5.5, kept on Sonnet 5.5", () => {
  assert.equal(validateSettings({ ...base(), model: "claude-haiku-5-5" }, prices).fallbacks, null);
  assert.equal(validateSettings({ ...base(), model: "claude-sonnet-5-5" }, prices).fallbacks, "default");
  assert.equal(validateSettings({ ...base(), fallbacks: null }, prices).fallbacks, null);
});

test("another settings file (an eval experiment) is loaded and reported as not the default", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "settings-"));
  temps.push(dir);
  const f = path.join(dir, "sonnet.json");
  fs.writeFileSync(f, JSON.stringify({ ...base(), model: "claude-sonnet-5-5" }));
  const s = loadSettings(f);
  assert.equal(s.isDefault, false);
  assert.equal(s.settings.model, "claude-sonnet-5-5");
  assert.notEqual(s.hash, loadSettings().hash);
  assert.throws(() => loadSettings(path.join(dir, "missing.json")), /can't be read/);
});

test("the hash covers the settings, preamble, hand-over tool, main.mjs and lib/", () => {
  const labels = hashedFiles(DEFAULT_SETTINGS).map(([l]) => l);
  assert.deepEqual(labels.slice(0, 4), ["settings", "preamble.md", "skill-tool.json", "main.mjs"]);
  assert.ok(labels.includes("lib/loop.mjs") && labels.includes("lib/settings.mjs"));

  // A copy of the helper's hashed files, changed one at a time.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helper-copy-"));
  temps.push(dir);
  fs.mkdirSync(path.join(dir, "lib"));
  for (const [label, file] of hashedFiles(DEFAULT_SETTINGS)) {
    const to = label === "settings" ? path.join(dir, "settings.json") : path.join(dir, label);
    if (fs.existsSync(file)) fs.copyFileSync(file, to);
  }
  const copyHash = () => settingsHash(path.join(dir, "settings.json"), dir);
  const h0 = copyHash();
  assert.equal(h0, settingsHash(DEFAULT_SETTINGS), "same bytes, same hash, wherever the helper lives");
  for (const rel of ["settings.json", "preamble.md", "skill-tool.json", "lib/settings.mjs"]) {
    const f = path.join(dir, rel);
    const before = fs.readFileSync(f);
    fs.appendFileSync(f, " ");
    assert.notEqual(copyHash(), h0, rel);
    fs.writeFileSync(f, before);
  }
  assert.equal(copyHash(), h0);
});
