// installer/lib/report.mjs (T026, FR-023, US2 scenario 5): Copy report holds the versions, the
// release's commit and each check's result, and no access key, account or real name, email, phone
// or path with the Mac user name. It's only put on the clipboard; nothing is sent anywhere.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { reportText, buildReport, copyReport } from "../lib/report.mjs";
import { IDS, TEXT, closingLine } from "../lib/checks.mjs";
import { setupCheck } from "../setup-check.mjs";
import { install } from "../install.mjs";
import { TOOLS } from "../lib/ae.mjs";
import { tmpdir, makePayload, makeNodeDir, makeApps, makeRun } from "./fixtures.mjs";

const NOW = new Date("2026-11-09T15:30:00Z");
const result = (over = {}) => ({
  version: "0.1.0", channel: "test", commit: "abc1234", macos: "27.0.1", arch: "arm64", ae_versions: ["26.5", "27.0"], all_working: false,
  checks: IDS.map((id) => ({ id, part: "x", state: id === "key" ? "not_working" : "working", text: id === "key" ? TEXT.key.rejected.text : "Fine.", fix: id === "key" ? TEXT.key.rejected.fix : null })),
  ...over,
});

test("the report: versions, commit, Mac, AE, every check's result and the closing line", () => {
  const r = result();
  const lines = reportText(r, { now: NOW }).split("\n");
  assert.equal(lines[0], "Knack setup report, 2026-11-09");
  assert.equal(lines[1], "Knack 0.1.0 (test build), commit abc1234");
  assert.equal(lines[2], "macOS 27.0.1, Apple silicon");
  assert.equal(lines[3], "After Effects 26.5 and 27.0");
  assert.ok(lines.includes(`Not working: ${TEXT.key.rejected.text} ${TEXT.key.rejected.fix}`));
  assert.equal(lines.filter((l) => /^(Working|Not working|Needs After Effects|Not checked yet): /.test(l)).length, IDS.length);
  assert.equal(lines[lines.length - 1], closingLine(r));
  assert.equal(reportText(result({ arch: "x64", channel: "release", ae_versions: [] }), { now: NOW }).split("\n").slice(1, 4).join("|"),
    "Knack 0.1.0, commit abc1234|macOS 27.0.1, Intel|After Effects not found");
});

test("nothing personal gets through, even from a tampered result (FR-023)", () => {
  const home = "/Users/jdoe";
  const bad = result({
    version: "0.1.0 /Users/jdoe/x",
    commit: "sk-ant-api03-SECRETSECRETSECRETSECRET",
    macos: "27.0.1 jdoe",
    ae_versions: ["26.5", "/Users/jdoe/AE"],
    checks: [
      { id: "key", state: "not_working", text: "Key sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUV failed for Jane Doe.", fix: "Mail jane.doe@example.com or call +1 (555) 010-2030." },
      { id: "record_read", state: "weird", text: "Couldn't read /Users/jdoe/Library/Application Support/AEMentor/learner.json as jdoe.", fix: `Token ${"f".repeat(64)}.` },
      { id: "macos", state: "working", text: `In ${home}/Desktop and ~/Library.`, fix: null },
    ],
  });
  const out = reportText(bad, { now: NOW, home, username: "jdoe", fullName: "Jane Doe" });
  for (const leak of ["/Users/", "jdoe", "Jane", "Doe", "sk-ant", "SECRET", "ABCDEFGH", "example.com", "555", "f".repeat(32), "~/Library"]) {
    assert.ok(!out.includes(leak), `${leak} leaked:\n${out}`);
  }
  assert.match(out, /^Knack unknown version, commit unknown$/m, "fields that aren't what they should be are dropped, not cleaned");
  assert.match(out, /^macOS unknown, Apple silicon$/m);
  assert.match(out, /^After Effects 26\.5$/m);
  assert.match(out, /^Unknown: /m, "an unknown state isn't passed through as a label");
});

test("a real check on a temp home: the report holds no path or name from it", async (t) => {
  const home = path.join(tmpdir(t, "knack-report-"), "kim-lee");
  fs.mkdirSync(home);
  const apps = makeApps(t, ["26.5"]);
  const state = { macos: "27.0.1", aeOpen: false, fake: { "/usr/bin/id": () => ({ code: 0, stdout: "Kim Lee\n", stderr: "" }) } };
  const run = makeRun(state);
  assert.equal((await install({ home, payloadDir: makePayload(t), nodeDir: makeNodeDir(t), run, dirs: [apps] })).ok, true);
  const { result: r } = await setupCheck({ home, run, dirs: [apps], keyCheck: async () => "offline", json: true });
  const text = await buildReport(r, { home, run, username: "kim-lee", now: NOW });
  assert.ok(!text.includes(home) && !text.includes("kim-lee") && !text.includes("Kim Lee"));
  assert.match(text, /Not checked yet: Your access key is not yet checked/);
  assert.ok(run.calls.some((c) => c.cmd === "/usr/bin/id" && c.args.join(" ") === "-F"), "the real name is looked up only to keep it out");
});

test("Copy report puts it on the clipboard over stdin, and nothing else is run", async () => {
  const state = {};
  const run = makeRun(state);
  assert.equal(await copyReport("Knack setup report", { run }), true);
  assert.equal(state.clipboard, "Knack setup report");
  const c = run.calls.find((x) => x.cmd === TOOLS.pbcopy);
  assert.deepEqual(c.args, []);
  assert.deepEqual(Object.keys(c.env).sort(), ["LANG", "PATH"]);
  assert.equal(run.calls.length, 1, "no network, no other program");
  const failing = makeRun({ fake: { [TOOLS.pbcopy]: () => ({ code: 1, stdout: "", stderr: "" }) } });
  assert.equal(await copyReport("x", { run: failing }), false);
});
