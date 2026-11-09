// Spec 007 T011, FR-090, SC-017, plan P4: panel code must run in AE 26.5's CEF 99 (Chromium 99).
// There's no CEF here, so this is a named list and not proof; the live sittings cover the rest.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".js") ? [p] : [];
  });
}

const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

const CSS = [[":has(", /:has\(/], ["@container", /@container/], ["color-mix(", /color-mix\(/], ["text-wrap", /text-wrap/], ["dvh", /\b\d*\.?\d+dvh\b|\bdvh\b/]];

// A rule inside a rule. @media and @supports wrap rules legally; @keyframes holds its own blocks.
function nestedRules(css) {
  const found = [];
  const stack = [];
  let chunkStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      const head = css.slice(chunkStart, i).trim();
      const atRule = head.startsWith("@");
      const parent = stack[stack.length - 1];
      if (parent && parent.plain && !parent.keyframes) found.push(head);
      stack.push({ plain: !atRule, keyframes: atRule && /^@(-webkit-)?keyframes/.test(head) });
      chunkStart = i + 1;
    } else if (ch === "}") {
      stack.pop();
      chunkStart = i + 1;
    } else if (ch === ";") {
      chunkStart = i + 1;
    }
  }
  return found;
}

const SCRIPT = [
  ["toSorted", /\.toSorted\(/], ["toReversed", /\.toReversed\(/], ["toSpliced", /\.toSpliced\(/], [".with(", /\.with\(/],
  ["Object.groupBy", /Object\.groupBy/], ["Map.groupBy", /Map\.groupBy/], ["Promise.withResolvers", /Promise\.withResolvers/],
  ["Array.fromAsync", /Array\.fromAsync/], ["Set methods", /\.(union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\(/],
  ["regex v flag", /(?:^|[=(,:\s])\/(?:\\.|\[(?:\\.|[^\]\n])*\]|[^/\\\n[])+\/[dgimsuy]*v[dgimsuy]*(?![\w$])/m],
  [":has( in a selector", /:has\(/],
];

const cssFindings = (css) => CSS.filter(([, re]) => re.test(css)).map(([n]) => n).concat(nestedRules(css).map((h) => `nesting: ${h}`));
const scriptFindings = (src) => SCRIPT.filter(([, re]) => re.test(src)).map(([n]) => n);

const SCRIPT_FILES = ["main.js", ...walk("lib")];

test("the scan covers lib's subfolders and never the helper", () => {
  assert.ok(SCRIPT_FILES.some((f) => f.endsWith(path.join("checklist", "index.js"))));
  assert.equal(SCRIPT_FILES.some((f) => f.includes("helper")), false);
});

test("the list catches what it names", () => {
  for (const css of [".a:has(.b){color:red}", "@container (max-height:1px){.a{color:red}}", ".a{color:color-mix(in srgb,red,blue)}", ".a{text-wrap:balance}", ".a{height:100dvh}", ".a{color:red; .b{color:blue}}"]) {
    assert.ok(cssFindings(css).length > 0, css);
  }
  for (const js of ["a.toSorted()", "a.toReversed()", "a.toSpliced(1)", "a.with(0,1)", "Object.groupBy(a,f)", "Map.groupBy(a,f)", "Promise.withResolvers()", "Array.fromAsync(a)", "a.union(b)", "const r = /[a]/v;", "q.querySelector('a:has(b)')"]) {
    assert.ok(scriptFindings(js).length > 0, js);
  }
});

test("a legal @media or @keyframes isn't called nesting", () => {
  assert.deepEqual(nestedRules("@media (max-height:560px){.a{color:red}} @keyframes spin{to{transform:rotate(1deg)}} .b{color:red}"), []);
});

test("panel.css and index.html use nothing on the list", () => {
  assert.deepEqual(cssFindings(stripCss(read("panel.css"))), []);
  assert.deepEqual(scriptFindings(read("index.html")).concat(CSS.filter(([, re]) => re.test(read("index.html"))).map(([n]) => n)), []);
});

test("main.js and panel/lib/** use nothing on the list", () => {
  const found = SCRIPT_FILES.flatMap((f) => scriptFindings(read(f)).map((n) => `${f}: ${n}`));
  assert.deepEqual(found, []);
});
