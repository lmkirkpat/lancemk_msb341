// The parts list (installer/parts.json; specs/006-installer data-model › Parts list, research R4).
// Build-only: reads parts.json and decides, from a commit's tracked files, which ones ship and where.
// Leave-out patterns, not allow-lists, so a new file in the panel or mentor ships with no change here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const INSTALLER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PARTS_FILE = path.join(INSTALLER_DIR, "parts.json");

export const PART_IDS = Object.freeze(["ae-pipe", "panel", "mentor", "node", "helper", "skills"]);
const SIDES = ["ae", "outside"];
const SEMVER = /^\d+\.\d+\.\d+$/;

export class PartsError extends Error {}

// A glob with only `*` (any run of characters except a slash).
function globToRegExp(glob) {
  const body = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${body}$`);
}

// patterns → (relPath) → true when any pattern leaves the path out. A pattern without a slash
// matches any one name in the path (a folder leaves out everything under it); one with a slash is
// matched against the path from the part's root, and against each of its leading folders.
export function leaveOutMatcher(patterns) {
  const named = [];
  const rooted = [];
  for (const p of patterns || []) {
    if (typeof p !== "string" || !p) throw new PartsError("A leave-out pattern must be a non-empty string.");
    const clean = p.replace(/^\/+|\/+$/g, "");
    (p.includes("/") ? rooted : named).push(globToRegExp(clean));
  }
  return (rel) => {
    const segs = rel.split("/").filter(Boolean);
    if (segs.some((s) => named.some((re) => re.test(s)))) return true;
    for (let i = 1; i <= segs.length; i++) {
      const prefix = segs.slice(0, i).join("/");
      if (rooted.some((re) => re.test(prefix))) return true;
    }
    return false;
  };
}

function onlyMatcher(only) {
  if (!only) return () => true;
  const res = only.map(globToRegExp);
  return (rel) => res.some((re) => re.test(rel.split("/")[0]));
}

function checkEntry(e, where) {
  if (typeof e.from !== "string" || !e.from || path.isAbsolute(e.from) || e.from.split("/").includes("..")) {
    throw new PartsError(`${where}: from must be a path inside the repo.`);
  }
  if (typeof e.to !== "string" || !/^(cep|version)\/[^/]/.test(e.to) || e.to.split("/").includes("..")) {
    throw new PartsError(`${where}: to must start with cep/ or version/.`);
  }
}

// raw parts.json → validated { version, parts, installer }. Throws PartsError.
export function validateParts(raw) {
  if (!raw || typeof raw !== "object") throw new PartsError("parts.json isn't a JSON object.");
  if (!SEMVER.test(raw.version || "")) throw new PartsError("version must be x.y.z.");
  if (!Array.isArray(raw.parts)) throw new PartsError("parts must be a list.");
  const seen = new Set();
  for (const p of raw.parts) {
    if (!PART_IDS.includes(p.id)) throw new PartsError(`Unknown part ${p.id}.`);
    if (seen.has(p.id)) throw new PartsError(`Part ${p.id} is listed twice.`);
    seen.add(p.id);
    if (!SIDES.includes(p.side)) throw new PartsError(`${p.id}: side must be ae or outside.`);
    if (p.id === "node") {
      if (p.from !== null || p.to !== "version/runtime/node") throw new PartsError("node: from is null and to is version/runtime/node.");
      continue;
    }
    checkEntry(p, p.id);
    if ((p.side === "ae") !== p.to.startsWith("cep/")) throw new PartsError(`${p.id}: AE-side parts go to cep/, the rest to version/ (FR-026).`);
    const lo = p.leave_out || [];
    for (const must of ["test", "dev"]) {
      if (!lo.includes(must)) throw new PartsError(`${p.id}: leave_out must include ${must}.`);
    }
    leaveOutMatcher(lo);
    for (const a of p.also || []) {
      checkEntry(a, `${p.id} also`);
      if (a.to.startsWith("cep/")) throw new PartsError(`${p.id} also: extra files go to version/.`);
    }
  }
  for (const id of PART_IDS) if (!seen.has(id)) throw new PartsError(`Part ${id} is missing.`);
  if (!raw.installer) throw new PartsError("installer entry is missing.");
  checkEntry(raw.installer, "installer");
  if (raw.installer.to !== "version/setup") throw new PartsError("installer: to must be version/setup.");
  return raw;
}

export function loadParts(file = PARTS_FILE) {
  return validateParts(JSON.parse(fs.readFileSync(file, "utf8")));
}

// One copy rule: a source folder (or file) and where it goes.
function rules(parts) {
  const out = [];
  for (const p of parts.parts) {
    if (p.id === "node") continue;
    out.push({ id: p.id, from: p.from, to: p.to, keep: makeKeep(p) });
    for (const a of p.also || []) out.push({ id: p.id, from: a.from, to: a.to, keep: () => true, file: true });
  }
  const i = parts.installer;
  out.push({ id: "installer", from: i.from, to: i.to, keep: makeKeep(i) });
  return out;
}

function makeKeep(entry) {
  const left = leaveOutMatcher(entry.leave_out);
  const only = onlyMatcher(entry.only);
  return (rel) => only(rel) && !left(rel);
}

// tracked: the commit's tracked file paths (repo-relative, forward slashes).
// → [{ id, src (repo-relative), dest (payload-relative) }], sorted by dest. Throws PartsError when
// a rule matches nothing (a renamed folder would otherwise ship an empty part).
export function plan(parts, tracked) {
  const out = [];
  for (const r of rules(parts)) {
    let n = 0;
    for (const f of tracked) {
      let rel;
      if (r.file) {
        if (f !== r.from) continue;
        out.push({ id: r.id, src: f, dest: r.to });
        n++;
        continue;
      }
      if (!f.startsWith(r.from + "/")) continue;
      rel = f.slice(r.from.length + 1);
      if (!r.keep(rel)) continue;
      out.push({ id: r.id, src: f, dest: `${r.to}/${rel}` });
      n++;
    }
    if (n === 0) throw new PartsError(`Nothing tracked matches ${r.from} (${r.id}).`);
  }
  out.sort((a, b) => (a.dest < b.dest ? -1 : a.dest > b.dest ? 1 : 0));
  for (let i = 1; i < out.length; i++) {
    if (out[i].dest === out[i - 1].dest) throw new PartsError(`Two parts write ${out[i].dest}.`);
  }
  return out;
}

// The parts that are signed CEP extensions: [{ id, name, manifest }].
export function extensions(parts) {
  return parts.parts
    .filter((p) => p.side === "ae")
    .map((p) => ({ id: p.id, name: p.to.slice("cep/".length), manifest: p.manifest || "CSXS/manifest.xml" }));
}
