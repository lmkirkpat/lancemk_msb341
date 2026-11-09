// Checks before anything is written (contracts/install-layout.md steps 2 and 4; FR-011, FR-017,
// FR-024 on the SC-002 path). Reads only. Each stop has one plain message (FR-022's rule).

import fs from "node:fs";
import path from "node:path";
import { EXTENSIONS, MIN_AE, MIN_MACOS } from "./layout.mjs";
import { findAE, appDirs, macosVersion, aeRunning } from "./ae.mjs";
import { atLeast, compareVersions, parseVersion } from "./versions.mjs";

export const STOP = Object.freeze({
  macos: "This Mac needs a newer version of macOS for Knack. Update macOS, then open the installer again.",
  macos_unknown: "The installer couldn't tell which version of macOS this is. Restart the Mac, then open the installer again.",
  no_ae: "After Effects isn't installed. Install After Effects 2026 or later from Creative Cloud, then open the installer again.",
  old_ae: "Knack needs After Effects 2026 (version 26.4) or later. Update After Effects from Creative Cloud, then open the installer again.",
  dev_install: "Knack is already set up for development on this Mac. This installer can't replace that yet, so nothing was changed.",
  newer: (v) => `A newer version of Knack (${v}) is already installed, so nothing was changed.`,
  bad_payload: "This copy of the installer is incomplete. Download it again.",
  ae_open: "After Effects is open. Quit it, then continue.",
});

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// The version installed now, from the active release or, failing that, the inventory.
export function installedVersion(L) {
  const rel = readJson(path.join(L.current, "release.json"));
  if (rel && parseVersion(rel.version)) return rel.version;
  const st = readJson(L.state);
  return st && parseVersion(st.version) ? st.version : null;
}

export function devInstall(L) {
  return EXTENSIONS.some((name) => {
    try {
      return fs.lstatSync(path.join(L.cep, name)).isSymbolicLink();
    } catch {
      return false;
    }
  });
}

export function payloadRelease(payloadDir) {
  const rel = readJson(path.join(payloadDir, "release.json"));
  if (!rel || !parseVersion(rel.version)) return null;
  for (const name of EXTENSIONS) {
    if (!fs.existsSync(path.join(payloadDir, "cep", name, "META-INF", "signatures.xml"))) return null;
  }
  if (!fs.existsSync(path.join(payloadDir, "version", "release.json"))) return null;
  return rel;
}

// → { ok: true, release, macos, ae: [versions], installed, aeOpen } or { ok: false, reason, text }
export async function preflight({ L, payloadDir, run, tools, dirs }) {
  const stop = (reason, text) => ({ ok: false, reason, text: text || STOP[reason] });
  const release = payloadRelease(payloadDir);
  if (!release) return stop("bad_payload");
  const macos = await macosVersion({ run, tools });
  if (!macos) return stop("macos_unknown");
  if (!atLeast(macos, MIN_MACOS)) return stop("macos");
  const ae = await findAE({ dirs: dirs || appDirs(L.home), run, tools });
  if (!ae.length) return stop("no_ae");
  if (!ae.some((a) => atLeast(a.version, MIN_AE))) return stop("old_ae");
  if (devInstall(L)) return stop("dev_install");
  const installed = installedVersion(L);
  if (installed && compareVersions(installed, release.version) > 0) return stop("newer", STOP.newer(installed));
  const aeOpen = await aeRunning({ run, tools });
  return { ok: true, release, macos, ae: ae.map((a) => a.version), installed, aeOpen };
}
