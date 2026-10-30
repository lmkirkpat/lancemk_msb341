import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { classify, isNetworkError, MESSAGES, KINDS, errorEvent, scrub, logLine } from "../lib/errors.mjs";
import { startFakeService, reply, failure, drop, errorEvent as sseError, text } from "./fake-service.mjs";

const KEY = "sk-ant-api03-TESTKEY_abcdefghijklmnop";
let svc;
let client;

before(async () => {
  svc = await startFakeService();
  client = new Anthropic({ apiKey: KEY, baseURL: svc.url, maxRetries: 2 });
});
after(() => svc.close());

// One streamed request against the fake service; → the error thrown, or null.
async function errorFrom(...entries) {
  svc.script(...entries);
  try {
    const s = client.beta.messages.stream({ model: "claude-opus-5-5", max_tokens: 64, messages: [{ role: "user", content: "hi" }] });
    for await (const _ of s); // eslint-disable-line no-unused-vars
    await s.finalMessage();
    return null;
  } catch (e) {
    return e;
  }
}

const fast = { "retry-after-ms": "1" };

test("research R10's table, from the SDK's real errors", async () => {
  assert.equal(classify(await errorFrom(failure(401, "authentication_error", "invalid x-api-key"))), "not_signed_in");
  assert.equal(classify(await errorFrom(failure(403, "permission_error", "nope"))), "not_signed_in");
  assert.equal(classify(await errorFrom(failure(402, "billing_error", "pay up"))), "out_of_credit");
  assert.equal(classify(await errorFrom(failure(400, "billing_error", "Your credit balance is too low"))), "out_of_credit");
  assert.equal(classify(await errorFrom(failure(400, "invalid_request_error", "Your workspace has reached its spend limit"))), "out_of_credit");
  const three = (s, t) => [failure(s, t, t, fast), failure(s, t, t, fast), failure(s, t, t, fast)];
  assert.equal(classify(await errorFrom(...three(429, "rate_limit_error"))), "rate_limited");
  assert.equal(classify(await errorFrom(...three(529, "overloaded_error"))), "service_busy");
  assert.equal(classify(await errorFrom(...three(500, "api_error"))), "service_busy");
  assert.equal(classify(await errorFrom(drop([text("half an answer")], 1))), "offline");
  assert.equal(classify(await errorFrom(sseError("overloaded_error", [text("x")]))), "service_busy");
  assert.equal(classify(await errorFrom(failure(400, "invalid_request_error", "messages: bad"))), "start_failed");
  assert.equal(classify(await errorFrom(failure(404, "not_found_error", "model: nope"))), "start_failed");
});

test("the SDK retries 429 and 529 twice before the error reaches the helper", async () => {
  const n = svc.messageRequests.length;
  svc.script(failure(429, "rate_limit_error", "rl", fast), failure(429, "rate_limit_error", "rl", fast), reply([text("ok")]));
  const s = client.beta.messages.stream({ model: "claude-opus-5-5", max_tokens: 64, messages: [{ role: "user", content: "hi" }] });
  const m = await s.finalMessage();
  assert.equal(m.content[0].text, "ok");
  assert.equal(svc.messageRequests.length - n, 3);
});

test("a connection that can't be made is offline", async () => {
  const dead = new Anthropic({ apiKey: KEY, baseURL: "http://127.0.0.1:9", maxRetries: 0 });
  let err;
  try {
    await dead.beta.messages.create({ model: "claude-opus-5-5", max_tokens: 8, messages: [{ role: "user", content: "hi" }] });
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof Anthropic.APIConnectionError);
  assert.equal(classify(err), "offline");
});

test("no key is not_signed_in", () => {
  assert.equal(classify(Object.assign(new Error("no key"), { code: "NO_KEY" })), "not_signed_in");
});

test("every message is fixed plain text: no status code, path, tool name or key", () => {
  for (const kind of KINDS) {
    const m = MESSAGES[kind];
    assert.doesNotMatch(m, /\b[1-5]\d\d\b/, kind);
    assert.doesNotMatch(m, /\/|\\|_[a-z]|sk-ant/, kind);
  }
  assert.deepEqual(errorEvent("offline"), { kind: "offline", message: MESSAGES.offline });
  assert.equal(MESSAGES.timeout, "The mentor took more than 5 minutes to answer, so the panel stopped waiting. Try again.");
});

test("scrub removes key-shaped text and the key itself", () => {
  assert.equal(scrub(`bad key ${KEY} here`), "bad key [key removed] here");
  assert.equal(scrub("sk-ant-short"), "sk-ant-short");
  assert.equal(scrub("token abcdefgh1234 seen", "abcdefgh1234"), "token [key removed] seen");
  const line = logLine({ event: "x", detail: `401 ${KEY}` }, KEY);
  assert.doesNotMatch(line, /TESTKEY/);
  assert.ok(JSON.parse(line).at);
});

test("only network errors are offline; any other non-API error is a helper fault, start_failed (S5)", async () => {
  const dropped = await errorFrom(drop([text("half")], 1));
  assert.ok(isNetworkError(dropped), "a dropped stream: undici's socket error under the SDK's");
  assert.equal(classify(dropped), "offline");
  const reset = Object.assign(new Error("read failed"), { cause: Object.assign(new Error("socket"), { code: "ECONNRESET" }) });
  assert.equal(classify(reset), "offline");
  assert.equal(classify(new Anthropic.APIConnectionTimeoutError()), "offline");
  for (const bug of [new TypeError("Cannot read properties of undefined (reading 'content')"), new Error("boom"), new RangeError("x"), "a string"]) {
    assert.equal(isNetworkError(bug), false, String(bug));
    assert.equal(classify(bug), "start_failed", String(bug));
  }
  const parse = new Anthropic.AnthropicError("Unable to parse tool parameter JSON from model.");
  assert.equal(classify(parse), "start_failed");
});
