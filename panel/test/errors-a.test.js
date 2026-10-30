// Option A's error messages in the panel (spec 013 T019, FR-027).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { MESSAGES_A, NOT_SHOWN, messageForA } = require("../lib/errors-a.js");

const CONTRACT_KINDS = ["not_signed_in", "out_of_credit", "rate_limited", "service_busy", "offline", "refused", "timeout", "start_failed", "process_exited"];

test("every shown kind in the contract has its message, word for word the helper's", async () => {
  const { MESSAGES } = await import(pathToFileURL(path.join(__dirname, "..", "helper", "lib", "errors.mjs")).href);
  assert.deepEqual(Object.keys(MESSAGES_A).sort(), CONTRACT_KINDS.slice().sort());
  for (const k of CONTRACT_KINDS) assert.equal(MESSAGES_A[k], MESSAGES[k], k);
});

test("the messages match the contract's table", () => {
  const contract = fs.readFileSync(path.join(__dirname, "..", "..", "specs", "013-api-runtime", "contracts", "helper-protocol.md"), "utf8");
  for (const k of CONTRACT_KINDS) assert.ok(contract.includes(`"${MESSAGES_A[k]}"`), `${k}'s text isn't in the contract`);
});

test("busy, bad_command and not_implemented are never shown", () => {
  assert.deepEqual(NOT_SHOWN.slice().sort(), ["bad_command", "busy", "not_implemented"]);
  for (const k of NOT_SHOWN) assert.equal(messageForA(k), null);
});

test("an unknown kind shows start_failed's text, never the kind itself", () => {
  assert.equal(messageForA("something_new"), MESSAGES_A.start_failed);
  assert.equal(messageForA(undefined), MESSAGES_A.start_failed);
  assert.equal(messageForA("toString"), MESSAGES_A.start_failed);
});

test("no message holds a status code, a path, a tool name or a key", () => {
  for (const m of Object.values(MESSAGES_A)) {
    assert.doesNotMatch(m, /\b[1-5]\d\d\b|\/|_|sk-ant|mcp|snapshot|set_ease|claude/i, m);
  }
});
