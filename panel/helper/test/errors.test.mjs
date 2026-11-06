import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { classify, isNetworkError, MESSAGES, KINDS, errorEvent, scrub, logLine } from "../lib/errors.mjs";
import { createClient, lastReach } from "../lib/loop.mjs";
import { startFakeService, reply, failure, drop, errorEvent as sseError, text } from "./fake-service.mjs";
import http from "node:http";
import net from "node:net";

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
  assert.equal(classify(await errorFrom(drop([text("half an answer")], 1))), "service_busy", "dropped mid-answer: the connection was made");
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

test("a connection that can't be made is offline (a port fetch won't use)", async () => {
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

test("only network errors are offline or service_busy; any other non-API error is a helper fault, start_failed (S5)", async () => {
  const dropped = await errorFrom(drop([text("half")], 1));
  assert.ok(isNetworkError(dropped), "a dropped stream: undici's socket error under the SDK's");
  assert.equal(classify(dropped), "service_busy");
  const reset = Object.assign(new Error("read failed"), { cause: Object.assign(new Error("socket"), { code: "ECONNRESET" }) });
  assert.equal(classify(reset), "service_busy", "not wrapped by the SDK, so it came after the headers");
  for (const bug of [new TypeError("Cannot read properties of undefined (reading 'content')"), new Error("boom"), new RangeError("x"), "a string"]) {
    assert.equal(isNetworkError(bug), false, String(bug));
    assert.equal(classify(bug), "start_failed", String(bug));
  }
  const parse = new Anthropic.AnthropicError("Unable to parse tool parameter JSON from model.");
  assert.equal(classify(parse), "start_failed");
});

// ---------- offline only when the request never reached the service (2026-11-05) ----------

test("the SDK's connection errors: offline unless the request reached the service", () => {
  for (const err of [new Anthropic.APIConnectionTimeoutError(), new Anthropic.APIConnectionError({ cause: new TypeError("fetch failed") })]) {
    assert.equal(classify(err), "offline", "nothing known: as before");
    assert.equal(classify(err, { reached: false }), "offline");
    assert.equal(classify(err, { reached: true }), "service_busy");
  }
  // reached says nothing about an error that isn't a connection error.
  assert.equal(classify(new Anthropic.APIConnectionTimeoutError(), { reached: true }), "service_busy");
  assert.equal(classify(new Error("boom"), { reached: true }), "start_failed");
});

// One request through a createClient client; → [the error, what classify makes of it].
async function failWith(baseURL, opts = {}) {
  const client = createClient({ apiKey: KEY, baseURL, log: () => {}, headersMs: opts.headersMs || 300 });
  try {
    await client.beta.messages.create({ model: "claude-opus-5-5", max_tokens: 8, messages: [{ role: "user", content: "hi" }] }, { maxRetries: opts.maxRetries ?? 0 });
  } catch (e) {
    return [e, classify(e, lastReach(client))];
  }
  return [null, null];
}

async function closedPort() {
  const srv = http.createServer();
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  const port = srv.address().port;
  await new Promise((ok) => srv.close(ok));
  return port;
}

test("connected, then no headers in time (the SDK's own timeout): service_busy", async () => {
  const silent = http.createServer(() => {}); // takes the request, never answers
  await new Promise((ok) => silent.listen(0, "127.0.0.1", ok));
  try {
    const [err, kind] = await failWith(`http://127.0.0.1:${silent.address().port}`);
    assert.ok(err instanceof Anthropic.APIConnectionTimeoutError, String(err));
    assert.equal(kind, "service_busy");
    const [err2, kind2] = await failWith(`http://127.0.0.1:${silent.address().port}`, { maxRetries: 1 });
    assert.ok(err2 instanceof Anthropic.APIConnectionTimeoutError);
    assert.equal(kind2, "service_busy", "after the SDK's retry too");
  } finally {
    silent.closeAllConnections();
    silent.close();
  }
});

test("connected, then closed before any headers: service_busy", async () => {
  const rude = http.createServer((req) => req.socket.destroy());
  await new Promise((ok) => rude.listen(0, "127.0.0.1", ok));
  try {
    const [err, kind] = await failWith(`http://127.0.0.1:${rude.address().port}`);
    assert.ok(err instanceof Anthropic.APIConnectionError && !(err instanceof Anthropic.APIConnectionTimeoutError), String(err));
    assert.equal(kind, "service_busy");
  } finally {
    rude.close();
  }
});

test("refused: offline", async () => {
  const [err, kind] = await failWith(`http://127.0.0.1:${await closedPort()}`);
  assert.ok(err instanceof Anthropic.APIConnectionError);
  assert.equal(kind, "offline");
});

test("no DNS answer: offline", async () => {
  const [err, kind] = await failWith("http://knack-helper-test.invalid", { headersMs: 5000 });
  assert.ok(err instanceof Anthropic.APIConnectionError);
  assert.equal(kind, "offline");
});

test("a TLS handshake that never finishes (the socket opened, nothing came back): offline", async () => {
  const mute = net.createServer(() => {}); // accepts TCP, never speaks TLS
  await new Promise((ok) => mute.listen(0, "127.0.0.1", ok));
  try {
    const [err, kind] = await failWith(`https://127.0.0.1:${mute.address().port}`);
    assert.ok(err instanceof Anthropic.APIConnectionTimeoutError, String(err));
    assert.equal(kind, "offline");
  } finally {
    mute.close();
  }
});

test("a request that got headers, then a dropped connection, through createClient: service_busy", async () => {
  const c = createClient({ apiKey: KEY, baseURL: svc.url, log: () => {} });
  svc.script(drop([text("half")], 1));
  let err;
  try {
    const s = c.beta.messages.stream({ model: "claude-opus-5-5", max_tokens: 64, messages: [{ role: "user", content: "hi" }] }, { maxRetries: 0 });
    await s.finalMessage();
  } catch (e) {
    err = e;
  }
  assert.ok(err && !(err instanceof Anthropic.APIConnectionError));
  assert.equal(lastReach(c).reached, true);
  assert.equal(classify(err, lastReach(c)), "service_busy");
});
