// installer/install.mjs, lib/preflight.mjs, lib/payload.mjs, lib/panel-config.mjs (T011), on a temp
// home. AE's version comes from real Info.plist files read with the real plutil; sw_vers and pgrep
// are faked.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { install, main, FAILED } from "../install.mjs";
import { layout } from "../lib/layout.mjs";
import { guard, OutsideError } from "../lib/fsx.mjs";
import { STEPS } from "../lib/payload.mjs";
import { STOP } from "../lib/preflight.mjs";
import { tmpdir, makePayload, makeNodeDir, makeApps, makeRun, snapshot, write } from "./fixtures.mjs";

const INSTALLER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function setup(t, o = {}) {
  const sandbox = tmpdir(t, "knack-sandbox-");
  const home = path.join(sandbox, "home");
  fs.mkdirSync(home);
  const payloadDir = makePayload(t, { version: o.version });
  const nodeDir = makeNodeDir(t);
  const apps = makeApps(t, o.ae || ["26.5"]);
  const state = { macos: "27.0.1", aeOpen: false, ...(o.state || {}) };
  const run = makeRun(state);
  const opts = { home, payloadDir, nodeDir, run, dirs: [apps] };
  const L = layout(home);
  return { sandbox, home, L, payloadDir, nodeDir, apps, state, run, opts };
}

// What an install leaves, without the inventory's order mattering.
// panel.json holds this home's own paths, so it's compared with the home written as ~.
const installed = (L) => {
  const learner = snapshot(L.learner);
  if (learner["panel.json"]) learner["panel.json"] = fs.readFileSync(L.panelJson, "utf8").split(L.home).join("~");
  return { knack: snapshot(L.knack), cep: snapshot(L.cep), learner };
};

test("a fresh install puts every part where the layout says", async (t) => {
  const { L, opts, run } = setup(t);
  const r = await install(opts);
  assert.deepEqual(r, { ok: true, note: "" });

  assert.equal(fs.readlinkSync(L.current), path.join("versions", "0.1.0"));
  for (const f of ["release.json", ".mcp.json", "mentor/server.mjs", "bridge/paths.mjs", ".claude/skills/ease-mentor/SKILL.md", "panel/helper/main.mjs", "setup/setup-check.mjs", "runtime/node/LICENSE"]) {
    assert.ok(fs.existsSync(path.join(L.current, f)), f);
  }
  const node = path.join(L.current, "runtime", "node", "bin", "node");
  assert.equal(fs.statSync(node).mode & 0o111, 0o111);
  assert.match(execFileSync(node, ["-e", "process.stdout.write('ran')"], { encoding: "utf8" }), /ran/);

  for (const name of ["AEMentorBridge", "AEMentorPanel"]) {
    const p = path.join(L.cep, name);
    assert.ok(!fs.lstatSync(p).isSymbolicLink(), `${name} is a real folder`);
    assert.ok(fs.existsSync(path.join(p, "META-INF", "signatures.xml")));
  }

  const cfg = JSON.parse(fs.readFileSync(L.panelJson, "utf8"));
  assert.deepEqual(cfg, { version: 1, runtime: "a", node_path: node, repo_path: L.current });
  assert.equal(fs.statSync(L.panelJson).mode & 0o777, 0o600);
  assert.ok(!("claude_path" in cfg));

  const st = JSON.parse(fs.readFileSync(L.state, "utf8"));
  assert.equal(st.version, "0.1.0");
  assert.deepEqual(st.settings_changed, []);
  assert.equal(st.keychain, null);
  assert.deepEqual(st.files, [
    "~/Library/Application Support/Knack",
    "~/Library/Application Support/Adobe/CEP/extensions/AEMentorBridge",
    "~/Library/Application Support/Adobe/CEP/extensions/AEMentorPanel",
    "~/Library/Application Support/AEMentor/panel.json",
    "~/Library/Application Support/AEMentor",
  ]);
  assert.doesNotMatch(fs.readFileSync(L.state, "utf8"), /\/Users\/|sandbox/);

  assert.ok(!fs.existsSync(L.tmp), "no temporary folder left");
  assert.ok(!run.calls.some((c) => /defaults|killall|osascript|\bkill\b/.test(c.cmd)), "no defaults, no quitting AE");
});

