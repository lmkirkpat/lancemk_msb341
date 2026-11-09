// installer/build.mjs (T010), on a throwaway git repo. Real git, tar, ditto, osacompile, plutil and
// codesign (ad hoc); fakes for npm, the Keychain, ZXPSignCmd and the Node download.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build, stampManifest, pruneModules, BuildError, SIGNING } from "../build.mjs";
import { run as realRun } from "../lib/run.mjs";
import { INSTALLER_DIR } from "../buildlib/parts.mjs";

const PASSWORD = "fake-signing-pw-7f3a";
const MANIFEST = (id, v) => `<?xml version="1.0"?>
<ExtensionManifest Version="7.0" ExtensionBundleId="${id}" ExtensionBundleVersion="${v}" ExtensionBundleName="X">
  <ExtensionList>
    <Extension Id="${id}.a" Version="${v}" />
    <Extension Id="${id}.b" Version="${v}" />
  </ExtensionList>
  <ExecutionEnvironment><HostList><Host Name="AEFT" Version="[18.0,99.9]" /></HostList></ExecutionEnvironment>
</ExtensionManifest>
`;
const SETTINGS_MJS = `import crypto from "node:crypto"; import fs from "node:fs"; import path from "node:path";
export function settingsHash(file, dir) { const h = crypto.createHash("sha256");
  for (const f of [file, path.join(dir, "main.mjs")]) h.update(fs.readFileSync(f)); return h.digest("hex"); }
`;

function write(root, rel, text, mode) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  if (mode) fs.chmodSync(p, mode);
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "knack-build-repo-"));
  const files = {
    "CLAUDE.md": "builder notes",
    ".mcp.json": '{"mcpServers":{"ae-mentor":{"command":"node","args":["mentor/server.mjs"]}}}',
    "bridge/paths.mjs": "export const X = 1;\n",
    "bridge/install.sh": "#!/bin/sh\n",
    "bridge/cep/CSXS/manifest.xml": MANIFEST("com.aementor.bridge", "1.0.0"),
    "bridge/cep/host.js": "// host\n",
    "panel/CSXS/manifest.xml": MANIFEST("com.aementor.panel", "0.1.0"),
    "panel/main.js": "// main\n",
    "panel/install.sh": "#!/bin/sh\n",
    "panel/package.json": "{}",
    "panel/test/a.test.js": "",
    "panel/dev/drive.js": "",
    "panel/helper/main.mjs": "// helper\n",
    "panel/helper/settings.json": '{"version":1}',
    "panel/helper/package.json": '{"name":"h"}',
    "panel/helper/package-lock.json": "{}",
    "panel/helper/lib/settings.mjs": SETTINGS_MJS,
    "panel/helper/test/t.test.mjs": "",
    "mentor/server.mjs": "// server\n",
    "mentor/fixture.mjs": "// code\n",
    "mentor/fixture/data.mjs": "",
    "mentor/test/x.test.mjs": "",
    "mentor/dev/capture.mjs": "",
    "mentor/package.json": "{}",
    ".claude/skills/ease-mentor/SKILL.md": "ease",
    ".claude/skills/learn/SKILL.md": "not shipped",
    ".claude/agents/x.md": "not shipped",
    "installer/install.mjs": "// install\n",
    "installer/setup-check.mjs": "// check\n",
    "installer/lib/run.mjs": "// run\n",
    "installer/build.mjs": "// build\n",
    "installer/test/b.test.mjs": "",
    "installer/applet/installer.applescript": 'display dialog "hi"\n',
  };
  for (const [rel, text] of Object.entries(files)) write(root, rel, text);
  fs.copyFileSync(path.join(INSTALLER_DIR, "parts.json"), path.join(root, "installer", "parts.json"));
  return root;
}

