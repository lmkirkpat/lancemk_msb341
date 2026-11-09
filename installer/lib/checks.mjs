// The setup check's lines (specs/006-installer T013, contracts/setup-check.md, FR-021, FR-022).
// Reads only, apart from a test file in the learner home that is removed at once. Every line's
// text and fix are one plain sentence each: no paths, field names, codes or commands. The bridge
// token is read from bridge.json and never printed; the key is never seen (the helper reads it).

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { EXTENSIONS, MIN_AE, MIN_MACOS } from "./layout.mjs";
import { findAE, aeRunning, macosVersion, appDirs } from "./ae.mjs";
import { atLeast, parseVersion } from "./versions.mjs";
import { checkKey } from "./keychain.mjs";
import { readJson } from "./preflight.mjs";

export const STATES = Object.freeze(["working", "not_working", "needs_ae", "not_checked"]);
export const IDS = Object.freeze([
  "macos",
  "ae_version",
  "ext_bridge",
  "ext_panel",
  "bridge_answers",
  "panel_loads",
  "ae_scripting",
  "cep_can_load",
  "key",
  "record_folder",
  "record_read",
  "versions_match",
]);
const PART = {
  macos: "mac",
  ae_version: "ae",
  ext_bridge: "ae-pipe",
  ext_panel: "panel",
  bridge_answers: "ae-pipe",
  panel_loads: "panel",
  ae_scripting: "ae",
  cep_can_load: "ae",
  key: "helper",
  record_folder: "learner-record",
  record_read: "learner-record",
  versions_match: "all",
};

// The fixed script for the scripting setting (research R8; T004: only this section name holds the
// key on AE 26 and 27, and a plain getPrefAsLong under another section still returns a number, so
// havePref decides). It reads; it never writes a file to test.
export const SCRIPTING_SECTION = "Main Pref Section v2";
export const SCRIPTING_KEY = "Pref_SCRIPTING_FILE_NETWORK_SECURITY";
export const SCRIPTING_SCRIPT =
  `var s = "${SCRIPTING_SECTION}", k = "${SCRIPTING_KEY}";\n` +
  `var have = app.preferences.havePref(s, k);\n` +
  `return { have: have, value: have ? app.preferences.getPrefAsLong(s, k) : null };`;

// The first After Effects release expected to have CEP off by default (Dec 2028, AE 2029). A
// guess until Adobe says; T024 finishes this line.
export const CEP_OFF_FROM_MAJOR = 29;

const SETTING = "After Effects > Settings > Scripting & Expressions, and tick Allow Scripts to Write Files and Access Network";
const AGAIN = "Open the Knack installer again.";

