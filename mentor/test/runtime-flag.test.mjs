// Spec 014 T009 (research R4, FR-017): the server is on A only when AE_MENTOR_RUNTIME is exactly "a".

import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

const { runtime, RUNTIMES } = await import("../lib/runtime-flag.mjs");
const saved = process.env.AE_MENTOR_RUNTIME;
afterEach(() => {
  if (saved === undefined) delete process.env.AE_MENTOR_RUNTIME;
  else process.env.AE_MENTOR_RUNTIME = saved;
});

test("unset is b1 (B1's runtime folder sets nothing)", () => {
  delete process.env.AE_MENTOR_RUNTIME;
  assert.equal(runtime(), "b1");
  assert.equal(runtime({}), "b1");
});

test("exactly a is a, read from the process environment by default", () => {
  process.env.AE_MENTOR_RUNTIME = "a";
  assert.equal(runtime(), "a");
  assert.equal(runtime({ AE_MENTOR_RUNTIME: "a" }), "a");
});

test("anything else fails closed to b1", () => {
  delete process.env.AE_MENTOR_RUNTIME;
  for (const v of ["", "b1", "A", " a", "a ", "api", "true", "1"]) assert.equal(runtime({ AE_MENTOR_RUNTIME: v }), "b1", JSON.stringify(v));
  assert.equal(runtime(null), "b1");
  assert.equal(runtime(undefined), "b1", "undefined falls back to process.env, which is unset here");
});

test("the two runtimes", () => {
  assert.deepEqual(RUNTIMES, ["a", "b1"]);
});
