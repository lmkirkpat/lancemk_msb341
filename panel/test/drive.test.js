// panel/dev/drive.js --runtime a --fault <kind> (spec 013 T020): each fault through the real
// adapter and helper, against T005's local fake service, shows the panel's fixed message, no check
// result, and a failed turn. Every fault points the helper at this Mac, so no real API call is
// made. (T040 is the builder reading the same messages.)
"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { MESSAGES_A } = require("../lib/errors-a.js");

const DRIVE = path.resolve(__dirname, "..", "dev", "drive.js");
const REPO = path.resolve(__dirname, "..", "..");
const homes = [];
after(() => { for (const h of homes) fs.rmSync(h, { recursive: true, force: true }); });

// A panel.json with no runtime and no claude_path: only --runtime a (or --fault) can load it.
function panelHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-drive-"));
  homes.push(home);
  fs.writeFileSync(path.join(home, "panel.json"), JSON.stringify({ version: 1, node_path: process.execPath, repo_path: REPO }));
  return home;
}

// Runs drive.js until its first turn_end line, then quits. → { code, out, err }
function drive(args, { waitFor = /turn_end/ } = {}) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [DRIVE, ...args], { env: { HOME: os.homedir(), PATH: "/usr/bin:/bin", AE_MENTOR_HOME: panelHome() }, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let quit = false;
    const timer = setTimeout(() => p.kill("SIGKILL"), 30000);
    p.stdout.on("data", (d) => {
      out += d;
      if (!quit && waitFor.test(out)) {
        quit = true;
        p.stdin.write("quit\n");
      }
    });
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

const FAULTS = [
  ["no_key", "not_signed_in"],
  ["rejected", "not_signed_in"],
  ["out_of_credit", "out_of_credit"],
  ["rate_limited", "rate_limited"],
  ["service_busy", "service_busy"],
  ["offline", "offline"],
  ["start_failed", "start_failed"],
  ["refused", "refused"],
  ["dropped", "offline"],
];

for (const [fault, kind] of FAULTS) {
  test(`drive.js --runtime a --fault ${fault}: the panel's ${kind} message, no check result, a failed turn`, { timeout: 40000 }, async () => {
    const r = await drive(["--runtime", "a", "--fault", fault]);
    assert.equal(r.code, 0, r.err + r.out);
    assert.match(r.out, new RegExp(`fault: ${fault}`));
    assert.ok(r.out.includes(`error ${kind}: ${MESSAGES_A[kind]}`), r.out);
    assert.equal((r.out.match(/ error /g) || []).length, 1, "one message, shown once");
    assert.match(r.out, /turn_end ok=false/);
    assert.doesNotMatch(r.out, /tool_result/, "no check result for that turn");
    assert.doesNotMatch(r.out + r.err, /sk-ant-/, "no key, not even the stand-in");
    if (fault === "dropped") assert.match(r.out, /text: .+/, "words already streamed stay");
  });
}

test("drive.js --fault implies runtime a and a temporary learner home; an unknown fault lists the kinds", { timeout: 40000 }, async () => {
  const r = await drive(["--fault", "service_busy"]);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /runtime a/);
  const bad = await drive(["--fault", "gremlins"], { waitFor: /$^/ });
  assert.equal(bad.code, 1);
  assert.match(bad.err, /no_key, rejected, out_of_credit, rate_limited, service_busy, offline, start_failed, refused, dropped/);
});
