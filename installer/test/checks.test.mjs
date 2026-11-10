// installer/setup-check.mjs and lib/checks.mjs (T013): every line and state in
// contracts/setup-check.md, on a temp home with a fake bridge on a local port and a faked key check.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupCheck } from "../setup-check.mjs";
import { IDS, TEXT, SCRIPTING_SCRIPT, formatText } from "../lib/checks.mjs";
import { install } from "../install.mjs";
import { layout } from "../lib/layout.mjs";
import { tmpdir, write, makePayload, makeNodeDir, makeApps, makeRun, snapshot } from "./fixtures.mjs";

const INSTALLER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = "f".repeat(64);

// A stand-in for the bridge: checks the token and Host, answers /health and the one fixed /run.
async function fakeBridge(t, L, o = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, body });
      const send = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      if (o.hang) return;
      if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { ok: false, error: "bad token" });
      if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host)) return send(403, { ok: false });
      if (req.method === "GET" && req.url === "/health") return send(200, { ok: true, bridge: "1.1.0" });
      if (req.method === "POST" && req.url === "/run") {
        const b = JSON.parse(body);
        if (b.code !== SCRIPTING_SCRIPT) return send(200, { ok: false, error: "unexpected script" });
        return send(200, { ok: true, result: o.pref || { have: true, value: 1 }, logs: [] });
      }
      send(404, { ok: false });
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => server.close());
  write(path.dirname(L.bridgeConfig), "bridge.json", JSON.stringify({ token: o.wrongToken ? "0".repeat(64) : TOKEN, port: server.address().port }));
  return seen;
}

async function setup(t, o = {}) {
  const sandbox = tmpdir(t, "knack-check-");
  const home = path.join(sandbox, "home");
  fs.mkdirSync(home);
  const L = layout(home);
  // Installed with a supported AE; checked against o.ae (so an old AE can be checked at all).
  const installApps = makeApps(t, ["26.5"]);
  const apps = o.ae ? makeApps(t, o.ae) : installApps;
  const state = { macos: "27.0.1", aeOpen: false };
  const run = makeRun(state);
  if (!o.notInstalled) {
    const r = await install({ home, payloadDir: makePayload(t), nodeDir: makeNodeDir(t), run, dirs: [installApps] });
    assert.equal(r.ok, true);
  }
  state.aeOpen = o.aeOpen !== false;
  state.macos = o.macos || "27.0.1";
  if (o.stamp !== false) write(L.learner, "panel-loaded.json", JSON.stringify({ version: o.stamp || "0.1.0", at: "2026-11-09T12:00:00.000Z" }));
  const seen = o.noBridge ? [] : await fakeBridge(t, L, o);
  const keyCheck = o.keyCheck || (async () => o.key || "works");
  const check = (extra = {}) => setupCheck({ home, run, dirs: [apps], keyCheck, json: true, ...extra });
  return { sandbox, home, L, run, apps, seen, check, state };
}

const byId = (result) => Object.fromEntries(result.checks.map((c) => [c.id, c]));

test("everything working: twelve lines in order, exit 0, the result saved without paths or secrets", async (t) => {
  const s = await setup(t);
  const r = await s.check();
  assert.equal(r.code, 0);
  assert.equal(r.result.all_working, true, formatText(r.result));
  assert.deepEqual(r.result.checks.map((c) => c.id), IDS);
  for (const c of r.result.checks) {
    assert.equal(c.state, "working", c.id);
    assert.equal(c.fix, null);
    assert.ok(c.part && c.text);
  }
  assert.deepEqual(Object.keys(r.result), ["version", "channel", "commit", "macos", "arch", "ae_versions", "all_working", "checks"]);
  assert.equal(r.result.version, "0.1.0");
  assert.equal(r.result.channel, "test");
  assert.equal(r.result.commit, "aaaaaaa");
  assert.deepEqual(r.result.ae_versions, ["26.5"]);
  assert.equal(byId(r.result).ae_version.text, "Found After Effects 26.5.");

  const saved = fs.readFileSync(s.L.lastCheck, "utf8");
  assert.deepEqual(JSON.parse(saved), r.result);
  assert.ok(!saved.includes(s.home) && !saved.includes("/Users/") && !saved.includes(TOKEN));
  assert.ok(!r.out.includes(TOKEN));
  // The fixed script went once, and asked for the T004 section.
  const runs = s.seen.filter((x) => x.url === "/run");
  assert.equal(runs.length, 1);
  assert.match(JSON.parse(runs[0].body).code, /"Main Pref Section v2"/);
  assert.match(JSON.parse(runs[0].body).code, /havePref/);
});

