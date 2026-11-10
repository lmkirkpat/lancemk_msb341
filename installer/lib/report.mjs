// Copy report (specs/006-installer T026, FR-023, US2 scenario 5): the setup check's result as plain
// text to paste to whoever gave the person Knack. It holds the versions, the release's commit and each
// check's result, and never an access key, an account or real name, an email, a phone number, or a
// path with the Mac user name (constitution IV). It's only put on the clipboard; Knack sends nothing.
//
// Two layers: every field is checked against the shape it must have and dropped if it doesn't
// (never "cleaned" into something half-right), and the check texts, which Knack writes itself, are
// scrubbed anyway in case a result file was edited.

import os from "node:os";
import { run as defaultRun, SYSTEM_PATH } from "./run.mjs";
import { TOOLS } from "./ae.mjs";
import { closingLine } from "./checks.mjs";

const LABEL = { working: "Working", not_working: "Not working", needs_ae: "Needs After Effects", not_checked: "Not checked yet" };
const ARCH = { arm64: "Apple silicon", x64: "Intel" };

const shaped = (v, re) => (typeof v === "string" && re.test(v) ? v : null);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function listVersions(vs) {
  if (vs.length <= 1) return vs.join("");
  return `${vs.slice(0, -1).join(", ")} and ${vs[vs.length - 1]}`;
}

// Removes anything personal from one line of text. names: the account and real names to keep out.
export function scrub(text, { home, names = [] } = {}) {
  let s = String(text || "");
  if (home) s = s.split(home).join("[a folder]");
  s = s
    .replace(/(?:~|\/Users|\/home)\/\S*/g, "[a folder]")
    .replace(/sk-ant-\S*/g, "[a key]")
    .replace(/[A-Za-z0-9_-]{24,}/g, "[removed]")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[an email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[a number]");
  // Whole names first, then each part of three letters or more.
  const parts = [];
  for (const n of names) {
    if (typeof n !== "string" || !n.trim()) continue;
    parts.push(n.trim(), ...n.trim().split(/[\s._-]+/).filter((p) => p.length >= 3));
  }
  for (const p of parts.sort((a, b) => b.length - a.length)) s = s.replace(new RegExp(`(?<![A-Za-z0-9])${escape(p)}(?![A-Za-z0-9])`, "gi"), "[a name]");
  return s;
}

// result: setup-check's result. opts: { now, home, username, fullName } → the report text.
export function reportText(result, { now = new Date(), home, username, fullName } = {}) {
  const names = [username, fullName];
  const version = shaped(result.version, /^\d+\.\d+\.\d+$/);
  const commit = shaped(result.commit, /^[0-9a-f]{7,40}$/);
  const macos = shaped(result.macos, /^\d+(\.\d+){0,2}$/);
  const ae = (Array.isArray(result.ae_versions) ? result.ae_versions : []).filter((v) => shaped(v, /^\d+\.\d+$/));
  const day = now.toISOString().slice(0, 10);
  const head = [
    `Knack setup report, ${day}`,
    `Knack ${version ? `${version}${result.channel === "test" ? " (test build)" : ""}` : "unknown version"}, commit ${commit ? commit.slice(0, 7) : "unknown"}`,
    `macOS ${macos || "unknown"}, ${ARCH[result.arch] || "unknown"}`,
    ae.length ? `After Effects ${listVersions(ae)}` : "After Effects not found",
  ];
  const checks = Array.isArray(result.checks) ? result.checks : [];
  const body = checks.map((c) => {
    const words = [c.text, c.fix].filter(Boolean).map((x) => scrub(x, { home, names })).join(" ");
    return `${LABEL[c.state] || "Unknown"}: ${words}`;
  });
  const tail = checks.length ? closingLine({ ...result, checks }) : "";
  return [...head, "", ...body, "", tail].join("\n").trimEnd();
}

// The report for this Mac, looking up the names to keep out of it (never printed).
// opts: { now, home, username, run, tools }
export async function buildReport(result, opts = {}) {
  const run = opts.run || defaultRun;
  const tools = opts.tools || TOOLS;
  let username = opts.username;
  if (username === undefined) {
    try {
      username = os.userInfo().username;
    } catch {
      username = null;
    }
  }
  const r = await run(tools.id, ["-F"], { env: { PATH: SYSTEM_PATH }, timeoutMs: 5000 });
  const fullName = r.code === 0 ? String(r.stdout).trim() : null;
  return reportText(result, { now: opts.now, home: opts.home || os.homedir(), username, fullName });
}

// Puts the text on the clipboard. → true when it got there.
export async function copyReport(text, { run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.pbcopy, [], { env: { PATH: SYSTEM_PATH, LANG: "en_US.UTF-8" }, input: String(text), timeoutMs: 5000 });
  return r.code === 0;
}
