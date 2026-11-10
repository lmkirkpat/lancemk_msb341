// After Effects on this Mac: which versions are installed (read from each app's Info.plist) and
// whether one is running (pgrep; never anything that could quit it, FR-010).

import fs from "node:fs";
import path from "node:path";
import { run as defaultRun, SYSTEM_PATH } from "./run.mjs";
import { parseVersion, compareVersions } from "./versions.mjs";

export const TOOLS = Object.freeze({
  pgrep: "/usr/bin/pgrep",
  plutil: "/usr/bin/plutil",
  sw_vers: "/usr/bin/sw_vers",
  security: "/usr/bin/security",
  ps: "/bin/ps",
  profiles: "/usr/bin/profiles",
  pbcopy: "/usr/bin/pbcopy",
  id: "/usr/bin/id",
});
const ENV = { PATH: SYSTEM_PATH };
const AE_PROCESS = "/Adobe After Effects [^/]*\\.app/Contents/MacOS/";

export function appDirs(home) {
  return ["/Applications", path.join(home, "Applications")];
}

// → [{ version: "26.5", app }] sorted oldest first. The `app` path is for the installer only and
// never goes in a report.
export async function findAE({ dirs, run = defaultRun, tools = TOOLS } = {}) {
  const found = [];
  for (const dir of dirs || []) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory() || !/^Adobe After Effects/.test(e.name)) continue;
      let apps = [];
      try {
        apps = fs.readdirSync(path.join(dir, e.name)).filter((n) => /^Adobe After Effects.*\.app$/.test(n) && !/Render Engine/i.test(n));
      } catch {
        continue;
      }
      for (const a of apps) {
        const plist = path.join(dir, e.name, a, "Contents", "Info.plist");
        if (!fs.existsSync(plist)) continue;
        const r = await run(tools.plutil, ["-extract", "CFBundleShortVersionString", "raw", "-o", "-", plist], { env: ENV, timeoutMs: 5000 });
        const v = parseVersion(r.stdout);
        if (r.code === 0 && v) found.push({ version: `${v[0]}.${v[1]}`, parts: v, app: path.join(dir, e.name, a) });
      }
    }
  }
  // One entry per version: a second app with the same version (another copy) isn't another install.
  const seen = new Set();
  return found
    .sort((a, b) => compareVersions(a.parts, b.parts))
    .filter((f) => (seen.has(f.version) ? false : seen.add(f.version)));
}

export async function aeRunning({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.pgrep, ["-f", AE_PROCESS], { env: ENV, timeoutMs: 5000 });
  return r.code === 0;
}

export async function macosVersion({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.sw_vers, ["-productVersion"], { env: ENV, timeoutMs: 5000 });
  return r.code === 0 && parseVersion(r.stdout) ? r.stdout.trim() : null;
}

// The After Effects apps running now (T024, T032): → [{ pid, app, uptimeS }]. `app` is the .app's
// path (matched against findAE to learn its version) and never goes in a report; `uptimeS` is how
// long it has run, or null. Helper processes inside the app (crash reporter and so on) are skipped.
export async function aeProcesses({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.pgrep, ["-lf", AE_PROCESS], { env: ENV, timeoutMs: 5000 });
  if (r.code !== 0) return [];
  const out = [];
  for (const l of String(r.stdout).split("\n")) {
    const m = /^\s*(\d+)\s+(.*?\.app)\/Contents\/MacOS\/After Effects(?:\s|$)/.exec(l);
    if (m) out.push({ pid: Number(m[1]), app: m[2], uptimeS: null });
  }
  for (const p of out) {
    const e = await run(tools.ps, ["-o", "etime=", "-p", String(p.pid)], { env: ENV, timeoutMs: 5000 });
    p.uptimeS = e.code === 0 ? parseElapsed(e.stdout) : null;
  }
  return out;
}

// ps's elapsed time, "[[dd-]hh:]mm:ss" → seconds, or null.
export function parseElapsed(text) {
  const m = /^\s*(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)\s*$/.exec(String(text || ""));
  if (!m) return null;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3]) * 60 + Number(m[4]);
}

// Is this Mac enrolled in device management (MDM)? Only used to word a message when a write is
// refused (spec edge case "No admin password"). Reads enrollment status; needs no admin rights.
export async function managedMac({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.profiles, ["status", "-type", "enrollment"], { env: ENV, timeoutMs: 5000 });
  return r.code === 0 && /(MDM enrollment|Enrolled via DEP):\s*Yes/i.test(r.stdout);
}