function commitAll(root) {
  const g = (...a) => execFileSync("git", a, { cwd: root, stdio: "pipe" });
  g("init", "-q");
  g("add", "-A");
  g("-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "x");
}

// Fake Node tarballs, with a node.json that names their hashes.
function makeNode(dir, { wrong } = {}) {
  const files = {};
  for (const arch of ["arm64", "x64"]) {
    const prefix = `node-v26.8.1-darwin-${arch}`;
    const src = fs.mkdtempSync(path.join(os.tmpdir(), "knack-node-src-"));
    write(src, `${prefix}/bin/node`, `#!/bin/sh\necho v26.8.1-${arch}\n`, 0o755);
    write(src, `${prefix}/LICENSE`, "MIT");
    write(src, `${prefix}/include/node.h`, "not shipped");
    const tgz = path.join(dir, `${prefix}.tar.gz`);
    execFileSync("tar", ["-czf", tgz, "-C", src, prefix]);
    const sha = crypto.createHash("sha256").update(fs.readFileSync(tgz)).digest("hex");
    files[arch] = { name: `${prefix}.tar.gz`, sha256: wrong ? "0".repeat(64) : sha };
  }
  const nodeFile = path.join(dir, "node.json");
  fs.writeFileSync(nodeFile, JSON.stringify({ version: "26.8.1", base_url: "https://nodejs.org/dist/v26.8.1/", files }));
  return nodeFile;
}

// A runner that fakes npm, the Keychain read and ZXPSignCmd, records every call, and runs the rest.
function makeRun(t, { zxp, signFails, npmTouch } = {}) {
  const calls = [];
  const fn = async (cmd, args = [], opts = {}) => {
    calls.push({ cmd, args: [...args], env: opts.env, input: opts.input });
    if (cmd === "npm") {
      const nm = path.join(opts.cwd, "node_modules", "@anthropic-ai", "sdk");
      write(nm, "index.js", "module.exports = {};");
      write(nm, "index.d.ts", "types");
      write(nm, "index.js.map", "{}");
      write(nm, "README.md", "docs");
      write(nm, "LICENSE", "MIT");
      write(nm, "docs/guide.txt", "docs");
      if (npmTouch) npmTouch(opts.cwd);
      return { code: 0, stdout: "", stderr: "" };
    }
    if (cmd === "/usr/bin/security") {
      assert.deepEqual(args, ["find-generic-password", "-s", SIGNING.service, "-a", SIGNING.account, "-w"]);
      return { code: 0, stdout: PASSWORD + "\n", stderr: "" };
    }
    if (cmd === zxp) {
      if (args[0] === "-sign") {
        if (signFails) return { code: 1, stdout: "", stderr: `bad password ${args[4]}` };
        const [, dir, out] = args;
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knack-zxp-"));
        execFileSync("ditto", [dir, tmp]);
        write(tmp, "META-INF/signatures.xml", "<signatures/>");
        execFileSync("ditto", ["-c", "-k", tmp, out]);
        return { code: 0, stdout: "", stderr: "" };
      }
      if (args[0] === "-verify") {
        return fs.existsSync(path.join(args[1], "META-INF", "signatures.xml"))
          ? { code: 0, stdout: "Signature verified successfully", stderr: "" }
          : { code: 1, stdout: "", stderr: "unsigned" };
      }
    }
    return realRun(cmd, args, opts);
  };
  fn.calls = calls;
  return fn;
}

function setup(t, extra = {}) {
  const repo = makeRepo();
  if (!extra.noCommit) commitAll(repo);
  const tools = fs.mkdtempSync(path.join(os.tmpdir(), "knack-build-tools-"));
  const zxp = path.join(tools, "ZXPSignCmd");
  const p12 = path.join(tools, "knack.p12");
  write(tools, "ZXPSignCmd", "#!/bin/sh\nexit 9\n", 0o755);
  write(tools, "knack.p12", "p12");
  const nodeDir = fs.mkdtempSync(path.join(os.tmpdir(), "knack-node-"));
  const nodeFile = makeNode(nodeDir, extra);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "knack-build-out-"));
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "knack-build-cache-"));
  const fetched = [];
  const fetchFile = async (url, dest) => {
    fetched.push(url);
    fs.copyFileSync(path.join(nodeDir, path.basename(new URL(url).pathname)), dest);
  };
  const logs = [];
  const run = makeRun(t, { zxp, ...extra });
  t.after(() => {
    for (const d of [repo, tools, nodeDir, out, cacheDir]) fs.rmSync(d, { recursive: true, force: true });
  });
  const opts = { repo, channel: "test", out, nodeFile, cacheDir, zxpSignCmd: zxp, p12, run, fetchFile, log: (m) => logs.push(m), env: process.env };
  return { repo, opts, run, fetched, logs, out, cacheDir };
}

const listAll = (dir) => {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r);
      else out.push(r);
    }
  };
  walk(dir, "");
  return out.sort();
};

test("stampManifest sets the bundle and each extension's version, nothing else", () => {
  const x = stampManifest(MANIFEST("com.aementor.panel", "0.1.0"), "0.2.0");
  assert.match(x, /ExtensionBundleVersion="0\.2\.0"/);
  assert.equal((x.match(/Version="0\.2\.0"/g) || []).length, 3);
  assert.match(x, /<ExtensionManifest Version="7\.0"/, "the manifest format version is untouched");
  assert.match(x, /Host Name="AEFT" Version="\[18\.0,99\.9\]"/, "the host range is untouched");
  assert.throws(() => stampManifest("<x/>", "1.0.0"), BuildError);
});

