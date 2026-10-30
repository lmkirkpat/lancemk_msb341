import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequestLog, redactBody } from "../lib/request-log.mjs";

const KEY = "sk-ant-api03-LOGKEY_abcdefghijk";
const IMG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const body = () => ({
  model: "claude-opus-5-5",
  system: [{ type: "text", text: "preamble" }],
  messages: [
    { role: "user", content: [{ type: "text", text: "/ease-mentor" }] },
    {
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "t1", content: [{ type: "image", source: { type: "base64", media_type: "image/png", data: IMG } }, { type: "text", text: "{}" }] }],
    },
  ],
});

test("one JSON line per request, image data replaced by its length, the original untouched", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reqlog-"));
  const file = path.join(dir, "requests.jsonl");
  const log = createRequestLog(file, KEY);
  const b = body();
  log.append(b, { turn: 1, step: 1 });
  log.append(b, { turn: 1, step: 2 });
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.deepEqual([lines[0].turn, lines[0].step, lines[1].step], [1, 1, 2]);
  const src = lines[0].body.messages[1].content[0].content[0].source;
  assert.deepEqual(src, { type: "base64", media_type: "image/png", data_length: IMG.length });
  assert.equal(b.messages[1].content[0].content[0].source.data, IMG, "the body sent is not changed");
  assert.equal((fs.statSync(file).mode & 0o777).toString(8), "600");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("key-shaped text never reaches the log", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reqlog-"));
  const file = path.join(dir, "r.jsonl");
  const b = body();
  b.messages[0].content[0].text = `my key is ${KEY}`;
  createRequestLog(file, KEY).append(b);
  assert.doesNotMatch(fs.readFileSync(file, "utf8"), /LOGKEY/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("no path, no log; an unwritable path never throws", () => {
  const off = createRequestLog(null);
  assert.equal(off.enabled, false);
  off.append(body());
  createRequestLog("/nonexistent-dir/x/requests.jsonl").append(body());
  assert.deepEqual(redactBody({ a: { type: "base64", data: "abc" } }), { a: { type: "base64", data_length: 3 } });
});
