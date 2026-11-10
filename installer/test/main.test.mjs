// lib/main.mjs and the two shipped entry points run through a link (spec 006 T017 run 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isMain } from "../lib/main.mjs";
import { INSTALLER_DIR } from "../buildlib/parts.mjs";

test("isMain matches through a link and refuses another file", (t) => {
  const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "knack-main-")));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  fs.mkdirSync(path.join(d, "v1"));
  fs.writeFileSync(path.join(d, "v1", "a.mjs"), "");
  fs.writeFileSync(path.join(d, "v1", "b.mjs"), "");
  fs.symlinkSync("v1", path.join(d, "current"));
  const url = pathToFileURL(path.join(d, "v1", "a.mjs")).href;
  assert.equal(isMain(url, path.join(d, "current", "a.mjs")), true);
  assert.equal(isMain(url, path.join(d, "v1", "a.mjs")), true);
  assert.equal(isMain(url, path.join(d, "v1", "b.mjs")), false);
  assert.equal(isMain(url, path.join(d, "missing.mjs")), false);
  assert.equal(isMain(url, undefined), false);
});

test("setup-check.mjs and install.mjs print when run through a linked folder, as the applet runs them", (t) => {
  const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "knack-mainlink-")));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  fs.symlinkSync(INSTALLER_DIR, path.join(d, "current"));
  const home = path.join(d, "home");
  fs.mkdirSync(home);
  const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: home };
  const out = (args) => {
    try {
      return execFileSync(process.execPath, args, { env, encoding: "utf8", timeout: 30000 });
    } catch (e) {
      return e.stdout; // exit 1 is expected: nothing is installed in this home
    }
  };
  const check = out([path.join(d, "current", "setup-check.mjs"), "--json"]).trim() || "(empty)";
  assert.ok(check.startsWith("{"), `setup-check printed: ${check.slice(0, 80)}`);
  const unknown = out([path.join(d, "current", "install.mjs"), "nonsense"]);
  assert.match(unknown, /^failed\n/);
});
