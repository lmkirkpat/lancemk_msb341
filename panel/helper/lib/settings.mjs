// The runtime settings (spec 013 FR-028, data-model › Runtime settings): one file the panel and
// the evals both read, so they always run the same model and settings. An eval run may name
// another file as an experiment; it's reported in `ready` and is never a baseline. The settings
// hash covers everything that decides what the model gets: this file, the preamble, the hand-over
// tool's definition, main.mjs and lib/.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPrices } from "./cost.mjs";

export const HELPER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_SETTINGS = path.join(HELPER_DIR, "settings.json");

const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
const DISPLAYS = ["omitted", "summarized", "updates"];
// Claude Haiku 5.5 has no server-side refusal fallback (research R10), and the claude-api
// reference doesn't list it for thinking display "updates" (Fable 5.1, Mythos 5.1, Fable 5,
// Opus 5.5 and Sonnet 5.5 only); "summarized" and "omitted" are documented for it.
const NO_FALLBACK = /^claude-haiku-5-5$/;
const NO_UPDATES = /^claude-haiku-5-5$/;

export class SettingsError extends Error {
  constructor(message) {
    super(message);
    this.code = "BAD_SETTINGS";
  }
}

const FIELDS = {
  version: (v) => v === 1 || "Other versions refused: version must be 1.",
  model: (v) => (typeof v === "string" && v.length > 0) || "model must be a model id.",
  effort: (v) => EFFORTS.includes(v) || `effort must be one of ${EFFORTS.join(", ")}.`,
  thinking_display: (v) => DISPLAYS.includes(v) || `thinking_display must be one of ${DISPLAYS.join(", ")}.`,
  cache_ttl: (v) => v === "5m" || v === "1h" || "cache_ttl must be 5m or 1h.",
  skill_placement: (v) => v === "system" || v === "message" || "skill_placement must be system or message.",
  max_steps: (v) => (Number.isInteger(v) && v >= 1 && v <= 100) || "max_steps must be a whole number from 1 to 100.",
  turn_timeout_ms: (v) => (Number.isInteger(v) && v >= 100) || "turn_timeout_ms must be a whole number of milliseconds.",
  max_tokens: (v) => (Number.isInteger(v) && v >= 1 && v <= 128000) || "max_tokens must be a whole number up to 128000.",
  fallbacks: (v) => v === "default" || v === null || 'fallbacks must be "default" or null.',
};

// raw settings + the price table → validated settings. Throws SettingsError.
export function validateSettings(raw, prices) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SettingsError("The settings file isn't a JSON object.");
  for (const k of Object.keys(raw)) if (!(k in FIELDS)) throw new SettingsError(`Unknown setting ${k}.`);
  for (const [k, check] of Object.entries(FIELDS)) {
    if (!(k in raw)) throw new SettingsError(`Missing setting ${k}.`);
    const ok = check(raw[k]);
    if (ok !== true) throw new SettingsError(ok);
  }
  if (!prices || !prices.models || !prices.models[raw.model]) {
    throw new SettingsError(`The model ${raw.model} has no row in the price table, so the helper refuses to start.`);
  }
  const s = { ...raw };
  if (NO_FALLBACK.test(s.model)) s.fallbacks = null;
  if (NO_UPDATES.test(s.model) && s.thinking_display === "updates") s.thinking_display = "omitted";
  return Object.freeze(s);
}

// The files whose bytes make up the settings hash, as [label, absolute path], in a fixed order.
export function hashedFiles(settingsFile, helperDir = HELPER_DIR) {
  const lib = fs
    .readdirSync(path.join(helperDir, "lib"))
    .filter((n) => n.endsWith(".mjs"))
    .sort()
    .map((n) => [`lib/${n}`, path.join(helperDir, "lib", n)]);
  return [
    ["settings", settingsFile],
    ["preamble.md", path.join(helperDir, "preamble.md")],
    ["skill-tool.json", path.join(helperDir, "skill-tool.json")],
    ["main.mjs", path.join(helperDir, "main.mjs")],
    ...lib,
  ];
}

export function settingsHash(settingsFile, helperDir = HELPER_DIR) {
  const h = crypto.createHash("sha256");
  for (const [label, file] of hashedFiles(settingsFile, helperDir)) {
    let bytes;
    try {
      bytes = fs.readFileSync(file);
    } catch {
      bytes = Buffer.from("<missing>");
    }
    h.update(`${label}\0${bytes.length}\0`);
    h.update(bytes);
  }
  return h.digest("hex");
}

// → { settings, hash, file, isDefault, prices }. Throws SettingsError.
export function loadSettings(file, helperDir = HELPER_DIR) {
  const settingsFile = file ? path.resolve(file) : path.join(helperDir, "settings.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
  } catch {
    throw new SettingsError("The settings file can't be read.");
  }
  let prices;
  try {
    prices = loadPrices(path.join(helperDir, "prices.json"));
  } catch {
    throw new SettingsError("The price table can't be read.");
  }
  const settings = validateSettings(raw, prices);
  return {
    settings,
    prices,
    file: settingsFile,
    isDefault: settingsFile === path.join(helperDir, "settings.json"),
    hash: settingsHash(settingsFile, helperDir),
  };
}
