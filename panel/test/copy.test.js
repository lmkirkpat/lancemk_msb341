// Spec 007 T003, SC-011: all panel copy lives in lib/copy.js, and none of it holds a file path, a
// command, a tool name, a field name or an error code (FR-058, FR-064).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { COPY } = require("../lib/copy.js");
const { loadConfig } = require("../lib/config.js");

const BAD = [
  ["a file path", /(?:^|\s)[~.]?\/[\w.-]+|[\w.-]+\/[\w-]+\.\w+/],
  ["a command", /`|\bnpm\b|\bbash\b|\bclaude\b|\bnode\b|\/[a-z]+-mentor/],
  ["a tool or field name", /\b[a-z]+_[a-z_]+\b/],
  ["a dotted id", /\b[a-z]+\.[a-z_]+\b/],
  ["an error code", /\b[A-Z]{2,}_[A-Z_]+\b|\b[1-5]\d\d\b/],
];

// Every string in the copy tree, with the plural helpers called for 1 and 3.
function strings(node, at = "COPY") {
  if (typeof node === "string") return [[at, node]];
  if (typeof node === "function") return [1, 3].flatMap((n) => strings(node(n), `${at}(${n})`));
  if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => strings(v, `${at}.${k}`));
  return [];
}

const scan = (list) => list.flatMap(([at, s]) => BAD.filter(([, re]) => re.test(s)).map(([what]) => `${at}: ${what}: ${s}`));

test("the scan catches each kind of leak", () => {
  for (const s of ["See panel/lib/x.js", "Run `node`", "Open /ease-mentor", "It called set_ease", "easing.basic failed", "AE_BUSY", "Error 429"]) {
    assert.ok(scan([["t", s]]).length > 0, s);
  }
});

test("SC-011: no copy holds a path, command, tool name, field name or error code", () => {
  const all = strings(COPY);
  assert.ok(all.length > 60, `only ${all.length} strings`);
  assert.deepEqual(scan(all), []);
});

test("the one named exception (FR-055): the not-set-up message stays in config.js, out of the copy", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-copy-"));
  const r = loadConfig({ home });
  assert.equal(r.ok, false);
  assert.ok(scan([["config.fix", r.fix]]).length > 0, "it does name a command, which is why it's the exception");
  const all = strings(COPY).map(([, s]) => s);
  assert.equal(all.includes(r.fix), false);
  assert.equal(all.some((s) => /install\.sh/.test(s)), false);
});

test("D16: Set it aside replaces Start fresh, and its line says if", () => {
  assert.equal(COPY.home.cutoff.set_aside, "Set it aside");
  assert.equal(COPY.home.cutoff.note, "If you set it aside, this lesson won't be saved. Earlier lessons aren't affected.");
  assert.equal(strings(COPY).some(([, s]) => /start fresh/i.test(s)), false);
});

test("the final wording is index.html's, not the README's pre-pass text (plan P10)", () => {
  const mock = fs.readFileSync(path.join(__dirname, "..", "..", "product", "mockups", "ui-overhaul", "index.html"), "utf8");
  const quoted = [
    COPY.home.first_why, COPY.home.memory_empty, COPY.home.lesson_open.note, COPY.home.aeclosed.body,
    COPY.home.unreachable.title, COPY.home.unreachable.body, COPY.home.busy.body, COPY.home.unreadable.body, COPY.home.unreadable_why.body,
    COPY.lesson.none_title, COPY.lesson.passed, COPY.lesson.review_passed, COPY.lesson.check_passed, COPY.lesson.one_more_question,
    COPY.lesson.unsaved.title, COPY.lesson.unsaved.body, COPY.lesson.picking_up, COPY.lesson.resumed_divider,
    COPY.check.source_full, COPY.check.source_updating, COPY.check.source_stale, COPY.check.source_stale_sub,
    COPY.errors.start_failed.title, COPY.errors.start_failed.body, COPY.errors.not_signed_in.title, COPY.errors.not_signed_in.body,
    COPY.errors.out_of_credit.title, COPY.errors.out_of_credit.body, COPY.errors.rate_limited.title, COPY.errors.service_busy.title,
    COPY.errors.offline.title, COPY.errors.refused.title, COPY.errors.timeout.title, COPY.errors.process_exited.title,
    COPY.errors.demo_easing.title, COPY.errors.demo_other.title, COPY.errors.demo_unknown.title, COPY.buttons.check,
  ];
  for (const line of quoted) assert.ok(mock.includes(line), line);
});

test("every skill's reason line is kept, ready for FR-093 (FR-094)", () => {
  assert.equal(COPY.reasons["easing.speed_graph"], "Control how a move starts and lands.");
  assert.equal(COPY.reasons["keyframes.types"], "Choose which moves snap and which glide.");
  assert.equal(COPY.reasons["timing.offset"], "Stop everything moving at once.");
  assert.equal(COPY.reasons["transform.anchor"], "Make a layer turn from the right spot.");
  assert.equal(COPY.reasons["parenting.null"], "Move several layers as one.");
  assert.equal(COPY.reasons["easing.basic"], COPY.home.first_why);
});

test("the count line reads right for one and for many (D15)", () => {
  assert.equal(COPY.check.unnamed_more(1), "1 more pair. It gets its name at your next check.");
  assert.equal(COPY.check.unnamed_more(3), "3 more pairs. They get names at your next check.");
});
