// R0 (research R10, data-model › Host, FR-011): the AE version and OS from the snapshot, and nothing
// personal.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHost, atLeast } from "../lib/host.mjs";

test("a Mac host gives version, build, OS and platform", () => {
  assert.deepEqual(parseHost({ host: { ae_version: "26.5x12", os: "Macintosh OS 27.0.1/64" } }), {
    known: true, version: "26.5", build: "12", os: "macOS 27.0.1", platform: "mac", beta: null,
  });
});

test("a Windows $.os string gives platform win", () => {
  const h = parseHost({ host: { ae_version: "25.3x41", os: "Windows/64 10.0.22631" } });
  assert.equal(h.platform, "win");
  assert.equal(h.os, "Windows 10.0.22631");
  assert.equal(h.version, "25.3");
  assert.equal(h.build, "41");
});

test("no host (every fixture before spec 004) is unknown", () => {
  assert.deepEqual(parseHost({ comp: {}, layers: [] }), { known: false });
  assert.deepEqual(parseHost(null), { known: false });
  assert.deepEqual(parseHost({ host: { ae_version: null, os: null } }), { known: false });
});

test("extra keys and anything after the OS version are dropped (FR-011)", () => {
  const h = parseHost({
    host: { ae_version: "26.5x12", os: "Macintosh OS 27.0.1/64 jdoe's MacBook /Users/jdoe", user: "jdoe", machine: "Studio-7" },
  });
  assert.deepEqual(Object.keys(h).sort(), ["beta", "build", "known", "os", "platform", "version"]);
  assert.equal(h.os, "macOS 27.0.1");
  assert.doesNotMatch(JSON.stringify(h), /jdoe|Studio|Users/);
});

test("a version with no build part gives build null", () => {
  assert.equal(parseHost({ host: { ae_version: "26.5", os: "Macintosh OS 27.0.1/64" } }).build, null);
});

test("atLeast compares major.minor, and is false when the host is unknown", () => {
  const h = parseHost({ host: { ae_version: "26.5x12", os: "Macintosh OS 27.0.1/64" } });
  assert.equal(atLeast(h, "25.4"), true);
  assert.equal(atLeast(h, "26.5"), true);
  assert.equal(atLeast(h, "26.6"), false);
  assert.equal(atLeast(parseHost({ host: { ae_version: "25.3x2", os: "Macintosh OS 14.1/64" } }), "25.4"), false);
  assert.equal(atLeast(parseHost({ host: { ae_version: "9.10x1", os: "Macintosh OS 14.1/64" } }), "9.9"), true, "numbers, not strings");
  assert.equal(atLeast(parseHost({}), "25.4"), false);
});