test("an existing learner record is kept byte for byte, and its folder isn't claimed (FR-009)", async (t) => {
  const { L, opts } = setup(t);
  write(L.learner, "learner.json", '{"lessons":[{"skill":"easing"}]}');
  write(L.learner, "session.json", "{}");
  write(L.learner, "notes/x.txt", "kept");
  const before = snapshot(L.learner);
  const mtime = fs.statSync(L.learnerFile).mtimeMs;
  assert.equal((await install(opts)).ok, true);
  const after = snapshot(L.learner);
  delete after["panel.json"];
  assert.deepEqual(after, before);
  assert.equal(fs.statSync(L.learnerFile).mtimeMs, mtime);
  const st = JSON.parse(fs.readFileSync(L.state, "utf8"));
  assert.ok(!st.files.includes("~/Library/Application Support/AEMentor"));
});

test("an unreadable learner record is left as it is", async (t) => {
  const { L, opts } = setup(t);
  write(L.learner, "learner.json", "{not json");
  assert.equal((await install(opts)).ok, true);
  assert.equal(fs.readFileSync(L.learnerFile, "utf8"), "{not json");
});

test("nothing is written outside the home folder, and the payload is unchanged", async (t) => {
  const { sandbox, home, payloadDir, nodeDir, apps, opts } = setup(t);
  write(sandbox, "neighbour/file.txt", "x");
  const outside = () => {
    const s = snapshot(sandbox);
    for (const k of Object.keys(s)) if (k === "home" || k.startsWith("home/")) delete s[k];
    return s;
  };
  const before = [outside(), snapshot(payloadDir), snapshot(nodeDir), snapshot(apps)];
  assert.equal((await install(opts)).ok, true);
  assert.deepEqual([outside(), snapshot(payloadDir), snapshot(nodeDir), snapshot(apps)], before);
  assert.ok(fs.existsSync(path.join(home, "Library")));
});

test("the write guard refuses anything outside its root", (t) => {
  const root = tmpdir(t);
  const g = guard(path.join(root, "in"));
  assert.throws(() => g.writeAtomic(path.join(root, "out.txt"), "x"), OutsideError);
  assert.throws(() => g.mkdir(path.join(root, "in", "..", "escape")), OutsideError);
  assert.throws(() => g.rm("/tmp"), OutsideError);
  g.writeAtomic(path.join(root, "in", "ok.txt"), "x");
  assert.ok(fs.existsSync(path.join(root, "in", "ok.txt")));
});

