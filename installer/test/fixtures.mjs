// Shared test fixtures: a temp home, a fake payload, a fake private Node, AE apps with real
// Info.plist files, and a runner that fakes sw_vers and pgrep and records every call.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run as realRun } from "../lib/run.mjs";
import { TOOLS } from "../lib/ae.mjs";

export function write(root, rel, text, mode) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  if (mode) fs.chmodSync(p, mode);
  return p;
}

export function tmpdir(t, prefix = "knack-test-") {
  const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  if (t) t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

export const manifest = (id, v) =>
  `<?xml version="1.0"?>\n<ExtensionManifest Version="7.0" ExtensionBundleId="${id}" ExtensionBundleVersion="${v}">\n  <ExtensionList><Extension Id="${id}.a" Version="${v}" /></ExtensionList>\n</ExtensionManifest>\n`;

// opts: { version, helperMain (fake helper source) }
export function makePayload(t, opts = {}) {
  const v = opts.version || "0.1.0";
  const p = tmpdir(t, "knack-payload-");
  const rel = JSON.stringify({ version: v, channel: "test", commit: "a".repeat(40), parts: {}, node: {}, helper_hash: "h", evals: null }, null, 2);
  write(p, "release.json", rel);
  write(p, "version/release.json", rel);
  write(p, "version/.mcp.json", '{"mcpServers":{"ae-mentor":{"command":"node","args":["mentor/server.mjs"]}}}');
  write(p, "version/mentor/server.mjs", `// mentor ${v}\n`);
  write(p, "version/bridge/paths.mjs", "export {};\n");
  write(p, "version/.claude/skills/ease-mentor/SKILL.md", "ease");
  write(p, "version/panel/helper/main.mjs", opts.helperMain || "// helper\n");
  write(p, "version/setup/setup-check.mjs", "// check\n");
  write(p, "cep/AEMentorBridge/CSXS/manifest.xml", manifest("com.aementor.bridge", v));
  write(p, "cep/AEMentorBridge/host.js", "// host\n");
  write(p, "cep/AEMentorBridge/META-INF/signatures.xml", "<sig/>");
  write(p, "cep/AEMentorPanel/CSXS/manifest.xml", manifest("com.aementor.panel", v));
  write(p, "cep/AEMentorPanel/main.js", "// panel\n");
  write(p, "cep/AEMentorPanel/META-INF/signatures.xml", "<sig/>");
  return p;
}

// A stand-in for the extracted private Node: bin/node runs the real Node, so a fake helper works.
export function makeNodeDir(t) {
  const d = tmpdir(t, "knack-nodedir-");
  write(d, "bin/node", `#!/bin/sh\nexec "${process.execPath}" "$@"\n`, 0o755);
  write(d, "LICENSE", "MIT");
  return d;
}

const PLIST = (v) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>CFBundleShortVersionString</key><string>${v}</string></dict></plist>
`;

// AE apps under a fake /Applications. versions: ["26.5", ...] (year is derived for the folder).
export function makeApps(t, versions = ["26.5"]) {
  const d = tmpdir(t, "knack-apps-");
  for (const v of versions) {
    const year = 2000 + Number(v.split(".")[0]);
    write(d, `Adobe After Effects ${year}/Adobe After Effects ${year}.app/Contents/Info.plist`, PLIST(v));
    // Every real AE folder also holds a Render Engine app with the same version; it isn't an install.
    write(d, `Adobe After Effects ${year}/Adobe After Effects Render Engine ${year}.app/Contents/Info.plist`, PLIST(v));
  }
  return d;
}

// A recording runner: sw_vers, pgrep, ps and profiles are faked; everything else runs for real.
// state: { macos, aeOpen, aeApps (paths of the running .app, for pgrep -lf), aeUptime (seconds),
// managed } (changeable during a test).
export function makeRun(state = {}) {
  const calls = [];
  const fn = async (cmd, args = [], opts = {}) => {
    calls.push({ cmd, args: [...args], env: opts.env ? { ...opts.env } : undefined, input: opts.input, cwd: opts.cwd });
    if (state.fake && state.fake[cmd]) return state.fake[cmd](args, opts);
    if (cmd === TOOLS.sw_vers) return { code: 0, stdout: (state.macos || "27.0.1") + "\n", stderr: "" };
    if (cmd === TOOLS.pgrep) {
      if (!state.aeOpen) return { code: 1, stdout: "", stderr: "" };
      if (args[0] !== "-lf") return { code: 0, stdout: "123\n", stderr: "" };
      const apps = state.aeApps || [];
      const lines = apps.map((a, i) => `${200 + i} ${a}/Contents/MacOS/After Effects`);
      for (const a of apps) lines.push(`${300} ${a}/Contents/MacOS/crashpad_handler --database=/Users/someone/x`);
      return { code: 0, stdout: (lines.length ? lines.join("\n") : "123") + "\n", stderr: "" };
    }
    if (cmd === TOOLS.ps) {
      const s = state.aeUptime === undefined ? 600 : state.aeUptime;
      const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      const hh = Math.floor(s / 3600);
      return { code: 0, stdout: `${hh ? `${String(hh).padStart(2, "0")}:` : ""}${mm}:${ss}\n`, stderr: "" };
    }
    if (cmd === TOOLS.profiles) {
      return { code: 0, stdout: `Enrolled via DEP: No\nMDM enrollment: ${state.managed ? "Yes (User Approved)" : "No"}\n`, stderr: "" };
    }
    if (cmd === TOOLS.pbcopy) {
      state.clipboard = opts.input;
      return { code: 0, stdout: "", stderr: "" };
    }
    return realRun(cmd, args, opts);
  };
  fn.calls = calls;
  return fn;
}

// Every file under dir → { rel: sha256 | "link:<target>" | "dir" }.
export function snapshot(dir) {
  const out = {};
  const walk = (d, rel) => {
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) out[r] = `link:${fs.readlinkSync(p)}`;
      else if (e.isDirectory()) {
        out[r] = "dir";
        walk(p, r);
      } else out[r] = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    }
  };
  walk(dir, "");
  return out;
}
