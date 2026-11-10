// Fix (specs/006-installer T025, FR-022, US2 scenario 4): for a failing setup-check line whose cure
// is safe to do without the person, put that one part back, then check again. Two kinds only:
//   - a missing learner home: make the folder (never anything in it);
//   - a missing or mismatched extension: re-place it from the installer's own payload, when the
//     payload is the version already installed (anything else is an update, not a fix). After
//     Effects must be closed, as for the install (FR-010); a developer link is never replaced here.
// The learner record is never read, written or moved. Each fix re-checks before acting, so a stale
// result can't make it do something the Mac no longer needs.

import fs from "node:fs";
import path from "node:path";
import { EXTENSIONS } from "./layout.mjs";
import { guard } from "./fsx.mjs";
import { aeRunning } from "./ae.mjs";
import { payloadRelease, installedVersion, blockedStop, BLOCKED_CODES } from "./preflight.mjs";
import { placeExtension } from "./payload.mjs";
import { runChecks, manifestVersion, TEXT } from "./checks.mjs";

export const FIX_TEXT = Object.freeze({
  fixed: "Fixed. Here's the check again.",
  ae_open: "Quit After Effects, then press Fix again.",
  not_fixable: "Knack can't fix this one itself. Do what the line says instead.",
  failed: "Knack couldn't fix this. Open the installer again.",
});

const EXT_FOR = { ext_bridge: "AEMentorBridge", ext_panel: "AEMentorPanel" };

const lstat = (p) => {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
};

// The payload holds the version already installed, so re-placing a part from it is a repair.
function samePayload(L, payloadDir) {
  if (!payloadDir) return false;
  const rel = payloadRelease(payloadDir);
  return !!rel && installedVersion(L) === rel.version;
}

// Extensions in place whose manifest says another version. A missing one is its own line's fix, so
// one fault never gets two Fix buttons.
function offExtensions(L) {
  const v = installedVersion(L);
  return EXTENSIONS.filter((n) => {
    const st = lstat(path.join(L.cep, n));
    if (!st || st.isSymbolicLink()) return false;
    const m = manifestVersion(path.join(L.cep, n, "CSXS", "manifest.xml"));
    return m !== null && m !== v;
  });
}

function canFix(id, l, { L, payloadDir }) {
  if (!l || l.state !== "not_working") return false;
  if (id === "record_folder") return !lstat(L.learner);
  if (id in EXT_FOR) {
    const st = lstat(path.join(L.cep, EXT_FOR[id]));
    return !(st && st.isSymbolicLink()) && samePayload(L, payloadDir);
  }
  if (id === "versions_match") return l.text === TEXT.versions_match.mixed.text && samePayload(L, payloadDir) && offExtensions(L).length > 0;
  return false;
}

// The lines of a check result that Fix can mend here. → [id] (in the result's order).
export function fixesFor(result, { L, payloadDir } = {}) {
  return (result.checks || []).filter((c) => canFix(c.id, c, { L, payloadDir })).map((c) => c.id);
}

// opts: { L, payloadDir, run, tools, dirs, keyCheck, budgetMs, ... (runChecks' options) }
// → { ok: true, text, result } or { ok: false, reason, text, result? }
export async function applyFix(id, opts) {
  const { L, payloadDir } = opts;
  const no = (reason, text) => ({ ok: false, reason, text });
  const now = await runChecks(opts);
  const l = now.checks.find((c) => c.id === id);
  if (!canFix(id, l, { L, payloadDir })) return { ...no("not_fixable", FIX_TEXT.not_fixable), result: now };

  const g = guard(L.support);
  const work = path.join(L.tmp, "fix");
  try {
    if (id === "record_folder") g.mkdir(L.learner);
    else {
      if (await aeRunning({ run: opts.run, tools: opts.tools })) return no("ae_open", FIX_TEXT.ae_open);
      const names = id === "versions_match" ? offExtensions(L) : [EXT_FOR[id]];
      for (const name of names) placeExtension({ L, g, payloadDir, name, work });
    }
  } catch (e) {
    if (BLOCKED_CODES.includes(e && e.code)) return blockedStop({ run: opts.run, tools: opts.tools });
    return no("failed", FIX_TEXT.failed);
  } finally {
    try {
      g.rm(work);
      if (fs.existsSync(L.tmp) && !fs.readdirSync(L.tmp).length) fs.rmdirSync(L.tmp);
    } catch {}
  }
  return { ok: true, text: FIX_TEXT.fixed, result: await runChecks(opts) };
}
