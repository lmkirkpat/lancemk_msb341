// The setup check's lines (specs/006-installer T013, contracts/setup-check.md, FR-021, FR-022).
// Reads only, apart from a test file in the learner home that is removed at once. Every line's
// text and fix are one plain sentence each: no paths, field names, codes or commands. The bridge
// token is read from bridge.json and never printed; the key is never seen (the helper reads it).

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { EXTENSIONS, MIN_AE, MIN_MACOS } from "./layout.mjs";
import { findAE, aeRunning, aeProcesses, macosVersion, appDirs, managedMac } from "./ae.mjs";
import { atLeast, parseVersion } from "./versions.mjs";
import { checkKey } from "./keychain.mjs";
import { readJson, BLOCKED_CODES } from "./preflight.mjs";

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
// guess until Adobe says. The check never blames CEP on the version alone: the bridge must also
// not have started in this AE session (its log), and its folder must be in place (T024).
export const CEP_OFF_FROM_MAJOR = 29;
const cepOff = (parts) => parts[0] >= CEP_OFF_FROM_MAJOR;
// Seconds after AE starts before a silent bridge counts as a fault (its page loads after AE's
// window; T024's "still starting").
export const STARTING_S = 60;

const SETTING = "After Effects > Settings > Scripting & Expressions, and tick Allow Scripts to Write Files and Access Network";
const AGAIN = "Open the Knack installer again.";

