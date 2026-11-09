#!/usr/bin/env node
// Builds Knack's Mac installer (specs/006-installer T010, plan D1 to D3, research R1 to R4, R6).
//   node installer/build.mjs --channel test [--out <folder>]
// From a clean commit: stages what parts.json ships, installs the helper's packages from its
// lockfile, adds the private Node for arm64 and x64 (checked against node.json), stamps one version
// into the staged manifests (never the repo's), writes release.json, checks the helper's settings
// hash against the repo's, signs both extensions with ZXPSignCmd, compiles the applet, puts the
// payload in it, re-signs it ad hoc and zips it. Only `test` builds exist yet; `release` is T043.
//
// Outside the repo, on the builder's Mac only (T002): ZXPSignCmd and knack.p12 in
// ~/Library/Application Support/KnackBuild/, the .p12 password in the login Keychain (service
// knack-build-signing, account knack). The password is passed to ZXPSignCmd, which only takes it
// as an argument; it's never printed, logged or written.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { run as defaultRun } from "./lib/run.mjs";
import { loadParts, plan, extensions, INSTALLER_DIR } from "./buildlib/parts.mjs";

export const BUILD_HOME = path.join(os.homedir(), "Library", "Application Support", "KnackBuild");
export const SIGNING = Object.freeze({ service: "knack-build-signing", account: "knack" });
export const TSA_URL = "http://timestamp.digicert.com";
export const APP_NAME = "Knack Installer.app";
const DOC_FILE = /^(readme|changelog|history|contributing|code_of_conduct|security)(\.[a-z]+)?$/i;
const TYPE_FILE = /\.d\.(ts|mts|cts)$/;
const MAP_FILE = /\.map$/;

export class BuildError extends Error {}

export function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(1 << 20);
  try {
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

// The staged manifest gets the release's version as its bundle version and each extension's
// version. → the new XML. Throws when there's no bundle version to replace.
export function stampManifest(xml, version) {
  if (!/ExtensionBundleVersion="[^"]*"/.test(xml)) throw new BuildError("A manifest has no ExtensionBundleVersion.");
  let out = xml.replace(/ExtensionBundleVersion="[^"]*"/, `ExtensionBundleVersion="${version}"`);
  out = out.replace(/<ExtensionList>[\s\S]*?<\/ExtensionList>/, (list) =>
    list.replace(/(<Extension\s+Id="[^"]+"\s+Version=")[^"]*"/g, `$1${version}"`),
  );
  return out;
}

// After npm ci: drop type declarations, source maps and docs; keep licences.
export function pruneModules(dir) {
  let removed = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === "docs" || e.name === "doc") {
          fs.rmSync(p, { recursive: true, force: true });
          removed++;
        } else walk(p);
        continue;
      }
      if (/^licen[cs]e/i.test(e.name)) continue;
      if (TYPE_FILE.test(e.name) || MAP_FILE.test(e.name) || DOC_FILE.test(e.name) || /\.md$/i.test(e.name)) {
        fs.rmSync(p, { force: true });
        removed++;
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return removed;
}

function redact(text, secret) {
  const s = String(text || "");
  return secret ? s.split(secret).join("<redacted>") : s;
}

async function must(run, cmd, args, opts, what, secret) {
  const r = await run(cmd, args, opts);
  if (r.code !== 0) {
    const detail = redact(`${r.stderr || ""}${r.stdout || ""}`, secret).trim().slice(-600);
    throw new BuildError(`${what} failed${detail ? `: ${detail}` : "."}`);
  }
  return r;
}

