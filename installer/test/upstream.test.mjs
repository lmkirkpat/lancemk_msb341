// T038: the upstream Claude Bridge (spec 002 research R1, bridge/UPSTREAM.md) keeps working before and
// after install: its extension, its config folder and its port are never touched, a link to it isn't
// taken for a developer install, and the fork Knack ships keeps its own identity so both load side
// by side. Debug mode, which upstream's own install sets, is never written.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { install } from "../install.mjs";
import { setupCheck } from "../setup-check.mjs";
import { layout } from "../lib/layout.mjs";
import { tmpdir, write, makePayload, makeNodeDir, makeApps, makeRun, snapshot } from "./fixtures.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const UPSTREAM = Object.freeze({ id: "com.bitloop.claudebridge", folder: "ClaudeBridge", config: "ClaudeAEBridge", port: 47670, global: "__claudeAE" });

// An upstream install: its extension (a link into its own clone, as its install.sh makes, or a real
// folder) and its config folder with a token.
function withUpstream(t, asLink) {
  const sandbox = tmpdir(t, "knack-upstream-");
  const home = path.join(sandbox, "home");
  fs.mkdirSync(home);
  const L = layout(home);
  const clone = path.join(sandbox, "after-effects-mcp");
  write(clone, "cep/CSXS/manifest.xml", `<ExtensionManifest ExtensionBundleId="${UPSTREAM.id}" ExtensionBundleVersion="1.1.0"/>`);
  write(clone, "cep/host.js", "// upstream host\n");
  const ext = path.join(L.cep, UPSTREAM.folder);
  fs.mkdirSync(L.cep, { recursive: true });
  if (asLink) fs.symlinkSync(path.join(clone, "cep"), ext);
  else fs.cpSync(path.join(clone, "cep"), ext, { recursive: true });
  write(path.join(L.support, UPSTREAM.config), "bridge.json", JSON.stringify({ token: "u".repeat(64), port: UPSTREAM.port }));
  const state = { macos: "27.0.1", aeOpen: false };
  const run = makeRun(state);
  const apps = makeApps(t, ["26.5"]);
  const opts = { home, payloadDir: makePayload(t), nodeDir: makeNodeDir(t), run, dirs: [apps] };
  const theirs = () => ({ ext: snapshot(ext), link: asLink ? fs.readlinkSync(ext) : null, config: snapshot(path.join(L.support, UPSTREAM.config)), clone: snapshot(clone) });
  return { L, home, run, state, apps, opts, theirs };
}

for (const asLink of [true, false]) {
  test(`upstream installed (${asLink ? "linked" : "a real folder"}): install, re-install, update and a setup check leave it as it was`, async (t) => {
    const s = withUpstream(t, asLink);
    const before = s.theirs();
    assert.equal((await install(s.opts)).ok, true, "an upstream link isn't a developer install");
    assert.deepEqual(s.theirs(), before);
    assert.equal((await install(s.opts)).ok, true);
    assert.equal((await install({ ...s.opts, payloadDir: makePayload(t, { version: "0.2.0" }) })).ok, true);
    s.state.aeOpen = true;
    await setupCheck({ home: s.home, run: s.run, dirs: [s.apps], keyCheck: async () => "works", json: true, budgetMs: 3000 });
    assert.deepEqual(s.theirs(), before, "nothing of upstream's changed");
    assert.ok(fs.existsSync(path.join(s.L.cep, "AEMentorBridge")), "both bridges are in place");
    assert.ok(!s.run.calls.some((c) => /defaults|killall|launchctl/.test(c.cmd)), "debug mode and processes untouched");
    for (const f of [s.L.state]) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /ClaudeBridge|ClaudeAEBridge/, "not in Knack's inventory, so uninstall can't remove it");
  });
}

test("the setup check talks only to Knack's bridge, never to upstream's port or token", async (t) => {
  const s = withUpstream(t, true);
  assert.equal((await install(s.opts)).ok, true);
  // Upstream answering on its own port: the check must not ask it anything.
  const hits = [];
  const up = http.createServer((req, res) => (hits.push(req.url), res.end("{}")));
  await new Promise((r) => up.listen(0, "127.0.0.1", r));
  t.after(() => up.close());
  write(path.join(s.L.support, UPSTREAM.config), "bridge.json", JSON.stringify({ token: "u".repeat(64), port: up.address().port }));
  s.state.aeOpen = true;
  const r = await setupCheck({ home: s.home, run: s.run, dirs: [s.apps], keyCheck: async () => "works", json: true, budgetMs: 3000, bridgeTimeoutMs: 500 });
  assert.deepEqual(hits, []);
  assert.equal(r.result.checks.find((c) => c.id === "bridge_answers").state, "not_working", "Knack's own bridge isn't running here");
});

test("the bridge Knack ships keeps its own identity, port, config folder and script global (bridge/UPSTREAM.md)", () => {
  const manifest = fs.readFileSync(path.join(REPO, "bridge", "cep", "CSXS", "manifest.xml"), "utf8");
  assert.match(manifest, /ExtensionBundleId="com\.aementor\.bridge"/);
  assert.ok(!manifest.includes(UPSTREAM.id));
  const host = fs.readFileSync(path.join(REPO, "bridge", "cep", "host.js"), "utf8");
  const port = Number(/DEFAULT_PORT = (\d+)/.exec(host)[1]);
  assert.notEqual(port, UPSTREAM.port);
  assert.match(host, /"AEMentorBridge"/);
  assert.ok(!host.includes(`"${UPSTREAM.config}"`));
  const jsx = fs.readdirSync(path.join(REPO, "bridge", "cep", "jsx")).map((f) => fs.readFileSync(path.join(REPO, "bridge", "cep", "jsx", f), "utf8")).join("\n");
  assert.match(jsx, /\$\.global\.__aeMentorBridge\b/);
  assert.ok(!new RegExp(`\\$\\.global\\.${UPSTREAM.global}\\b`).test(jsx), "a shared ExtendScript global would break upstream");
  // And the install places only Knack's two folders.
  const parts = JSON.parse(fs.readFileSync(path.join(REPO, "installer", "parts.json"), "utf8"));
  assert.doesNotMatch(JSON.stringify(parts), /ClaudeBridge|ClaudeAEBridge|bitloop/);
});