export const TEXT = Object.freeze({
  needs_ae: "Open After Effects to check this.",
  macos: {
    working: (v) => `macOS ${v} is supported.`,
    not_working: { text: "This version of macOS is older than Knack supports.", fix: "Update macOS, then check again." },
    not_checked: { text: "Knack couldn't tell which version of macOS this is.", fix: "Restart the Mac, then check again." },
  },
  ae_version: {
    // T032: with several installed, the ones Knack doesn't support are named apart.
    working: (vs, supported = vs) => {
      const other = vs.filter((v) => !supported.includes(v));
      return `Found After Effects ${listVersions(vs)}.${other.length ? ` Knack works in ${listVersions(supported)}, not ${listVersions(other)}.` : ""}`;
    },
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
    // v: the After Effects version checked, when it can be told (T032).
    working: (v) => `${ae(v)} answers Knack.`,
    unsupported: (v, newest) => ({ text: `After Effects ${v} is open, which Knack doesn't support.`, fix: `Quit it and open After Effects ${newest} instead.` }),
    not_working: { text: "After Effects is open, but it isn't answering Knack.", fix: "Quit After Effects and open it again, then check again." },
    port_taken: { text: "Something else is using Knack's connection to After Effects.", fix: "Restart the Mac, then open After Effects and check again." },
    starting: { text: "After Effects is still starting.", fix: "Wait a moment, then check again." },
  },
  panel_loads: {
    working: "The Knack panel has opened in After Effects.",
    not_working: { text: "The Knack panel hasn't opened yet.", fix: "In After Effects, choose Window > Extensions > Knack, then check again." },
  },
  ae_scripting: {
    working: (v) => `${ae(v)} lets Knack's scripts run.`,
    not_working: (v) => ({ text: `${ae(v)} doesn't let Knack's scripts run yet.`, fix: `Open ${SETTING}.` }),
    unread: { text: "Knack couldn't read this setting in this version of After Effects.", fix: `Make sure it's on: open ${SETTING}.` },
    no_bridge: { text: "Knack can check this once After Effects answers it.", fix: "Fix the line about After Effects answering first." },
  },
  cep_can_load: {
    working: (v) => `${ae(v)} can load Knack.`,
    blocked: (v, fallback) => ({
      text: v ? `After Effects ${v} no longer loads Knack's kind of panel.` : "This version of After Effects no longer loads Knack's kind of panel.",
      fix: fallback ? `Open After Effects ${fallback} instead, then check again.` : "Use an earlier version of After Effects for now.",
    }),
    depends: { text: "Knack can check this once After Effects loads it.", fix: "Fix the line about After Effects loading Knack first." },
  },
  key: {
    works: { state: "working", text: "Your access key works.", fix: null },
    rejected: { state: "not_working", text: "Your access key doesn't work any more.", fix: "Ask whoever gave you Knack for a new key, then open the installer again to add it." },
    out_of_credit: { state: "not_working", text: "Your access key works, but its account is out of credit.", fix: "Add credit to the account, then check again." },
    offline: { state: "not_checked", text: "Your access key is not yet checked, because Knack couldn't reach the service.", fix: "Check your internet connection, then check again." },
    no_key: { state: "not_working", text: "No access key is saved yet.", fix: "When you're online, open the Knack installer again and add your key." },
    unknown: { state: "not_checked", text: "Knack couldn't check your access key just now.", fix: "Check again in a minute." },
    // No answer within the check's time: most often no internet, so it's not yet checked, not broken (T022).
    timeout: { state: "not_checked", text: "Knack couldn't reach the service in time to check your access key.", fix: "Check your internet connection, then check again." },
  },
  record_folder: {
    working: "Knack can save your lesson history.",
    missing: { text: "Knack's folder for your lesson history is missing.", fix: AGAIN },
    not_writable: { text: "Knack can't save your lesson history on this Mac.", fix: "Send a note to whoever gave you Knack." },
    // T031: the same refusal on a Mac enrolled in device management.
    managed: { text: "This Mac's management settings stop Knack saving your lesson history.", fix: "Ask your IT team to allow Knack, then check again." },
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
  // The closing line, by the worst state in the result (T022: AE closed or no internet isn't broken).
  tail: {
    done: "Everything is working.",
    fix: "Fix the lines above, then check again.",
    open_ae: "Nothing looks broken. Open After Effects, then check again.",
    later: "Nothing looks broken. Follow the lines above, then check again.",
  },
});

const ae = (v) => (v ? `After Effects ${v}` : "After Effects");

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

// What the bridge's own log says since `sinceMs` (T023, T024): did its page start, and was its port
// taken? Read only; nothing from the log is ever printed. A taken port that the bridge got later
// doesn't count. sinceMs null → { started: null, portTaken: false } (no way to tell this session's
// lines from an earlier one's).
export function bridgeLog(L, sinceMs) {
  const none = { started: sinceMs === null ? null : false, portTaken: false };
  if (sinceMs === null) return none;
  let text;
  try {
    const fd = fs.openSync(L.bridgeLog, "r");
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, 64 * 1024);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, size - len);
      text = buf.toString("utf8");
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return none;
  }
  let started = false;
  let portTaken = false;
  for (const l of text.split("\n")) {
    const m = /^(\d{4}-\d\d-\d\dT[\d:.]+Z) (.*)$/.exec(l);
    if (!m || Date.parse(m[1]) < sinceMs) continue;
    if (m[2].startsWith("start: ")) {
      started = true;
      portTaken = false;
    } else if (m[2].startsWith("listening on ")) portTaken = false;
    else if (m[2].startsWith("server error: ") && /is taken/.test(m[2])) portTaken = true;
  }
  return { started, portTaken };
}