export const TEXT = Object.freeze({
  needs_ae: "Open After Effects to check this.",
  timeout: { text: "This took too long to check.", fix: "Check again in a minute." },
  macos: {
    working: (v) => `macOS ${v} is supported.`,
    not_working: { text: "This version of macOS is older than Knack supports.", fix: "Update macOS, then check again." },
    not_checked: { text: "Knack couldn't tell which version of macOS this is.", fix: "Restart the Mac, then check again." },
  },
  ae_version: {
    working: (vs) => `Found After Effects ${listVersions(vs)}.`,
    none: { text: "After Effects isn't installed.", fix: "Install After Effects 2026 or later from Creative Cloud." },
    old: (vs) => ({ text: `After Effects ${listVersions(vs)} is older than Knack supports.`, fix: "Update After Effects from Creative Cloud." }),
  },
  ext_bridge: {
    working: "Knack's connection to After Effects is in place.",
    not_working: { text: "Knack's connection to After Effects is missing.", fix: AGAIN },
  },
  ext_panel: {
    working: "The Knack panel is in place.",
    not_working: { text: "The Knack panel is missing.", fix: AGAIN },
  },
  bridge_answers: {
    working: "After Effects answers Knack.",
    not_working: { text: "After Effects is open, but it isn't answering Knack.", fix: "Quit After Effects and open it again, then check again." },
  },
  panel_loads: {
    working: "The Knack panel has opened in After Effects.",
    not_working: { text: "The Knack panel hasn't opened yet.", fix: "In After Effects, choose Window > Extensions > Knack, then check again." },
  },
  ae_scripting: {
    working: "After Effects lets Knack's scripts run.",
    not_working: { text: "After Effects doesn't let Knack's scripts run yet.", fix: `Open ${SETTING}.` },
    unread: { text: "Knack couldn't read this setting in this version of After Effects.", fix: `Make sure it's on: open ${SETTING}.` },
    no_bridge: { text: "Knack can check this once After Effects answers it.", fix: "Fix the line about After Effects answering first." },
  },
  cep_can_load: {
    working: "After Effects can load Knack.",
    not_working: { text: "This version of After Effects no longer loads Knack's kind of panel.", fix: "Use an earlier version of After Effects for now." },
  },
  key: {
    works: { state: "working", text: "Your access key works.", fix: null },
    rejected: { state: "not_working", text: "Your access key doesn't work any more.", fix: "Ask whoever gave you Knack for a new key, then open the installer again to add it." },
    out_of_credit: { state: "not_working", text: "Your access key works, but its account is out of credit.", fix: "Add credit to the account, then check again." },
    offline: { state: "not_checked", text: "Your access key is not yet checked, because Knack couldn't reach the service.", fix: "Check your internet connection, then check again." },
    no_key: { state: "not_working", text: "No access key is saved yet.", fix: "When you're online, open the Knack installer again and add your key." },
    unknown: { state: "not_checked", text: "Knack couldn't check your access key just now.", fix: "Check again in a minute." },
  },
  record_folder: {
    working: "Knack can save your lesson history.",
    missing: { text: "Knack's folder for your lesson history is missing.", fix: AGAIN },
    not_writable: { text: "Knack can't save your lesson history on this Mac.", fix: "Send a note to whoever gave you Knack." },
  },
  record_read: {
    none: "No lessons recorded yet.",
    working: "Your lesson history reads fine.",
    not_working: { text: "Your lesson history can't be read, so Knack left it as it is.", fix: "Send a note to whoever gave you Knack." },
  },
  versions_match: {
    working: (v) => `Every part of Knack is version ${v}.`,
    not_installed: { text: "Knack isn't installed completely.", fix: AGAIN },
    mixed: { text: "Some parts of Knack are from different versions.", fix: AGAIN },
    stale_panel: { text: "After Effects still has the earlier Knack open.", fix: "Quit After Effects and open it again, then check again." },
  },
});

function listVersions(vs) {
  if (vs.length <= 1) return vs.join("");
  return `${vs.slice(0, -1).join(", ")} and ${vs[vs.length - 1]}`;
}

const line = (id, state, text, fix = null) => ({ id, part: PART[id], state, text, fix: state === "working" ? null : fix });
const needsAe = (id) => line(id, "needs_ae", TEXT.needs_ae);

// One request to the bridge on this Mac. → { status, json } or { error }.
export function bridgeCall({ port, token, method = "GET", urlPath = "/health", body, timeoutMs = 3000 }) {
  return new Promise((resolve) => {
    const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
        path: urlPath,
        headers: {
          Host: `127.0.0.1:${port}`,
          Authorization: `Bearer ${token}`,
          ...(data ? { "Content-Type": "application/json", "Content-Length": data.length } : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (d) => (text += d));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ error: "timeout" });
    });
    req.on("error", (e) => resolve({ error: (e && e.code) || "error" }));
    if (data) req.write(data);
    req.end();
  });
}

function bridgeConfig(L) {
  const cfg = readJson(L.bridgeConfig);
  if (!cfg || typeof cfg.token !== "string" || !Number.isInteger(cfg.port)) return null;
  return { port: cfg.port, token: cfg.token };
}

function manifestVersion(file) {
  try {
    const m = /ExtensionBundleVersion="([^"]+)"/.exec(fs.readFileSync(file, "utf8"));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function extensionInPlace(L, name) {
  const dir = path.join(L.cep, name);
  try {
    if (fs.lstatSync(dir).isSymbolicLink()) return false;
  } catch {
    return false;
  }
  return fs.existsSync(path.join(dir, "META-INF", "signatures.xml")) && fs.existsSync(path.join(dir, "CSXS", "manifest.xml"));
}

// Resolves to `fallback` if `p` hasn't settled by `deadline` (ms since epoch).
function by(deadline, p, fallback) {
  const wait = Math.max(0, deadline - Date.now());
  let timer;
  return Promise.race([p.finally(() => clearTimeout(timer)), new Promise((r) => (timer = setTimeout(() => r(fallback), wait)))]);
}

