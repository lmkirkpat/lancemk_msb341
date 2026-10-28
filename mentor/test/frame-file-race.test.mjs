// The frame-file race: concurrent mentor processes share one frame folder, so names must be unique
// per process and call, and pruning must never take a frame another process is still waiting on.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const { newFrameFile, pruneFrames } = await import("../tools/common.mjs");

test("two calls in the same millisecond get different files", (t) => {
  t.mock.method(Date, "now", () => 1_800_000_000_000);
  const a = newFrameFile("/x");
  const b = newFrameFile("/x");
  assert.notEqual(a, b);
  assert.ok(path.basename(a).includes(String(process.pid)), "the name carries the process id");
});

test("a fresh frame survives a prune; a day-old one doesn't", () => {
  const dir = fs.mkdtempSync(path.join(tempHome(), "frames-"));
  const fresh = path.join(dir, "fresh.png");
  const old = path.join(dir, "old.png");
  fs.writeFileSync(fresh, "x");
  fs.writeFileSync(old, "x");
  const dayAgo = (Date.now() - 25 * 3600 * 1000) / 1000;
  fs.utimesSync(old, dayAgo, dayAgo);
  pruneFrames(dir);
  assert.ok(fs.existsSync(fresh));
  assert.ok(!fs.existsSync(old));
});