test("the scripting check never writes a file to test, and asks havePref first", () => {
  assert.doesNotMatch(SCRIPTING_SCRIPT, /File\(|\.write|\.open\(|Folder\(|system\.callSystem|setPref/);
  assert.match(SCRIPTING_SCRIPT, /have \? app\.preferences\.getPrefAsLong/);
});

test("AE closed: the AE lines say to open it, the rest still run, nothing is sent to the bridge", async (t) => {
  const s = await setup(t, { aeOpen: false, stamp: false });
  const r = await s.check();
  const l = byId(r.result);
  for (const id of ["bridge_answers", "ae_scripting", "cep_can_load", "panel_loads"]) {
    assert.equal(l[id].state, "needs_ae", id);
    assert.equal(l[id].text, TEXT.needs_ae);
  }
  for (const id of ["macos", "ae_version", "ext_bridge", "ext_panel", "key", "record_folder", "record_read", "versions_match"]) {
    assert.equal(l[id].state, "working", id);
  }
  assert.equal(s.seen.length, 0);
  assert.equal(r.code, 1);
});

test("AE closed with this version's stamp: the panel line already counts as working", async (t) => {
  const s = await setup(t, { aeOpen: false });
  assert.equal(byId((await s.check()).result).panel_loads.state, "working");
});

test("the scripting setting: off, on, or unreadable in this AE", async (t) => {
  const off = byId((await (await setup(t, { pref: { have: true, value: 0 } })).check()).result).ae_scripting;
  assert.equal(off.state, "not_working");
  assert.match(off.fix, /Allow Scripts to Write Files and Access Network/);
  const unread = byId((await (await setup(t, { pref: { have: false, value: 1 } })).check()).result).ae_scripting;
  assert.equal(unread.state, "not_checked", "a number under the wrong section isn't proof (T004)");
});

test("the bridge doesn't answer while AE is open", async (t) => {
  for (const o of [{ noBridge: true }, { wrongToken: true }]) {
    const l = byId((await (await setup(t, o)).check()).result);
    assert.equal(l.bridge_answers.state, "not_working");
    assert.equal(l.ae_scripting.state, "not_checked");
    assert.equal(l.cep_can_load.state, "working", "AE 26 still loads CEP, so the cause is elsewhere");
  }
  const l = byId((await (await setup(t, { noBridge: true, ae: ["29.0"] })).check()).result);
  assert.equal(l.cep_can_load.state, "not_working");
});

test("each key status maps to its line", async (t) => {
  const want = { works: "working", rejected: "not_working", out_of_credit: "not_working", offline: "not_checked", no_key: "not_working", unknown: "not_checked" };
  for (const [key, state] of Object.entries(want)) {
    const k = byId((await (await setup(t, { key })).check()).result).key;
    assert.equal(k.state, state, key);
    if (key === "offline") assert.match(k.text, /not yet checked/);
    if (key === "out_of_credit") assert.match(k.text, /works, but/);
  }
});

test("the learner home: missing, unreadable record kept as it is, no record yet", async (t) => {
  const s = await setup(t);
  write(s.L.learner, "learner.json", "{broken");
  const before = snapshot(s.L.learner);
  const l = byId((await s.check()).result);
  assert.equal(l.record_read.state, "not_working");
  assert.equal(l.record_folder.state, "working");
  assert.deepEqual(snapshot(s.L.learner), before, "nothing in the learner home changed, the test file is gone");
  fs.rmSync(s.L.learnerFile);
  assert.equal(byId((await s.check()).result).record_read.text, TEXT.record_read.none);
  fs.rmSync(s.L.learner, { recursive: true });
  assert.equal(byId((await s.check()).result).record_folder.state, "not_working");
});

test("versions: mixed parts, an old panel still open, and not installed", async (t) => {
  const s = await setup(t);
  const m = path.join(s.L.cep, "AEMentorPanel", "CSXS", "manifest.xml");
  fs.writeFileSync(m, fs.readFileSync(m, "utf8").replace('ExtensionBundleVersion="0.1.0"', 'ExtensionBundleVersion="0.0.9"'));
  assert.equal(byId((await s.check()).result).versions_match.text, TEXT.versions_match.mixed.text);

  const s2 = await setup(t, { stamp: "0.0.9" });
  const l2 = byId((await s2.check()).result);
  assert.equal(l2.versions_match.text, TEXT.versions_match.stale_panel.text);
  assert.equal(l2.panel_loads.state, "not_working");
  s2.state.aeOpen = false;
  assert.equal(byId((await s2.check()).result).versions_match.state, "working", "an old stamp doesn't count while AE is closed");

  const s3 = await setup(t, { notInstalled: true, noBridge: true, stamp: false });
  const r3 = await s3.check();
  const l3 = byId(r3.result);
  assert.equal(l3.versions_match.state, "not_working");
  assert.equal(l3.ext_panel.state, "not_working");
  assert.equal(r3.result.version, null);
  assert.ok(!fs.existsSync(s3.L.knack), "no folder made on a Mac without Knack");
});

test("unsupported macOS and After Effects are named", async (t) => {
  const l = byId((await (await setup(t, { macos: "25.6", ae: ["26.2", "25.6"] })).check()).result);
  assert.equal(l.macos.state, "not_working");
  assert.equal(l.ae_version.state, "not_working");
  assert.equal(l.ae_version.text, "After Effects 25.6 and 26.2 is older than Knack supports.");
  const l2 = byId((await (await setup(t, { ae: ["26.5", "27.0"] })).check()).result);
  assert.equal(l2.ae_version.text, "Found After Effects 26.5 and 27.0.");
});

test("a hung key check or bridge can't hold it past its budget (15 s rule)", async (t) => {
  const s = await setup(t, { hang: true, keyCheck: () => new Promise(() => {}) });
  const t0 = Date.now();
  const r = await s.check({ budgetMs: 1200, bridgeTimeoutMs: 5000 });
  assert.ok(Date.now() - t0 < 2500, `took ${Date.now() - t0} ms`);
  const l = byId(r.result);
  assert.equal(l.key.state, "not_checked");
  assert.equal(l.bridge_answers.state, "not_working");
});

// FR-022: one or two plain sentences, no paths, field names, error codes or commands.
const PLAIN = [
  [/\//, "a path"],
  [/[`$<>{}[\]]/, "code characters"],
  [/\b[a-z]+_[a-z0-9_]+\b/i, "a field name"],
  [/\b[a-z]+[A-Z][a-zA-Z]*\b/, "a camelCase name"],
  [/\b[a-z]+\.[a-z]+\b/i, "a dotted name"],
  [/\b[A-Z]{3,}\b/, "an error code"],
  [/\b(4\d\d|5\d\d)\b/, "a status code"],
  [/\b(npm|node|bash|sudo|defaults|curl|Terminal|PlayerDebugMode|CEP|JSON|ExtendScript|Keychain)\b/, "a command or jargon"],
];
function allTexts() {
  const out = [];
  const walk = (v) => {
    if (typeof v === "string") out.push(v);
    else if (typeof v === "function") {
      const r = v.length ? v(["26.5", "27.0"]) : v();
      walk(typeof r === "object" ? r : r);
    } else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(TEXT);
  out.push(TEXT.macos.working("27.0.1"), TEXT.versions_match.working("0.1.0"));
  return out.filter((s) => s && !["working", "not_working", "needs_ae", "not_checked"].includes(s));
}

test("every line's text and fix are plain (FR-022)", () => {
  const texts = allTexts();
  assert.ok(texts.length > 40);
  for (const s of texts) {
    const bare = s.replace(/Window > Extensions > Knack|After Effects > Settings > Scripting & Expressions/g, "the menu").replace(/\bmacOS\b/g, "Mac");
    for (const [re, what] of PLAIN) assert.doesNotMatch(bare, re, `${what} in: ${s}`);
    assert.ok(s.split(/(?<=[.!?])\s+/).filter(Boolean).length <= 2, `more than two sentences: ${s}`);
  }
});

test("the plain-text check itself catches what it should", () => {
  const bad = ["Run `bash panel/install.sh`.", "Set runtime_path in panel.json.", "Error ECONNREFUSED.", "Got 401 from the service.", "Open Terminal.", "nodePath is wrong."];
  for (const s of bad) assert.ok(PLAIN.some(([re]) => re.test(s)), s);
});

test("text output: a version line, one line per check, and a closing line", async (t) => {
  const s = await setup(t, { key: "rejected" });
  const r = await s.check({ json: false });
  const lines = r.out.split("\n");
  assert.equal(lines[0], "Knack 0.1.0 (test build)");
  assert.ok(lines.includes(`Not working: ${TEXT.key.rejected.text} ${TEXT.key.rejected.fix}`));
  assert.equal(lines[lines.length - 1], "Fix the lines above, then check again.");
  assert.equal(lines.filter((x) => /^(Working|Not working|Needs After Effects|Not checked yet): /.test(x)).length, 12);
});

test("as a program on a Mac without Knack: exit 1, valid JSON, nothing created", (t) => {
  const home = tmpdir(t, "knack-cli-home-");
  const p = spawnSync(process.execPath, [path.join(INSTALLER, "setup-check.mjs"), "--json"], { env: { PATH: "/usr/bin:/bin", HOME: home }, encoding: "utf8", timeout: 20000 });
  assert.equal(p.status, 1);
  const r = JSON.parse(p.stdout);
  assert.equal(r.all_working, false);
  assert.deepEqual(r.checks.map((c) => c.id), IDS);
  assert.ok(!fs.existsSync(path.join(home, "Library", "Application Support", "Knack")));
  assert.ok(!p.stdout.includes(home));
  assert.ok(execFileSync);
});

// T022: no internet and AE closed (US2 scenario 2, edge case "No internet during install").
test("no internet with AE closed: AE lines wait for AE, the key is not yet checked, nothing reads as broken", async (t) => {
  const s = await setup(t, { aeOpen: false, stamp: false, key: "offline" });
  const r = await s.check();
  const l = byId(r.result);
  for (const id of ["bridge_answers", "ae_scripting", "cep_can_load", "panel_loads"]) assert.equal(l[id].state, "needs_ae", id);
  assert.equal(l.key.state, "not_checked");
  assert.equal(l.key.text, TEXT.key.offline.text);
  assert.equal(l.key.fix, TEXT.key.offline.fix);
  for (const id of ["macos", "ae_version", "ext_bridge", "ext_panel", "record_folder", "record_read", "versions_match"]) assert.equal(l[id].state, "working", id);
  assert.ok(!r.result.checks.some((c) => c.state === "not_working"), "offline and closed are not faults");
  assert.equal(r.result.all_working, false);
  assert.equal(r.code, 1);
  const text = formatText(r.result).split("\n");
  assert.equal(text[text.length - 1], TEXT.tail.open_ae);
});

test("a key check with no answer in time reads as not yet checked, with the connection as the fix", async (t) => {
  const s = await setup(t, { keyCheck: () => new Promise(() => {}) });
  const k = byId((await s.check({ budgetMs: 1200 })).result).key;
  assert.equal(k.state, "not_checked");
  assert.equal(k.text, TEXT.key.timeout.text);
  assert.match(k.fix, /internet connection/);
});

test("the closing line matches the worst state: broken, then needs AE, then not yet checked", () => {
  const mk = (...states) => ({ version: "0.1.0", channel: "release", all_working: states.every((x) => x === "working"), checks: states.map((state, i) => ({ id: IDS[i], state, text: "T.", fix: state === "working" ? null : "F." })) });
  const last = (r) => formatText(r).split("\n").pop();
  assert.equal(last(mk("working", "working")), TEXT.tail.done);
  assert.equal(last(mk("working", "not_checked", "needs_ae", "not_working")), TEXT.tail.fix);
  assert.equal(last(mk("working", "not_checked", "needs_ae")), TEXT.tail.open_ae);
  assert.equal(last(mk("working", "not_checked")), TEXT.tail.later);
});