// opts: { L, run, tools, dirs, keyCheck, budgetMs, bridgeTimeoutMs, arch }
// → the result object of contracts/setup-check.md.
export async function runChecks(opts) {
  const { L } = opts;
  const deadline = Date.now() + (opts.budgetMs || 13000);
  const toolArgs = { run: opts.run, tools: opts.tools };
  const release = readJson(path.join(L.current, "release.json"));
  const version = release && parseVersion(release.version) ? release.version : null;

  const [macos, ae, open] = await Promise.all([
    by(deadline, macosVersion(toolArgs), null),
    by(deadline, findAE({ dirs: opts.dirs || appDirs(L.home), ...toolArgs }), []),
    by(deadline, aeRunning(toolArgs), false),
  ]);
  const aeVersions = ae.map((a) => a.version);
  const lines = {};

  lines.macos = !macos
    ? line("macos", "not_checked", TEXT.macos.not_checked.text, TEXT.macos.not_checked.fix)
    : atLeast(macos, MIN_MACOS)
      ? line("macos", "working", TEXT.macos.working(macos))
      : line("macos", "not_working", TEXT.macos.not_working.text, TEXT.macos.not_working.fix);

  const supported = ae.filter((a) => atLeast(a.version, MIN_AE)).map((a) => a.version);
  if (!ae.length) lines.ae_version = line("ae_version", "not_working", TEXT.ae_version.none.text, TEXT.ae_version.none.fix);
  else if (!supported.length) {
    const t = TEXT.ae_version.old(aeVersions);
    lines.ae_version = line("ae_version", "not_working", t.text, t.fix);
  } else lines.ae_version = line("ae_version", "working", TEXT.ae_version.working(aeVersions));

  for (const [id, name] of [["ext_bridge", "AEMentorBridge"], ["ext_panel", "AEMentorPanel"]]) {
    lines[id] = extensionInPlace(L, name) ? line(id, "working", TEXT[id].working) : line(id, "not_working", TEXT[id].not_working.text, TEXT[id].not_working.fix);
  }

  // The key check runs alongside the AE checks; it's the slow one.
  const keyPromise = by(deadline, (opts.keyCheck || defaultKeyCheck)(L, Math.max(1000, deadline - Date.now() - 500)), "timeout");

  // Bridge, scripting setting, CEP.
  let answered = false;
  if (!open) {
    for (const id of ["bridge_answers", "ae_scripting", "cep_can_load"]) lines[id] = needsAe(id);
  } else {
    const cfg = bridgeConfig(L);
    const t = opts.bridgeTimeoutMs || 3000;
    const health = cfg ? await by(deadline, bridgeCall({ ...cfg, timeoutMs: t }), { error: "timeout" }) : { error: "no_config" };
    answered = health.status === 200 && health.json && health.json.ok === true;
    lines.bridge_answers = answered
      ? line("bridge_answers", "working", TEXT.bridge_answers.working)
      : line("bridge_answers", "not_working", TEXT.bridge_answers.not_working.text, TEXT.bridge_answers.not_working.fix);

    if (!answered) {
      lines.ae_scripting = line("ae_scripting", "not_checked", TEXT.ae_scripting.no_bridge.text, TEXT.ae_scripting.no_bridge.fix);
    } else {
      const r = await by(
        deadline,
        bridgeCall({ ...cfg, method: "POST", urlPath: "/run", body: { code: SCRIPTING_SCRIPT, undo: "", label: "Knack setup check" }, timeoutMs: t }),
        { error: "timeout" },
      );
      const res = r.json && r.json.ok === true ? r.json.result : null;
      if (res && res.have === true && res.value === 1) lines.ae_scripting = line("ae_scripting", "working", TEXT.ae_scripting.working);
      else if (res && res.have === true) lines.ae_scripting = line("ae_scripting", "not_working", TEXT.ae_scripting.not_working.text, TEXT.ae_scripting.not_working.fix);
      else lines.ae_scripting = line("ae_scripting", "not_checked", TEXT.ae_scripting.unread.text, TEXT.ae_scripting.unread.fix);
    }

    const cepOld = ae.some((a) => a.parts[0] < CEP_OFF_FROM_MAJOR);
    lines.cep_can_load =
      answered || cepOld
        ? line("cep_can_load", "working", TEXT.cep_can_load.working)
        : line("cep_can_load", "not_working", TEXT.cep_can_load.not_working.text, TEXT.cep_can_load.not_working.fix);
  }

  // The panel's stamp (written by the panel on load, with its manifest's version).
  const stamp = readJson(L.stamp);
  const stampVersion = stamp && typeof stamp.version === "string" ? stamp.version : null;
  if (version && stampVersion === version) lines.panel_loads = line("panel_loads", "working", TEXT.panel_loads.working);
  else if (!open) lines.panel_loads = needsAe("panel_loads");
  else lines.panel_loads = line("panel_loads", "not_working", TEXT.panel_loads.not_working.text, TEXT.panel_loads.not_working.fix);

  // The learner home: can write, and the record reads. Never changes the record.
  let dirOk = false;
  try {
    dirOk = fs.statSync(L.learner).isDirectory();
  } catch {}
  if (!dirOk) lines.record_folder = line("record_folder", "not_working", TEXT.record_folder.missing.text, TEXT.record_folder.missing.fix);
  else {
    const probe = path.join(L.learner, `.knack-check-${crypto.randomBytes(6).toString("hex")}`);
    try {
      fs.writeFileSync(probe, "check", { flag: "wx" });
      fs.unlinkSync(probe);
      lines.record_folder = line("record_folder", "working", TEXT.record_folder.working);
    } catch {
      try {
        fs.unlinkSync(probe);
      } catch {}
      lines.record_folder = line("record_folder", "not_working", TEXT.record_folder.not_writable.text, TEXT.record_folder.not_writable.fix);
    }
  }
  if (!fs.existsSync(L.learnerFile)) lines.record_read = line("record_read", "working", TEXT.record_read.none);
  else {
    let ok = false;
    try {
      JSON.parse(fs.readFileSync(L.learnerFile, "utf8"));
      ok = true;
    } catch {}
    lines.record_read = ok
      ? line("record_read", "working", TEXT.record_read.working)
      : line("record_read", "not_working", TEXT.record_read.not_working.text, TEXT.record_read.not_working.fix);
  }

  // Every part the same version. The stamp counts only while AE is open (the panel loaded now).
  const manifests = EXTENSIONS.map((n) => manifestVersion(path.join(L.cep, n, "CSXS", "manifest.xml")));
  const vm = TEXT.versions_match;
  if (!version) lines.versions_match = line("versions_match", "not_working", vm.not_installed.text, vm.not_installed.fix);
  else if (manifests.some((m) => m !== version)) lines.versions_match = line("versions_match", "not_working", vm.mixed.text, vm.mixed.fix);
  else if (open && stampVersion && stampVersion !== version) lines.versions_match = line("versions_match", "not_working", vm.stale_panel.text, vm.stale_panel.fix);
  else lines.versions_match = line("versions_match", "working", vm.working(version));

  const status = await keyPromise;
  if (status === "timeout") lines.key = line("key", "not_checked", TEXT.timeout.text, TEXT.timeout.fix);
  else {
    const k = TEXT.key[status] || TEXT.key.unknown;
    lines.key = line("key", k.state, k.text, k.fix);
  }

  const checks = IDS.map((id) => lines[id]);
  return {
    version,
    channel: release && (release.channel === "test" || release.channel === "release") ? release.channel : null,
    commit: release && typeof release.commit === "string" ? release.commit.slice(0, 7) : null,
    macos,
    arch: opts.arch || (process.arch === "arm64" ? "arm64" : "x64"),
    ae_versions: aeVersions,
    all_working: checks.every((c) => c.state === "working"),
    checks,
  };
}

// The installed helper's key_check on the private Node; the helper reads the Keychain itself.
function defaultKeyCheck(L, timeoutMs) {
  const nodePath = path.join(L.current, "runtime", "node", "bin", "node");
  const helperPath = path.join(L.current, "panel", "helper", "main.mjs");
  if (!fs.existsSync(nodePath) || !fs.existsSync(helperPath)) return Promise.resolve("unknown");
  return checkKey({ nodePath, helperPath, home: L.home, timeoutMs });
}

const LABEL = { working: "Working", not_working: "Not working", needs_ae: "Needs After Effects", not_checked: "Not checked yet" };

// The result as plain lines for the installer's last screen.
export function formatText(result) {
  const head = result.version ? `Knack ${result.version}${result.channel === "test" ? " (test build)" : ""}` : "Knack";
  const body = result.checks.map((c) => `${LABEL[c.state]}: ${c.text}${c.fix ? ` ${c.fix}` : ""}`);
  const tail = result.all_working ? "Everything is working." : "Fix the lines above, then check again.";
  return [head, "", ...body, "", tail].join("\n");
}