test("pruneModules drops types, maps and docs, keeps code and licences", (t) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "knack-prune-"));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  for (const f of ["a/index.js", "a/index.d.ts", "a/x.d.mts", "a/index.js.map", "a/README.md", "a/CHANGELOG", "a/LICENSE.md", "a/docs/x.txt", "a/core.mjs"]) write(d, f, "x");
  pruneModules(d);
  assert.deepEqual(listAll(d), ["a/LICENSE.md", "a/core.mjs", "a/index.js"]);
});

test("a full test build: staged parts, Node, stamped manifests, release.json, signed extensions, applet, zip", async (t) => {
  const { repo, opts, run, logs } = setup(t);
  const r = await build(opts);
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  assert.equal(r.commit, head);
  assert.equal(r.version, "0.1.0");
  assert.ok(fs.existsSync(r.zipPath) && r.zipBytes > 0);
  assert.match(r.zipSha256, /^[0-9a-f]{64}$/);

  const files = listAll(r.payloadDir);
  for (const must of [
    "release.json",
    "version/release.json",
    "version/.mcp.json",
    "version/bridge/paths.mjs",
    "version/mentor/server.mjs",
    "version/mentor/fixture.mjs",
    "version/panel/helper/main.mjs",
    "version/panel/helper/node_modules/@anthropic-ai/sdk/index.js",
    "version/panel/helper/node_modules/@anthropic-ai/sdk/LICENSE",
    "version/.claude/skills/ease-mentor/SKILL.md",
    "version/setup/install.mjs",
    "version/setup/setup-check.mjs",
    "version/setup/lib/run.mjs",
    "cep/AEMentorBridge/host.js",
    "cep/AEMentorBridge/META-INF/signatures.xml",
    "cep/AEMentorPanel/main.js",
    "cep/AEMentorPanel/META-INF/signatures.xml",
    "node/node-arm64.zip",
    "node/node-x64.zip",
  ]) assert.ok(files.includes(must), `ships ${must}`);
  for (const bad of [/CLAUDE\.md/, /(^|\/)(test|dev)\//, /mentor\/fixture\//, /\.sh$/, /skills\/learn/, /\.claude\/agents/, /\.d\.ts$/, /\.map$/, /README\.md$/, /cep\/AEMentorPanel\/(helper|package\.json)/, /setup\/build\.mjs/, /setup\/applet/]) {
    assert.ok(!files.some((f) => bad.test(f)), `doesn't ship ${bad}`);
  }

  // Node zips hold bin/node (still executable) and the licence only.
  const unz = fs.mkdtempSync(path.join(os.tmpdir(), "knack-unz-"));
  t.after(() => fs.rmSync(unz, { recursive: true, force: true }));
  execFileSync("ditto", ["-x", "-k", path.join(r.payloadDir, "node", "node-arm64.zip"), unz]);
  assert.deepEqual(listAll(unz), ["LICENSE", "bin/node"]);
  assert.equal(execFileSync(path.join(unz, "bin", "node"), { encoding: "utf8" }).trim(), "v26.8.1-arm64");

  // Manifests: staged copies stamped, the repo's untouched.
  for (const [name, src] of [["AEMentorPanel", "panel"], ["AEMentorBridge", "bridge/cep"]]) {
    const staged = fs.readFileSync(path.join(r.payloadDir, "cep", name, "CSXS", "manifest.xml"), "utf8");
    assert.match(staged, /ExtensionBundleVersion="0\.1\.0"/);
    assert.doesNotMatch(staged, /Version="1\.0\.0"/);
  }
  assert.match(fs.readFileSync(path.join(repo, "bridge/cep/CSXS/manifest.xml"), "utf8"), /ExtensionBundleVersion="1\.0\.0"/);
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" }), "");

  // release.json
  const rel = JSON.parse(fs.readFileSync(path.join(r.payloadDir, "release.json"), "utf8"));
  assert.equal(rel.channel, "test");
  assert.equal(rel.evals, null);
  assert.equal(rel.commit, head);
  assert.deepEqual(Object.keys(rel.parts).sort(), ["ae-pipe", "helper", "mentor", "node", "panel", "skills"]);
  assert.ok(Object.values(rel.parts).every((v) => v === "0.1.0"));
  assert.match(rel.node.arm64_sha256, /^[0-9a-f]{64}$/);
  assert.equal(rel.helper_hash, r.helperHash);
  assert.deepEqual(fs.readFileSync(path.join(r.payloadDir, "version", "release.json")), fs.readFileSync(path.join(r.payloadDir, "release.json")));
  // No user path in it.
  assert.doesNotMatch(JSON.stringify(rel), /\/Users\//);

  // The applet holds the payload and its version, and its ad hoc signature checks.
  const res = path.join(r.appPath, "Contents", "Resources", "payload");
  assert.ok(fs.existsSync(path.join(res, "release.json")));
  assert.ok(fs.existsSync(path.join(res, "cep", "AEMentorPanel", "META-INF", "signatures.xml")));
  assert.equal(execFileSync("plutil", ["-extract", "CFBundleShortVersionString", "raw", "-o", "-", path.join(r.appPath, "Contents", "Info.plist")], { encoding: "utf8" }).trim(), "0.1.0");
  execFileSync("codesign", ["--verify", "--deep", "--strict", r.appPath]);

  // The zip unpacks to the one app.
  const unzApp = fs.mkdtempSync(path.join(os.tmpdir(), "knack-unzapp-"));
  t.after(() => fs.rmSync(unzApp, { recursive: true, force: true }));
  execFileSync("ditto", ["-x", "-k", r.zipPath, unzApp]);
  assert.deepEqual(fs.readdirSync(unzApp), ["Knack Installer.app"]);

  // npm ran in the staged helper, production only, never in the repo.
  const npm = run.calls.find((c) => c.cmd === "npm");
  assert.deepEqual(npm.args.slice(0, 2), ["ci", "--omit=dev"]);
  // The password reaches ZXPSignCmd only, and never a log line.
  const withPw = run.calls.filter((c) => c.args.includes(PASSWORD));
  assert.ok(withPw.length === 2 && withPw.every((c) => c.cmd === opts.zxpSignCmd && c.args[0] === "-sign"));
  assert.ok(!logs.join("\n").includes(PASSWORD));
  assert.ok(withPw.every((c) => c.args.includes("-tsa")));
});

test("refuses a dirty tree: a changed file, or an untracked one", async (t) => {
  const { repo, opts } = setup(t);
  fs.appendFileSync(path.join(repo, "mentor", "server.mjs"), "// change\n");
  await assert.rejects(build(opts), /uncommitted changes/);
  execFileSync("git", ["checkout", "--", "mentor/server.mjs"], { cwd: repo });
  write(repo, "notes.txt", "untracked");
  await assert.rejects(build(opts), /untracked/);
  assert.deepEqual(fs.readdirSync(opts.out), [], "nothing staged");
});

test("only --channel test", async (t) => {
  const { opts } = setup(t);
  await assert.rejects(build({ ...opts, channel: "release" }), /T043/);
  await assert.rejects(build({ ...opts, channel: undefined }), /--channel test/);
});

test("refuses a Node download that doesn't match node.json, and keeps nothing from it", async (t) => {
  const { opts, cacheDir } = setup(t, { wrong: true });
  await assert.rejects(build(opts), /doesn't match node\.json/);
  assert.deepEqual(fs.readdirSync(cacheDir).filter((f) => f.endsWith(".tar.gz")), []);
});

test("a cached Node with the right hash isn't downloaded again", async (t) => {
  const { opts, fetched } = setup(t);
  await build(opts);
  assert.equal(fetched.length, 2);
  await build(opts);
  assert.equal(fetched.length, 2);
});

test("refuses when the staged helper's settings hash differs from the repo's", async (t) => {
  const { opts } = setup(t, { npmTouch: (helper) => fs.appendFileSync(path.join(helper, "main.mjs"), "// changed\n") });
  await assert.rejects(build(opts), /settings hash/);
});

test("a failed signing names the step and never shows the password", async (t) => {
  const { opts } = setup(t, { signFails: true });
  const err = await build(opts).catch((e) => e);
  assert.ok(err instanceof BuildError);
  assert.match(err.message, /Signing AEMentorBridge failed/);
  assert.ok(!err.message.includes(PASSWORD));
  assert.match(err.message, /<redacted>/);
});

test("missing signing tools stop the build before signing", async (t) => {
  const { opts } = setup(t);
  await assert.rejects(build({ ...opts, p12: path.join(opts.out, "nope.p12") }), /Missing nope\.p12/);
});

test("the committed node.json has both official hashes", () => {
  const n = JSON.parse(fs.readFileSync(path.join(INSTALLER_DIR, "node.json"), "utf8"));
  assert.equal(n.version, "26.8.1");
  assert.equal(n.files.arm64.sha256, "6e577fd0d9db776db82306629e441a9dace416702622aebdd171c9dfaa41f4d2");
  assert.equal(n.files.x64.sha256, "fe9c6dbf9c8e1b4443803d75e2a20366e420dae650c747dbb116b22975751baf");
  assert.equal(n.base_url, "https://nodejs.org/dist/v26.8.1/");
});
