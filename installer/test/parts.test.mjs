// installer/parts.json and buildlib/parts.mjs (T009): what ships, by leave-out pattern.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { leaveOutMatcher, loadParts, validateParts, plan, extensions, PartsError, INSTALLER_DIR } from "../buildlib/parts.mjs";

const REPO = path.resolve(INSTALLER_DIR, "..");
// The installer's own entry files land in T011 to T013; until then they're added here.
const SETUP = ["installer/install.mjs", "installer/setup-check.mjs", "installer/lib/run.mjs"];
const tracked = () => {
  const t = execFileSync("git", ["ls-files", "-z"], { cwd: REPO, encoding: "utf8" }).split("\0").filter(Boolean);
  return [...new Set([...t, ...SETUP])];
};
const clone = (o) => JSON.parse(JSON.stringify(o));

test("parts.json is valid and lists the six parts once", () => {
  const p = loadParts();
  assert.deepEqual(p.parts.map((x) => x.id).sort(), ["ae-pipe", "helper", "mentor", "node", "panel", "skills"]);
});

test("leave-out: a name matches at any depth, a slash pattern from the root, * is a wildcard", () => {
  const m = leaveOutMatcher(["test", "*.sh", "a/b", ".DS_Store"]);
  assert.equal(m("test/x.js"), true);
  assert.equal(m("lib/test/x.js"), true);
  assert.equal(m("lib/testing.js"), false);
  assert.equal(m("install.sh"), true);
  assert.equal(m("lib/run.sh"), true);
  assert.equal(m("a/b/c.js"), true);
  assert.equal(m("x/a/b/c.js"), false);
  assert.equal(m("lib/.DS_Store"), true);
});

test("validation refuses a code part without test and dev left out", () => {
  const raw = clone(loadParts());
  raw.parts.find((p) => p.id === "mentor").leave_out = ["fixture"];
  assert.throws(() => validateParts(raw), PartsError);
});

test("validation refuses an AE-side part that doesn't go to cep/ (FR-026)", () => {
  const raw = clone(loadParts());
  raw.parts.find((p) => p.id === "panel").to = "version/panel";
  assert.throws(() => validateParts(raw), /FR-026/);
});

test("validation refuses a missing or unknown part, and paths out of the repo", () => {
  const raw = clone(loadParts());
  raw.parts = raw.parts.filter((p) => p.id !== "skills");
  assert.throws(() => validateParts(raw), /skills is missing/);
  const raw2 = clone(loadParts());
  raw2.parts.push({ id: "extra", side: "outside", from: "x", to: "version/x", leave_out: ["test", "dev"] });
  assert.throws(() => validateParts(raw2), /Unknown part/);
  const raw3 = clone(loadParts());
  raw3.parts.find((p) => p.id === "mentor").from = "../elsewhere";
  assert.throws(() => validateParts(raw3), PartsError);
});

test("the real repo: what ships and what doesn't (research R4)", () => {
  const files = plan(loadParts(), tracked());
  const dests = files.map((f) => f.dest);
  const has = (re) => dests.some((d) => re.test(d));

  // Ships
  assert.ok(dests.includes("cep/AEMentorBridge/CSXS/manifest.xml"));
  assert.ok(dests.includes("cep/AEMentorBridge/jsx/bridge.jsx"));
  assert.ok(dests.includes("cep/AEMentorPanel/CSXS/manifest.xml"));
  assert.ok(dests.includes("cep/AEMentorPanel/main.js"));
  assert.ok(dests.includes("version/mentor/server.mjs"));
  assert.ok(dests.includes("version/mentor/fixture.mjs"), "fixture.mjs is code bridge-client.mjs imports");
  assert.ok(dests.includes("version/mentor/curriculum/path.json"));
  assert.ok(dests.includes("version/bridge/paths.mjs"));
  assert.ok(dests.includes("version/.mcp.json"));
  assert.ok(dests.includes("version/panel/helper/main.mjs"));
  assert.ok(dests.includes("version/panel/helper/package-lock.json"));
  assert.ok(dests.includes("version/.claude/skills/ease-mentor/SKILL.md"));
  assert.ok(dests.includes("version/setup/install.mjs"));
  assert.ok(dests.includes("version/setup/lib/run.mjs"));

  // Doesn't ship
  assert.ok(!has(/(^|\/)(test|dev)\//), "no test or dev folder");
  assert.ok(!has(/^version\/mentor\/fixture\//), "no mentor fixture data");
  assert.ok(!has(/^cep\/AEMentorPanel\/helper\//), "no helper inside the signed panel");
  assert.ok(!has(/\.sh$/), "no shell scripts");
  assert.ok(!has(/^cep\/AEMentorPanel\/package\.json$/));
  assert.ok(!has(/^version\/mentor\/package\.json$/));
  assert.ok(!has(/node_modules\//));
  assert.ok(!has(/CLAUDE\.md$/));
  assert.ok(!has(/^version\/\.claude\/(agents|hooks|settings)/));
  assert.ok(!has(/^version\/\.claude\/skills\/(?![a-z0-9-]+-mentor\/)/), "only *-mentor skills");
  assert.ok(!has(/^version\/setup\/(build\.mjs|buildlib|parts\.json|node\.json|applet)/), "build files stay home");
  // Every *-mentor skill in the repo ships, so a new one needs no change here.
  const repoSkills = new Set(tracked().filter((f) => /^\.claude\/skills\/[^/]+-mentor\//.test(f)).map((f) => f.split("/")[2]));
  const shipped = new Set(dests.filter((d) => d.startsWith("version/.claude/skills/")).map((d) => d.split("/")[3]));
  assert.deepEqual([...shipped].sort(), [...repoSkills].sort());
});

test("a new file in the panel or mentor ships with no change to parts.json", () => {
  const files = plan(loadParts(), [...tracked(), "panel/lib/new-screen.js", "mentor/lib/new-check.mjs"]);
  const dests = files.map((f) => f.dest);
  assert.ok(dests.includes("cep/AEMentorPanel/lib/new-screen.js"));
  assert.ok(dests.includes("version/mentor/lib/new-check.mjs"));
});

test("a rule that matches nothing is refused", () => {
  assert.throws(() => plan(loadParts(), tracked().filter((f) => !f.startsWith("bridge/cep/"))), /bridge\/cep/);
});

test("extensions are the AE-side parts", () => {
  assert.deepEqual(
    extensions(loadParts()).map((e) => e.name),
    ["AEMentorBridge", "AEMentorPanel"],
  );
});