// The /health reply → "ours" (answered), "ours_refused" (our bridge, but it refused this token),
// "foreign" (something else answered on the port), "nobody" (nothing listening, or no config) or
// "no_reply" (connected, no answer in time).
export function classifyHealth(h) {
  if (h.status === 200 && h.json && h.json.ok === true) return "ours";
  if ((h.status === 401 || h.status === 403) && h.json && h.json.ok === false) return "ours_refused";
  if (h.status !== undefined) return "foreign";
  if (h.error === "ECONNREFUSED" || h.error === "no_config") return "nobody";
  return "no_reply";
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

  const [macos, ae, open, procs] = await Promise.all([
    by(deadline, macosVersion(toolArgs), null),
    by(deadline, findAE({ dirs: opts.dirs || appDirs(L.home), ...toolArgs }), []),
    by(deadline, aeRunning(toolArgs), false),
    by(deadline, aeProcesses(toolArgs), []),
  ]);
  // When the AE that's open started: the oldest, if several are (null if unknown).
  const uptimes = procs.map((p) => p.uptimeS).filter((u) => Number.isFinite(u));
  const aeSince = uptimes.length ? Date.now() - Math.max(...uptimes) * 1000 : null;
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
  } else lines.ae_version = line("ae_version", "working", TEXT.ae_version.working(aeVersions, supported));

  for (const [id, name] of [["ext_bridge", "AEMentorBridge"], ["ext_panel", "AEMentorPanel"]]) {
    lines[id] = extensionInPlace(L, name) ? line(id, "working", TEXT[id].working) : line(id, "not_working", TEXT[id].not_working.text, TEXT[id].not_working.fix);
  }

  // The key check runs alongside the AE checks; it's the slow one.
  const keyPromise = by(deadline, (opts.keyCheck || defaultKeyCheck)(L, Math.max(1000, deadline - Date.now() - 500)), "timeout");

  // Bridge, scripting setting, CEP. Which AE is open comes from its process, matched to an
  // installed app (null if it can't be told).
  const openApp = procs.map((p) => ae.find((a) => a.app === p.app)).find(Boolean) || null;
  const openUptime = uptimes.length ? Math.min(...uptimes) : null;
  let answered = false;
  let cepBlocked = false;
  let unsupportedOpen = false;
  if (!open) {
    for (const id of ["bridge_answers", "ae_scripting", "cep_can_load"]) lines[id] = needsAe(id);
  } else {
    const cfg = bridgeConfig(L);
    const t = opts.bridgeTimeoutMs || 3000;
    const health = cfg ? await by(deadline, bridgeCall({ ...cfg, timeoutMs: t }), { error: "timeout" }) : { error: "no_config" };
    const kind = classifyHealth(health);
    answered = kind === "ours";
    // The version checked (T032): what the bridge reports, else the open app's.
    const reported = answered ? parseVersion(health.json.appVersion) : null;
    const checkedV = reported && reported[0] > 0 ? `${reported[0]}.${reported[1]}` : openApp ? openApp.version : null;
    const unsupported = !answered && openApp && !atLeast(openApp.version, MIN_AE) && supported.length ? openApp.version : null;
    const log = bridgeLog(L, aeSince);
    const portTaken = kind === "foreign" || ((kind === "nobody" || kind === "no_reply") && log.portTaken);
    // CEP off (T024): only when nothing else explains the silence. The bridge's page running in this
    // AE proves CEP loads; a missing bridge folder is its own line; a new AE gets time to start.
    const cepOffHere = openApp ? cepOff(openApp.parts) : ae.length > 0 && ae.every((a) => cepOff(a.parts));
    const starting = !answered && !portTaken && log.started !== true && openUptime !== null && openUptime < STARTING_S;
    cepBlocked = !answered && !portTaken && !starting && log.started !== true && cepOffHere && lines.ext_bridge.state === "working";

    const ba = TEXT.bridge_answers;
    const cd = TEXT.cep_can_load.depends;
    if (answered) lines.bridge_answers = line("bridge_answers", "working", ba.working(checkedV));
    else if (portTaken) lines.bridge_answers = line("bridge_answers", "not_working", ba.port_taken.text, ba.port_taken.fix);
    else if (cepBlocked) lines.bridge_answers = line("bridge_answers", "not_checked", cd.text, cd.fix);
    else if (unsupported) {
      const u = ba.unsupported(unsupported, supported[supported.length - 1]);
      lines.bridge_answers = line("bridge_answers", "not_working", u.text, u.fix);
    } else if (starting) lines.bridge_answers = line("bridge_answers", "not_checked", ba.starting.text, ba.starting.fix);
    else lines.bridge_answers = line("bridge_answers", "not_working", ba.not_working.text, ba.not_working.fix);

    if (cepBlocked) lines.ae_scripting = line("ae_scripting", "not_checked", cd.text, cd.fix);
    else if (!answered) {
      lines.ae_scripting = line("ae_scripting", "not_checked", TEXT.ae_scripting.no_bridge.text, TEXT.ae_scripting.no_bridge.fix);
    } else {
      const r = await by(
        deadline,
        bridgeCall({ ...cfg, method: "POST", urlPath: "/run", body: { code: SCRIPTING_SCRIPT, undo: "", label: "Knack setup check" }, timeoutMs: t }),
        { error: "timeout" },
      );
      const res = r.json && r.json.ok === true ? r.json.result : null;
      const off = TEXT.ae_scripting.not_working(checkedV);
      if (res && res.have === true && res.value === 1) lines.ae_scripting = line("ae_scripting", "working", TEXT.ae_scripting.working(checkedV));
      else if (res && res.have === true) lines.ae_scripting = line("ae_scripting", "not_working", off.text, off.fix);
      else lines.ae_scripting = line("ae_scripting", "not_checked", TEXT.ae_scripting.unread.text, TEXT.ae_scripting.unread.fix);
    }

    if (cepBlocked) {
      // The newest installed AE that Knack supports and that still loads CEP, if any.
      const fallback = ae.filter((a) => atLeast(a.version, MIN_AE) && !cepOff(a.parts)).map((a) => a.version).pop() || null;
      const b = TEXT.cep_can_load.blocked(openApp ? openApp.version : null, fallback);
      lines.cep_can_load = line("cep_can_load", "not_working", b.text, b.fix);
    } else if (starting && cepOffHere) {
      lines.cep_can_load = line("cep_can_load", "not_checked", ba.starting.text, ba.starting.fix);
    } else lines.cep_can_load = line("cep_can_load", "working", TEXT.cep_can_load.working(checkedV));
    unsupportedOpen = !!unsupported;
  }

  // The panel's stamp (written by the panel on load, with its manifest's version). With CEP off, an
  // earlier session's stamp proves nothing, so the line points to the CEP line instead.
  const stamp = readJson(L.stamp);
  const stampVersion = stamp && typeof stamp.version === "string" ? stamp.version : null;
  if (cepBlocked) lines.panel_loads = line("panel_loads", "not_checked", TEXT.cep_can_load.depends.text, TEXT.cep_can_load.depends.fix);
  else if (unsupportedOpen && stampVersion !== version) lines.panel_loads = line("panel_loads", "not_checked", TEXT.ae_scripting.no_bridge.text, TEXT.ae_scripting.no_bridge.fix);
  else if (version && stampVersion === version) lines.panel_loads = line("panel_loads", "working", TEXT.panel_loads.working);
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
    } catch (e) {
      try {
        fs.unlinkSync(probe);
      } catch {}
      const refused = BLOCKED_CODES.includes(e && e.code) && (await by(deadline, managedMac(toolArgs), false));
      const t = refused ? TEXT.record_folder.managed : TEXT.record_folder.not_writable;
      lines.record_folder = line("record_folder", "not_working", t.text, t.fix);
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
  const k = TEXT.key[status] || TEXT.key.unknown;
  lines.key = line("key", k.state, k.text, k.fix);

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

export function closingLine(result) {
  const has = (state) => result.checks.some((c) => c.state === state);
  if (result.all_working) return TEXT.tail.done;
  if (has("not_working")) return TEXT.tail.fix;
  return has("needs_ae") ? TEXT.tail.open_ae : TEXT.tail.later;
}

// The result as plain lines for the installer's last screen.
export function formatText(result) {
  const head = result.version ? `Knack ${result.version}${result.channel === "test" ? " (test build)" : ""}` : "Knack";
  const body = result.checks.map((c) => `${LABEL[c.state]}: ${c.text}${c.fix ? ` ${c.fix}` : ""}`);
  const tail = closingLine(result);
  return [head, "", ...body, "", tail].join("\n");
}
