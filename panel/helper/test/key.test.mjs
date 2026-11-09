import { test } from "node:test";
import assert from "node:assert/strict";
import { readKeychainKey, resolveKey, scrubEnv, checkKey, SECURITY, SECURITY_ARGS, KEYCHAIN } from "../lib/key.mjs";
import { createClient } from "../lib/loop.mjs";
import { startFakeService, failure } from "./fake-service.mjs";

const KEY = "sk-ant-api03-FAKEKEY_0123456789";

function fakeSecurity(result) {
  const calls = [];
  const run = async (file, args) => {
    calls.push({ file, args });
    if (result instanceof Error) throw result;
    return result;
  };
  return { run, calls };
}

test("reads the Knack item with the security CLI", async () => {
  const f = fakeSecurity(`${KEY}\n`);
  assert.equal(await readKeychainKey(f.run), KEY);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].file, "/usr/bin/security");
  assert.deepEqual(f.calls[0].args, ["find-generic-password", "-s", "Knack", "-a", "anthropic-api-key", "-w"]);
  assert.equal(SECURITY, "/usr/bin/security");
  assert.deepEqual([...SECURITY_ARGS], f.calls[0].args);
  assert.deepEqual({ ...KEYCHAIN }, { service: "Knack", account: "anthropic-api-key" });
});

test("a missing item, empty output or a failing runner is nothing, not an error", async () => {
  assert.equal(await readKeychainKey(fakeSecurity(null).run), null);
  assert.equal(await readKeychainKey(fakeSecurity("  \n").run), null);
  assert.equal(await readKeychainKey(fakeSecurity(new Error("security: item not found")).run), null);
});

test("the start command's key (evals) is used before the Keychain", async () => {
  const f = fakeSecurity("sk-ant-from-keychain-xxxxxxxx");
  assert.equal(await resolveKey(KEY, f.run), KEY);
  assert.equal(f.calls.length, 0, "the Keychain isn't read when the start command has a key");
  assert.equal(await resolveKey("", f.run), "sk-ant-from-keychain-xxxxxxxx");
  assert.equal(await resolveKey(undefined, fakeSecurity(null).run), null);
});

test("the SDK's credential and host variables are removed from the helper's environment", () => {
  const env = {
    PATH: "/usr/bin",
    HOME: "/Users/x",
    ANTHROPIC_API_KEY: KEY,
    ANTHROPIC_AUTH_TOKEN: "t",
    ANTHROPIC_PROFILE: "p",
    ANTHROPIC_BASE_URL: "https://elsewhere.example",
    ANTHROPIC_CUSTOM_HEADERS: "x: y",
    KNACK_OTHER: "kept",
  };
  const removed = scrubEnv(env);
  assert.deepEqual(removed, ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_CUSTOM_HEADERS", "ANTHROPIC_PROFILE"]);
  assert.deepEqual(env, { PATH: "/usr/bin", HOME: "/Users/x", KNACK_OTHER: "kept" });
});

test("the real security CLI answers nothing for an item that doesn't exist", { skip: process.platform !== "darwin" }, async () => {
  // Reads a made-up account, so the builder's real item is never touched.
  const { execFile } = await import("node:child_process");
  const run = (file, args) =>
    new Promise((resolve) => {
      const a = [...args];
      a[a.indexOf("anthropic-api-key")] = "knack-test-no-such-account";
      execFile(file, a, { env: { PATH: "/usr/bin:/bin" }, timeout: 10000 }, (err, out) => resolve(err ? null : out));
    });
  assert.equal(await readKeychainKey(run), null);
});

// ---------- the key check (spec 013 T037, FR-020, research R11) ----------
// Always T005's fake service: no test ever reaches the real API.

const MODEL = "claude-opus-5-5";
const forModels = (entry) => ({ ...entry, forModels: true });

async function check(svc, key, logs = []) {
  const client = createClient({ apiKey: key, baseURL: svc.url, log: (e) => logs.push(e) });
  return checkKey({ key, model: MODEL, client, log: (e) => logs.push(e) });
}

test("key check: works is one GET of the settings model, and nothing else", async () => {
  const svc = await startFakeService();
  try {
    assert.equal(await check(svc, KEY), "works");
    assert.equal(svc.requests.length, 1);
    assert.equal(svc.requests[0].method, "GET");
    assert.equal(svc.requests[0].path, `/v1/models/${MODEL}`);
    assert.equal(svc.messageRequests.length, 0, "no message request: costs nothing");
  } finally {
    await svc.close();
  }
});

test("key check: no key makes no request", async () => {
  const svc = await startFakeService();
  try {
    for (const k of [null, undefined, ""]) assert.equal(await checkKey({ key: k, model: MODEL, client: null }), "no_key");
    assert.equal(svc.requests.length, 0);
  } finally {
    await svc.close();
  }
});

test("key check: 401 and 403 are rejected, after one request (no retries)", async () => {
  for (const [status, type] of [[401, "authentication_error"], [403, "permission_error"]]) {
    const svc = await startFakeService();
    try {
      svc.script(forModels(failure(status, type, "invalid x-api-key")));
      const logs = [];
      assert.equal(await check(svc, KEY, logs), "rejected");
      assert.equal(svc.requests.length, 1);
      assert.ok(logs.some((e) => e.event === "key_check" && e.status === "rejected" && e.http_status === status));
      assert.ok(!JSON.stringify(logs).includes(KEY));
    } finally {
      await svc.close();
    }
  }
});

test("key check: out of credit, where the service says so", async () => {
  const svc = await startFakeService();
  try {
    svc.script(forModels(failure(400, "billing_error", "Your credit balance is too low")));
    assert.equal(await check(svc, KEY), "out_of_credit");
  } finally {
    await svc.close();
  }
});

test("key check: a service that can't be reached is offline, after one try", async () => {
  const svc = await startFakeService();
  const url = svc.url;
  await svc.close();
  const client = createClient({ apiKey: KEY, baseURL: url, log: () => {} });
  const t0 = Date.now();
  assert.equal(await checkKey({ key: KEY, model: MODEL, client }), "offline");
  assert.ok(Date.now() - t0 < 5000, "no retry backoff");
});

test("key check: a busy or unexpected answer can't say the key works or doesn't: offline (not checked)", async () => {
  for (const [status, type] of [[529, "overloaded_error"], [500, "api_error"], [429, "rate_limit_error"], [404, "not_found_error"]]) {
    const svc = await startFakeService();
    try {
      svc.script(forModels(failure(status, type, "x", { "x-should-retry": "false" })));
      assert.equal(await check(svc, KEY), "offline", `${status}`);
      assert.equal(svc.requests.length, 1, `${status}: one request`);
    } finally {
      await svc.close();
    }
  }
});

test("key check: never throws, whatever the client does", async () => {
  const client = { models: { retrieve: () => { throw new Error("boom"); } } };
  assert.equal(await checkKey({ key: KEY, model: MODEL, client }), "offline");
});
