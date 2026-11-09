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
        apps = fs.readdirSync(path.join(dir, e.name)).filter((n) => /^Adobe After Effects.*\.app$/.test(n));
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
  return found.sort((a, b) => compareVersions(a.parts, b.parts));
}

export async function aeRunning({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.pgrep, ["-f", AE_PROCESS], { env: ENV, timeoutMs: 5000 });
  return r.code === 0;
}

export async function macosVersion({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.sw_vers, ["-productVersion"], { env: ENV, timeoutMs: 5000 });
  return r.code === 0 && parseVersion(r.stdout) ? r.stdout.trim() : null;
}