async function defaultFetch(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new BuildError(`Download failed (${res.status}): ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// opts: { repo, channel, out, partsFile, nodeFile, cacheDir, zxpSignCmd, p12, tsa, applet, run,
//         fetchFile, env, log }
// → { version, commit, helperHash, workDir, payloadDir, appPath, zipPath, zipBytes, zipSha256 }
export async function build(opts = {}) {
  const repo = path.resolve(opts.repo || path.join(INSTALLER_DIR, ".."));
  const run = opts.run || defaultRun;
  const log = opts.log || ((m) => process.stderr.write(m + "\n"));
  const env = opts.env || process.env;
  const fetchFile = opts.fetchFile || defaultFetch;
  const channel = opts.channel;
  if (channel !== "test") {
    throw new BuildError(channel === "release" ? "Release builds need the eval gate (T043); only --channel test exists yet." : "Use --channel test.");
  }
  const parts = loadParts(opts.partsFile || path.join(repo, "installer", "parts.json"));
  const nodeInfo = JSON.parse(fs.readFileSync(opts.nodeFile || path.join(repo, "installer", "node.json"), "utf8"));
  const version = parts.version;
  const git = (args) => must(run, "git", args, { cwd: repo, env }, `git ${args[0]}`);

  // 1. A clean commit (FR-025): no changes and no untracked files.
  const status = await git(["status", "--porcelain", "--untracked-files=normal"]);
  if (status.stdout.trim()) throw new BuildError("The repo has uncommitted changes or untracked files. Commit or remove them, then build again.");
  const commit = (await git(["rev-parse", "HEAD"])).stdout.trim();
  if (!/^[0-9a-f]{40,64}$/.test(commit)) throw new BuildError("Couldn't read the commit.");
  const tracked = (await git(["ls-files", "-z"])).stdout.split("\0").filter(Boolean);

  // 2. Stage per parts.json into a fresh folder.
  const outRoot = path.resolve(opts.out || path.join(BUILD_HOME, "out"));
  fs.mkdirSync(outRoot, { recursive: true });
  const workDir = fs.mkdtempSync(path.join(outRoot, `knack-${version}-${channel}-${commit.slice(0, 7)}-`));
  const payload = path.join(workDir, "payload");
  for (const f of plan(parts, tracked)) {
    const src = path.join(repo, f.src);
    const dest = path.join(payload, f.dest);
    const st = fs.lstatSync(src);
    if (st.isSymbolicLink()) throw new BuildError(`A shipped file is a link: ${f.src}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, st.mode & 0o111 ? 0o755 : 0o644);
  }
  log(`staged ${path.relative(outRoot, payload)}`);

  // 3. The helper's packages from its lockfile, production only, then pruned.
  const helperPart = parts.parts.find((p) => p.id === "helper");
  const stagedHelper = path.join(payload, helperPart.to);
  await must(run, "npm", ["ci", "--omit=dev", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: stagedHelper, env }, "npm ci in the staged helper");
  const pruned = pruneModules(path.join(stagedHelper, "node_modules"));
  log(`helper packages installed, ${pruned} type, map and doc files removed`);

  // 4. The private Node, both architectures, checked against node.json.
  const cacheDir = opts.cacheDir || path.join(BUILD_HOME, "cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const nodeOut = path.join(payload, "node");
  fs.mkdirSync(nodeOut, { recursive: true });
  const nodeShas = {};
  for (const arch of ["arm64", "x64"]) {
    const f = nodeInfo.files && nodeInfo.files[arch];
    if (!f || !/^[0-9a-f]{64}$/.test(f.sha256 || "") || !/^node-v[\d.]+-darwin-(arm64|x64)\.tar\.gz$/.test(f.name || "")) {
      throw new BuildError(`node.json has no valid ${arch} entry.`);
    }
    const tgz = path.join(cacheDir, f.name);
    if (!fs.existsSync(tgz) || sha256File(tgz) !== f.sha256) {
      const part = `${tgz}.part`;
      await fetchFile(new URL(f.name, nodeInfo.base_url).href, part);
      fs.renameSync(part, tgz);
    }
    const got = sha256File(tgz);
    if (got !== f.sha256) {
      fs.rmSync(tgz, { force: true });
      throw new BuildError(`The downloaded Node for ${arch} doesn't match node.json's hash. Nothing was built from it.`);
    }
    nodeShas[arch] = got;
    const prefix = f.name.replace(/\.tar\.gz$/, "");
    const tmp = fs.mkdtempSync(path.join(workDir, `node-${arch}-`));
    await must(run, "tar", ["-xzf", tgz, "-C", tmp, `${prefix}/bin/node`, `${prefix}/LICENSE`], { env }, `Unpacking Node for ${arch}`);
    await must(run, "ditto", ["-c", "-k", "--sequesterRsrc", path.join(tmp, prefix), path.join(nodeOut, `node-${arch}.zip`)], { env }, `Zipping Node for ${arch}`);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  log(`node ${nodeInfo.version} for arm64 and x64 checked`);

  // 5. One version in the staged manifests only.
  const exts = extensions(parts);
  for (const e of exts) {
    const m = path.join(payload, "cep", e.name, e.manifest);
    fs.writeFileSync(m, stampManifest(fs.readFileSync(m, "utf8"), version));
  }

  // 6. The staged helper's settings hash must equal the repo's (research R3).
  const settingsMod = await import(pathToFileURL(path.join(stagedHelper, "lib", "settings.mjs")).href + `?b=${Date.now()}`);
  const repoHelper = path.join(repo, helperPart.from);
  const repoHash = settingsMod.settingsHash(path.join(repoHelper, "settings.json"), repoHelper);
  const helperHash = settingsMod.settingsHash(path.join(stagedHelper, "settings.json"), stagedHelper);
  if (repoHash !== helperHash) throw new BuildError("The staged helper's settings hash doesn't match the repo's.");

  // 7. release.json, beside the payload and in the version folder.
  const release = {
    version,
    channel,
    commit,
    parts: Object.fromEntries(parts.parts.map((p) => [p.id, version])),
    node: { version: nodeInfo.version, arm64_sha256: nodeShas.arm64, x64_sha256: nodeShas.x64 },
    helper_hash: helperHash,
    evals: null,
  };
  const releaseText = JSON.stringify(release, null, 2) + "\n";
  fs.writeFileSync(path.join(payload, "release.json"), releaseText);
  fs.writeFileSync(path.join(payload, "version", "release.json"), releaseText);

  // 8. Sign both extensions; the payload holds the signed, unpacked folders.
  const zxp = opts.zxpSignCmd || path.join(BUILD_HOME, "ZXPSignCmd");
  const p12 = opts.p12 || path.join(BUILD_HOME, "knack.p12");
  for (const f of [zxp, p12]) if (!fs.existsSync(f)) throw new BuildError(`Missing ${path.basename(f)} in the build folder (T002).`);
  const pw = await run("/usr/bin/security", ["find-generic-password", "-s", SIGNING.service, "-a", SIGNING.account, "-w"], { env: { PATH: "/usr/bin:/bin" } });
  const password = (pw.stdout || "").replace(/\n$/, "");
  if (pw.code !== 0 || !password) throw new BuildError("Couldn't read the signing password from the Keychain.");
  const signedDir = path.join(workDir, "signed");
  fs.mkdirSync(signedDir);
  for (const e of exts) {
    const dir = path.join(payload, "cep", e.name);
    const out = path.join(signedDir, `${e.name}.zxp`);
    await must(run, zxp, ["-sign", dir, out, p12, password, "-tsa", opts.tsa || TSA_URL], { env }, `Signing ${e.name}`, password);
    fs.rmSync(dir, { recursive: true, force: true });
    await must(run, "ditto", ["-x", "-k", out, dir], { env }, `Unpacking signed ${e.name}`);
    if (!fs.existsSync(path.join(dir, "META-INF", "signatures.xml"))) throw new BuildError(`${e.name} has no signature after signing.`);
    await must(run, zxp, ["-verify", dir], { env }, `Verifying ${e.name}`);
  }
  log("both extensions signed and verified");

  // 9. The applet, with the payload in its Resources, re-signed ad hoc.
  const appPath = path.join(workDir, APP_NAME);
  await must(run, "osacompile", ["-o", appPath, opts.applet || path.join(repo, "installer", "applet", "installer.applescript")], { env }, "Compiling the applet");
  const plist = path.join(appPath, "Contents", "Info.plist");
  await must(run, "plutil", ["-replace", "CFBundleShortVersionString", "-string", version, plist], { env }, "Setting the applet's version");
  await must(run, "ditto", [payload, path.join(appPath, "Contents", "Resources", "payload")], { env }, "Adding the payload");
  await must(run, "codesign", ["--force", "--deep", "--sign", "-", appPath], { env }, "Signing the applet ad hoc");
  await must(run, "codesign", ["--verify", "--deep", "--strict", appPath], { env }, "Checking the applet's signature");

  // 10. One zip.
  const zipPath = path.join(workDir, `Knack-${version}-${channel}-${commit.slice(0, 7)}.zip`);
  await must(run, "ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath], { env }, "Zipping the applet");
  const zipBytes = fs.statSync(zipPath).size;
  const zipSha256 = sha256File(zipPath);
  return { version, channel, commit, helperHash, workDir, payloadDir: payload, appPath, zipPath, zipBytes, zipSha256 };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--channel" || a === "--out") o[a.slice(2)] = argv[++i];
    else throw new BuildError(`Unknown option ${a}. Use: node installer/build.mjs --channel test [--out <folder>]`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = await build(parseArgs(process.argv.slice(2)));
    const mb = (r.zipBytes / (1024 * 1024)).toFixed(1);
    console.log(`version     ${r.version} (${r.channel})`);
    console.log(`commit      ${r.commit}`);
    console.log(`helper hash ${r.helperHash}`);
    console.log(`zip         ${r.zipPath}`);
    console.log(`zip size    ${mb} MB (${r.zipBytes} bytes)`);
    console.log(`zip sha256  ${r.zipSha256}`);
    console.log(`payload     ${r.payloadDir}`);
  } catch (e) {
    console.error(e instanceof BuildError ? e.message : `Build failed: ${e && e.message}`);
    process.exit(1);
  }
}
