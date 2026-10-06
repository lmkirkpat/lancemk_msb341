"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderMentorText } = require("../lib/text.js");

test("paragraphs, bold, italics and code", () => {
  assert.equal(renderMentorText("Hello **there**.\n\nPress `F9` *now*."),
    "<p>Hello <strong>there</strong>.</p><p>Press <code>F9</code> <em>now</em>.</p>");
});

test("bullet and numbered lists", () => {
  assert.equal(renderMentorText("Look at:\n- **Position**\n- Scale\n\n1. Select\n2. Press F9"),
    "<p>Look at:</p><ul><li><strong>Position</strong></li><li>Scale</li></ul><ol><li>Select</li><li>Press F9</li></ol>");
});

test("HTML is escaped, never rendered", () => {
  const out = renderMentorText('<script>alert(1)</script> <img src=x onerror="alert(2)"> & "q"');
  assert.doesNotMatch(out, /<script|<img/);
  assert.match(out, /&lt;script&gt;/);
  assert.match(out, /&lt;img src=x onerror=&quot;alert\(2\)&quot;&gt;/);
  assert.match(out, /&amp;/);
});

test("marks inside code stay literal", () => {
  assert.equal(renderMentorText("`**not bold**`"), "<p><code>**not bold**</code></p>");
});

test("a single newline is a line break, headings become plain text", () => {
  assert.equal(renderMentorText("## Next\nline one\nline two"), "<p>Next<br>line one<br>line two</p>");
});

test("empty input renders nothing", () => {
  assert.equal(renderMentorText(""), "");
  assert.equal(renderMentorText(null), "");
});