test("no source file writes macOS settings, turns on debug mode or quits AE", () => {
  const files = ["install.mjs", "setup-check.mjs", ...fs.readdirSync(path.join(INSTALLER, "lib")).map((f) => `lib/${f}`)].filter((f) => fs.existsSync(path.join(INSTALLER, f)));
  for (const f of files) {
    const src = fs.readFileSync(path.join(INSTALLER, f), "utf8").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(src, /["']defaults["']|\/usr\/bin\/defaults|PlayerDebugMode|killall|osascript|sudo/, f);
  }
});

test("a developer install stops with a plain message and changes nothing (FR-024 on the SC-002 path)", async (t) => {
  for (const name of ["AEMentorBridge", "AEMentorPanel"]) {
    const { L, home, opts } = setup(t);
    const repo = tmpdir(t, "knack-repo-");
    fs.mkdirSync(L.cep, { recursive: true });
    fs.symlinkSync(repo, path.join(L.cep, name));
    write(L.learner, "panel.json", '{"version":1,"repo_path":"x"}');
    const before = snapshot(home);
    const r = await install(opts);
    assert.deepEqual(r, { ok: false, reason: "dev_install", text: STOP.dev_install });
    assert.deepEqual(snapshot(home), before);
  }
});

test("a newer installed version stops it, changing nothing (FR-017)", async (t) => {
  const { home, opts, payloadDir } = setup(t, { version: "0.2.0" });
  assert.equal((await install(opts)).ok, true);
  const older = makePayload(t, { version: "0.1.0" });
  const before = snapshot(home);
  const r = await install({ ...opts, payloadDir: older });
  assert.equal(r.reason, "newer");
  assert.equal(r.text, "A newer version of Knack (0.2.0) is already installed, so nothing was changed.");
  assert.deepEqual(snapshot(home), before);
  assert.ok(payloadDir);
});

test("AE open: the install waits for it to be quit and never forces it (FR-010)", async (t) => {
  const { home, opts, state, run } = setup(t, { state: { aeOpen: true } });
  const r = await install(opts);
  assert.deepEqual(r, { ok: false, reason: "ae_open", text: STOP.ae_open });
  assert.deepEqual(snapshot(home), {});
  assert.equal((await main(["ae-open"], { run })).out, "open");
  state.aeOpen = false;
  assert.equal((await main(["ae-open"], { run })).out, "closed");
  assert.equal((await install(opts)).ok, true);
  assert.ok(run.calls.filter((c) => c.cmd === "/usr/bin/pgrep").every((c) => c.args[0] === "-f"));
});

test("unsupported Macs stop before anything is written (FR-011)", async (t) => {
  const cases = [
    [{ ae: [] }, "no_ae"],
    [{ ae: ["26.2", "25.6"] }, "old_ae"],
    [{ state: { macos: "25.6" } }, "macos"],
  ];
  for (const [o, reason] of cases) {
    const { home, opts } = setup(t, o);
    const r = await install(opts);
    assert.equal(r.reason, reason);
    assert.equal(r.text, STOP[reason]);
    assert.deepEqual(snapshot(home), {});
  }
  const { opts } = setup(t, { ae: ["26.2", "26.4"] });
  assert.equal((await install(opts)).ok, true, "one supported AE among several is enough");
});

test("an incomplete payload stops it", async (t) => {
  const { opts, payloadDir, home } = setup(t);
  fs.rmSync(path.join(payloadDir, "cep", "AEMentorPanel", "META-INF"), { recursive: true });
  assert.equal((await install(opts)).reason, "bad_payload");
  assert.deepEqual(snapshot(home), {});
});

test("running it again on a working install leaves the same working install (FR-012)", async (t) => {
  const { L, opts } = setup(t);
  await install(opts);
  write(L.learner, "learner.json", '{"lessons":[1]}');
  const first = installed(L);
  assert.equal((await install(opts)).ok, true);
  assert.deepEqual(installed(L), first);
});

for (const fresh of [true, false]) {
  test(`a kill after each step leaves a state a re-run completes (${fresh ? "fresh Mac" : "over an earlier version"})`, async (t) => {
    // The result of an uninterrupted install, to compare against.
    const ref = setup(t, { version: "0.2.0" });
    if (!fresh) await install({ ...ref.opts, payloadDir: makePayload(t, { version: "0.1.0" }) });
    write(ref.L.learner, "learner.json", '{"lessons":[1]}');
    await install(ref.opts);
    const want = installed(ref.L);

    for (const killAt of STEPS) {
      const s = setup(t, { version: "0.2.0" });
      if (!fresh) await install({ ...s.opts, payloadDir: makePayload(t, { version: "0.1.0" }) });
      write(s.L.learner, "learner.json", '{"lessons":[1]}');
      const killed = await install({
        ...s.opts,
        afterStep: (name) => {
          if (name === killAt) throw new Error("killed");
        },
      });
      assert.deepEqual(killed, { ok: false, reason: "failed", text: FAILED }, killAt);
      assert.equal(fs.readFileSync(s.L.learnerFile, "utf8"), '{"lessons":[1]}', `record intact after a kill at ${killAt}`);
      if (!fresh && STEPS.indexOf(killAt) < STEPS.indexOf("current")) {
        assert.equal(fs.readlinkSync(s.L.current), path.join("versions", "0.1.0"), `the earlier version stays active after a kill at ${killAt}`);
      }
      const again = await install(s.opts);
      assert.equal(again.ok, true, `re-run after a kill at ${killAt}`);
      assert.deepEqual(installed(s.L), want, `same result after a kill at ${killAt}`);
    }
  });
}

test("an update swaps every part to the new version together", async (t) => {
  const { L, opts } = setup(t, { version: "0.1.0" });
  await install(opts);
  const r = await install({ ...opts, payloadDir: makePayload(t, { version: "0.2.0" }) });
  assert.equal(r.ok, true);
  assert.equal(fs.readlinkSync(L.current), path.join("versions", "0.2.0"));
  assert.match(fs.readFileSync(path.join(L.cep, "AEMentorPanel", "CSXS", "manifest.xml"), "utf8"), /ExtensionBundleVersion="0\.2\.0"/);
  assert.match(fs.readFileSync(path.join(L.current, "mentor", "server.mjs"), "utf8"), /0\.2\.0/);
  assert.equal(JSON.parse(fs.readFileSync(L.state, "utf8")).version, "0.2.0");
});

test("the CLI: preflight prints ok or stop with the message", async (t) => {
  const { opts, run, apps, home } = setup(t);
  assert.deepEqual(await main(["preflight", "--payload", opts.payloadDir], { home, run, dirs: [apps] }), { out: "ok", code: 0 });
  const r = await main(["preflight", "--payload", opts.payloadDir], { home, run, dirs: [] });
  assert.deepEqual(r, { out: `stop\n${STOP.no_ae}`, code: 1 });
  assert.equal((await main(["bogus"], {})).code, 2);
  assert.equal((await main(["install", "--nope"], {})).code, 2);
});

test("the CLI runs as a program", () => {
  const out = execFileSync(process.execPath, [path.join(INSTALLER, "install.mjs"), "ae-open"], { encoding: "utf8" }).trim();
  assert.ok(out === "open" || out === "closed");
});

test("every stop message is plain: no paths, field names, codes or commands", () => {
  for (const raw of [...Object.values(STOP).map((v) => (typeof v === "function" ? v("0.2.0") : v)), FAILED]) {
    const text = raw.replace(/\byour IT team\b/g, "your helpers"); // "IT" is a plain word, not a code
    assert.doesNotMatch(text, /\/|`|\b[a-z]+_[a-z_]+\b|\b[A-Z]{2,}_?[A-Z0-9]*\b|\bnpm\b|\bnode\b|\bbash\b|Terminal/, text);
    assert.ok(text.split(/(?<=\.)\s/).length <= 2, `one or two sentences: ${text}`);
  }
});

// T031: a managed Mac blocking the install is named, before anything is written or when a write fails.
const asRoot = typeof process.getuid === "function" && process.getuid() === 0;

test("a home the installer can't write to stops it before anything is written, naming management when enrolled", { skip: asRoot }, async (t) => {
  for (const managed of [false, true]) {
    const { home, opts } = setup(t, { state: { managed } });
    fs.chmodSync(home, 0o555);
    let r, before, after;
    try {
      before = snapshot(home);
      r = await install(opts);
      after = snapshot(home);
    } finally {
      fs.chmodSync(home, 0o755);
    }
    assert.equal(r.ok, false);
    assert.equal(r.reason, managed ? "managed" : "blocked");
    assert.equal(r.text, STOP[r.reason]);
    assert.deepEqual(after, before);
  }
});

test("a write refused partway through is named the same way, and a re-run completes once it's allowed", { skip: asRoot }, async (t) => {
  const { L, opts, state } = setup(t, { state: { managed: true } });
  fs.mkdirSync(L.cep, { recursive: true });
  let r;
  try {
    r = await install({ ...opts, afterStep: (name) => name === "place_version" && fs.chmodSync(L.cep, 0o555) });
  } finally {
    fs.chmodSync(L.cep, 0o755);
  }
  assert.equal(r.reason, "managed");
  assert.equal(r.text, STOP.managed);
  state.managed = false;
  assert.equal((await install(opts)).ok, true);
});
