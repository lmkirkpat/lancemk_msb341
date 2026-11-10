import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countIn, scanKey, parsePs } from "../key-scan.mjs";

const SCAN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "key-scan.mjs");
// Built from parts so this file holds no key-shaped string.
const KEY = ["sk", "ant", "api03"].join("-") + "-FAKEFAKEFAKE_test_0123456789";

function tmp() {
  return mkdtempSync(path.join(tmpdir(), "keyscan-"));
}
function put(root, files) {
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
}

test("countIn counts non-overlapping occurrences in text and binary", () => {
  assert.equal(countIn(Buffer.from("a" + KEY + "b" + KEY), KEY), 2);
  assert.equal(countIn(Buffer.concat([Buffer.from([0, 255, 1]), Buffer.from(KEY), Buffer.from([0])]), KEY), 1);
  assert.equal(countIn(Buffer.from("nothing here"), KEY), 0);
});

test("clean places report 0 everywhere", async () => {
  const home = tmp(), res = tmp(), rep = path.join(tmp(), "report.txt");
  put(home, { "learner.json": "{}", "panel-conversation.json": '{"v":2}', "frames/a.png": Buffer.from([137, 80, 78, 71]) });
  put(res, { "r.json": "{}" });
  writeFileSync(rep, "ok");
  const r = await scanKey({ key: KEY, learnerHome: home, resultsDirs: [res], report: rep, psText: "" });
  assert.equal(r.total, 0);
  assert.equal(r.places.find((p) => p.place === "learner home").files, 2 + 1);
  rmSync(home, { recursive: true }); rmSync(res, { recursive: true });
});

test("finds the key in the learner home incl. conversation file, nested, and in a binary frame", async () => {
  const home = tmp();
  put(home, {
    "panel-conversation.json": `{"x":"${KEY}"}`,
    "deep/er/log.txt": `a ${KEY} b ${KEY}`,
    "frames/f.png": Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(KEY)]),
    "clean.json": "{}",
  });
  const r = await scanKey({ key: KEY, learnerHome: home, psText: "" });
  const p = r.places.find((x) => x.place === "learner home");
  assert.equal(p.occurrences, 4);
  assert.equal(p.filesWithKey, 3);
  assert.equal(r.total, 4);
  rmSync(home, { recursive: true });
});

test("results folders and the report are scanned and counted separately", async () => {
  const a = tmp(), b = tmp(), rep = path.join(tmp(), "rep.txt");
  put(a, { "x.json": KEY });
  put(b, { "sub/y.txt": "clean" });
  writeFileSync(rep, KEY + KEY + KEY);
  const r = await scanKey({ key: KEY, resultsDirs: [a, b], report: rep, psText: "" });
  assert.deepEqual(r.places.filter((p) => p.place !== "process environments").map((p) => [p.place, p.occurrences]), [["results 1", 1], ["results 2", 0], ["report", 3]]);
  assert.equal(r.total, 4);
});

test("a missing place is reported as missing, not as clean", async () => {
  const r = await scanKey({ key: KEY, learnerHome: "/nonexistent-keyscan-dir", psText: "" });
  assert.equal(r.places[0].missing, true);
  assert.equal(r.ok, false);
});

test("parsePs keeps only node processes for the helper or the mentor server", () => {
  const ps = [
    `101 /usr/bin/node /x/panel/helper/main.mjs HOME=/h KEY=${KEY}`,
    `102 node /x/mentor/server.mjs PATH=/usr/bin AE_MENTOR_HOME=/t`,
    `103 node /x/product/evals/easing/run.mjs ANTHROPIC=${KEY}`,
    `104 /bin/zsh -l HOME=/h`,
    `105 vim panel/helper/main.mjs ${KEY}`,
  ].join("\n");
  const procs = parsePs(ps);
  assert.deepEqual(procs.map((p) => p.pid), [101, 102]);
});

test("process environments: counts the key in matching processes only, and never prints it", async () => {
  const ps = `101 node /x/panel/helper/main.mjs KEY=${KEY}\n102 node /x/mentor/server.mjs A=b\n103 node /x/run.mjs K=${KEY}`;
  const r = await scanKey({ key: KEY, psText: ps });
  const p = r.places.find((x) => x.place === "process environments");
  assert.equal(p.processes, 2);
  assert.equal(p.occurrences, 1);
  assert.ok(!JSON.stringify(r).includes(KEY));
});

test("zero matching processes is reported as such", async () => {
  const r = await scanKey({ key: KEY, psText: "103 node /x/run.mjs K=1" });
  const p = r.places.find((x) => x.place === "process environments");
  assert.equal(p.processes, 0);
  assert.equal(p.occurrences, 0);
});

test("rejects a missing or too-short key", async () => {
  await assert.rejects(scanKey({ key: "", psText: "" }), /KNACK_EVAL_API_KEY/);
  await assert.rejects(scanKey({ key: "abc", psText: "" }), /too short/);
});

test("CLI: reads the key from the environment, prints counts only, exit 1 on a hit", () => {
  const home = tmp();
  put(home, { "panel-conversation.json": KEY });
  const r = spawnSync("node", [SCAN, "--home", home, "--no-processes"], { encoding: "utf8", env: { ...process.env, KNACK_EVAL_API_KEY: KEY } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /learner home\s+1 file scanned, 1 occurrence/);
  assert.ok(!r.stdout.includes(KEY) && !r.stderr.includes(KEY));
  rmSync(home, { recursive: true });
});

test("CLI: clean exits 0; no key in env exits 2", () => {
  const home = tmp();
  put(home, { "a.json": "{}" });
  const ok = spawnSync("node", [SCAN, "--home", home, "--no-processes"], { encoding: "utf8", env: { ...process.env, KNACK_EVAL_API_KEY: KEY } });
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /0 occurrences everywhere/);
  const env = { ...process.env };
  delete env.KNACK_EVAL_API_KEY;
  const bad = spawnSync("node", [SCAN, "--home", home, "--no-processes"], { encoding: "utf8", env });
  assert.equal(bad.status, 2);
  rmSync(home, { recursive: true });
});

test("live ps: finds a real child process whose environment holds the key", async () => {
  const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)", "x/mentor/server.mjs"], {
    env: { ...process.env, FAKE_HELD: KEY },
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 500));
  try {
    const r = spawnSync("node", [SCAN, "--processes"], { encoding: "utf8", env: { ...process.env, KNACK_EVAL_API_KEY: KEY } });
    assert.ok(!r.stdout.includes(KEY));
    assert.match(r.stdout, /process environments\s+\d+ processes?, 1 occurrence/);
    assert.equal(r.status, 1);
  } finally {
    child.kill();
  }
});
