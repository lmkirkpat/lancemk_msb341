// installer/applet/installer.applescript (T014): it compiles, the key only travels over stdin, the
// screens come in the contract's order with plain copy, and nothing asks for Terminal, an admin
// password or quits After Effects. Its runTask handler is run for real through osascript (no
// dialogs). The full applet is the builder's live check (T017).

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "./fixtures.mjs";

const INSTALLER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_FILE = path.join(INSTALLER, "applet", "installer.applescript");
const SRC = fs.readFileSync(SRC_FILE, "utf8");
const CODE = SRC.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
const RUN = CODE.slice(CODE.indexOf("\non run"), CODE.indexOf("\nend run"));

test("it compiles with osacompile", (t) => {
  const out = tmpdir(t, "knack-applet-");
  execFileSync("osacompile", ["-o", path.join(out, "Knack Installer.app"), SRC_FILE], { stdio: "pipe" });
  assert.ok(fs.existsSync(path.join(out, "Knack Installer.app", "Contents", "Resources", "Scripts", "main.scpt")));
});

test("the key never goes through a shell: no do shell script, and only as stdin to runNode", () => {
  assert.doesNotMatch(CODE, /do shell script/);
  const uses = CODE.split("\n").filter((l) => /accessKey/.test(l));
  for (const l of uses) {
    const ok =
      /^\s*set accessKey to (""|text returned of reply)\s*$/.test(l) ||
      /^\s*set accessKey to ""\s*$/.test(l) ||
      /my runNode\(nodeDir, \{[^}]*\}, accessKey\)/.test(l);
    assert.ok(ok, `unexpected use of the key: ${l.trim()}`);
  }
  assert.ok(uses.some((l) => /"key-check"/.test(l)), "the key check gets it on stdin");
  assert.ok(uses.some((l) => /"install"/.test(l)), "the install gets it on stdin");
  assert.match(CODE, /with hidden answer/);
  // Cleared once it's been handed over, and on any error.
  assert.match(RUN, /"--key-status", keyStatus\}, accessKey\)\n\s*set accessKey to ""/);
});

test("no Terminal, no admin password, and After Effects is never quit or scripted", () => {
  assert.doesNotMatch(CODE, /administrator privileges|Terminal|sudo|tell application|killall|PlayerDebugMode|defaults/);
});

test("the screens come in the contract's order", () => {
  const at = (re) => {
    const i = RUN.search(re);
    assert.ok(i >= 0, `missing ${re}`);
    return i;
  };
  const order = [
    at(/Nothing is installed until you agree/),
    at(/runTask\("\/bin\/bash"/),
    at(/"key-check"/),
    at(/"ae-open"/),
    at(/"install", "--payload"/),
    at(/Knack is installed\./),
    at(/runSetupCheck\(\)/),
  ];
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("the first screen says what it adds and what is sent, before anything runs (FR-007)", () => {
  const consent = RUN.slice(0, RUN.indexOf("runTask"));
  for (const must of ["Knack panel for After Effects", "connection to After Effects", "mentor", "lesson history", "frames from your comp are sent to Anthropic, the model provider"]) {
    assert.ok(consent.includes(must), must);
  }
  assert.match(consent, /cancel button 1/);
});

test("the last screen: restart AE, the setting with its menu path, open the panel, Check Setup", () => {
  assert.match(RUN, /quit it and open it again/);
  assert.match(RUN, /After Effects > Settings > Scripting & Expressions, and tick “Allow Scripts to Write Files and Access Network”/);
  assert.match(RUN, /Window > Extensions > Knack/);
  assert.match(RUN, /click Check Setup/);
  assert.match(RUN, /"Check Again"/, "the check can be pressed again");
});

test("AE open: it asks and waits in a loop, and only ever checks", () => {
  const loop = RUN.slice(RUN.indexOf('"ae-open"') - 200, RUN.indexOf("-- 5. Install"));
  assert.match(loop, /repeat/);
  assert.match(loop, /quit After Effects, then click Continue/);
});

test("the one bash line only unpacks Node with ditto and starts install.mjs", () => {
  const m = /set prepScript to "(.*)"\n/.exec(CODE);
  const bash = m[1].replace(/\\"/g, '"');
  assert.match(bash, /\/usr\/bin\/ditto -x -k "\$1\/node\/node-\$a\.zip" "\$d"/);
  assert.match(bash, /exec "\$d\/bin\/node" "\$1\/version\/setup\/install\.mjs" preflight --payload "\$1"/);
  assert.match(bash, /hw\.optional\.arm64/, "picks arm64 on Apple silicon even under Rosetta");
  assert.doesNotMatch(bash, /rm |curl|defaults|sudo/);
});

test("every dialog's copy is plain: no paths, field names, codes or commands", () => {
  const strings = [...CODE.matchAll(/display dialog ((?:"[^"]*"(?:\s*&\s*(?:return\s*&\s*)*¬?\s*)?)+)/g)].map((m) =>
    [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]).join(" "),
  );
  assert.ok(strings.length >= 8, `found ${strings.length} dialogs`);
  for (const s of strings) {
    const bare = s.replace(/Window > Extensions > Knack|After Effects > Settings > Scripting & Expressions/g, "the menu");
    assert.doesNotMatch(bare, /\/|`|\b[a-z]+_[a-z_]+\b|\b[A-Z]{3,}\b|\b(npm|node|bash|Terminal|Keychain|JSON)\b/, s);
  }
});

test("runTask sends stdin and passes only PATH, HOME and TMPDIR", (t) => {
  const dir = tmpdir(t, "knack-harness-");
  const header = SRC.split("\n").filter((l) => /^(use |property )/.test(l)).join("\n");
  const handlers = SRC.slice(SRC.indexOf("\non runTask"));
  const harness = `${header}\n${handlers}\non run\nreturn my runTask("/bin/cat", {}, "stdin-ok") & "|" & my runTask("/usr/bin/env", {}, missing value) & "|" & my runTask("/no/such/program", {}, missing value)\nend run\n`;
  const file = path.join(dir, "harness.applescript");
  fs.writeFileSync(file, harness);
  const out = execFileSync("osascript", [file], { encoding: "utf8" }).trim();
  const [cat, env, missing] = out.split("|");
  assert.equal(cat, "stdin-ok");
  assert.deepEqual(env.split("\n").map((l) => l.split("=")[0]).sort(), ["HOME", "PATH", "TMPDIR"]);
  assert.match(env, /^PATH=\/usr\/bin:\/bin:\/usr\/sbin:\/sbin$/m);
  assert.equal(missing, "", "a program that can't start gives nothing, not an error dialog");
});

test("a developer install is offered as Replace or Cancel, and the choice reaches the install (FR-024)", () => {
  assert.match(RUN, /if paragraph 2 of prep is "dev" then\n\s*display dialog my restOf\(prep, 3\) buttons \{"Cancel", "Replace"\} default button 1 cancel button 1/);
  assert.match(RUN, /"--replace-dev", replaceDev, "--key-status", keyStatus\}, accessKey\)/);
  assert.ok(RUN.indexOf('"dev"') < RUN.indexOf('"key-check"'), "asked before the key");
});
