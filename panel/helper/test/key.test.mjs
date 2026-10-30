import { test } from "node:test";
import assert from "node:assert/strict";
import { readKeychainKey, resolveKey, scrubEnv, SECURITY, SECURITY_ARGS, KEYCHAIN } from "../lib/key.mjs";

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
