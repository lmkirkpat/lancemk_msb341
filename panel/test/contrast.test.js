// Spec 007 SC-008 (FR-074, FR-076): every text colour reaches 4.5:1 on the backgrounds it really
// sits on, and no text is under 11 px. Ratios are computed with the WCAG formula from the CSS.
"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "panel.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const scripts = [path.join(root, "main.js")].concat(
  fs.readdirSync(path.join(root, "lib")).filter((f) => f.endsWith(".js")).map((f) => path.join(root, "lib", f))
);
const markup = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sources = [markup].concat(scripts.map((f) => fs.readFileSync(f, "utf8")));

const MIN_RATIO = 4.5;
const MIN_PX = 11;

// ---------- reading the CSS ----------

const rules = [];
for (const m of css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const decls = {};
  for (const d of m[2].split(";")) {
    const i = d.indexOf(":");
    if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  }
  for (const selector of m[1].split(",")) rules.push({ selector: selector.trim(), decls });
}

const decl = (selector, prop) => {
  const rule = rules.find((r) => r.selector === selector && prop in r.decls);
  assert.ok(rule, `panel.css has no ${prop} on ${selector}`);
  return rule.decls[prop];
};

// A hex colour, a var(--token) or a bare --token, as a 6-digit hex.
function resolve(value) {
  const v = /^var\((--[\w-]+)\)$/.exec(value);
  const name = v ? v[1] : value;
  const hex = name.startsWith("--") ? decl(":root", name) : name;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  assert.ok(m, `not a colour this check can read: ${value}`);
  return m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
}

// ---------- the WCAG formula ----------

const channels = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminance(hex) {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The colour text ends up as under an opacity.
function dimmed(fg, bg, opacity) {
  const [f, b] = [channels(fg), channels(bg)];
  return f.map((c, i) => Math.round(c * opacity + b[i] * (1 - opacity)).toString(16).padStart(2, "0")).join("");
}

// ---------- what sits on what ----------

const BG = "--bg";
const RAISED = "--bg-raised";
const SUNK = "--bg-sunk";
const buttonFill = () => decl("button", "background");
const buttonHover = () => decl("button:hover:not(:disabled)", "background");
const primaryFill = () => decl("button.primary", "background");

// Every rule in panel.css that sets a text colour, and the backgrounds it can land on. The colour
// comes from the CSS. A new colour rule fails below until its backgrounds are written here.
const SITS_ON = {
  body: [BG],
  h2: [BG],
  h3: [BG],
  ".conn": [BG],
  ".path li": [BG],
  ".path li.done": [BG],
  ".path li.current": [BG],
  ".stage li": [BG],
  ".stage li.done": [BG],
  ".stage li.current": [BG],
  ".stage li.skipped": [BG],
  ".empty": [BG],
  ".msg.learner span": [RAISED],
  ".msg.notice": [BG],
  ".frame-missing": [RAISED], // inside a mentor message
  ".status": [BG],
  ".check-summary": [BG],
  ".check-rows li small": [BG],
  ".check-rows li.ok span:last-child": [BG],
  ".check-rows li.bad span:last-child": [BG],
  ".check-outside li": [BG],
  ".check-stale": [BG],
  button: [buttonFill, buttonHover],
  "button.primary": [primaryFill, buttonHover], // the hover rule outranks button.primary
  ".ask input": [SUNK],
  ".memory": [BG],
  ".memory strong": [BG],
};

// Text that inherits its colour onto a different background, so no colour rule names the pair.
const INHERITED = [
  ["mentor message text", "--text", RAISED],
  ["code in a mentor message", "--text", SUNK],
];

const colourOf = (selector) => decl(selector, "color");
const colourRules = rules.filter((r) => "color" in r.decls);

function pairs() {
  const out = [];
  for (const [selector, backgrounds] of Object.entries(SITS_ON)) {
    for (const bg of backgrounds) {
      out.push([selector, colourOf(selector), typeof bg === "function" ? bg() : bg]);
    }
  }
  return out.concat(INHERITED);
}

const worstMessages = (list) =>
  list
    .map(([name, fg, bg]) => [name, fg, bg, ratio(resolve(fg), resolve(bg))])
    .filter((p) => p[3] < MIN_RATIO)
    .map((p) => `${p[0]}: ${p[1]} on ${p[2]} is ${p[3].toFixed(2)}:1`);

// ---------- contrast ----------

test("the WCAG formula gives the known ratios", () => {
  assert.strictEqual(ratio("ffffff", "000000"), 21);
  assert.strictEqual(ratio("777777", "777777"), 1);
  assert.strictEqual(ratio("ffffff", "767676").toFixed(2), "4.54");
  assert.strictEqual(resolve("#fff"), "ffffff");
});

test("FR-074's three colours are the spec's", () => {
  assert.strictEqual(decl(":root", "--muted"), "#9a9a9a");
  assert.strictEqual(decl(":root", "--bad"), "#ff7b72");
  assert.strictEqual(resolve(primaryFill()), "1473e6");
});

test("every text colour reaches 4.5:1 on each background it sits on", () => {
  assert.deepStrictEqual(worstMessages(pairs()), []);
});

test("every rule that sets a text colour has its backgrounds listed", () => {
  const unlisted = colourRules.map((r) => r.selector).filter((s) => !(s in SITS_ON));
  assert.deepStrictEqual(unlisted, []);
});

test("--accent is not used as a text colour", () => {
  assert.deepStrictEqual(colourRules.filter((r) => r.decls.color === "var(--accent)").map((r) => r.selector), []);
});

// Known failure, reported to the cockpit, not fixed: the spec names only three tokens to change.
// `.check.stale { opacity: .5 }` dims the whole check, its note too; FR-075 says the note keeps
// its contrast. Remove `todo` when the dim changes. Disabled controls are left out on purpose:
// WCAG 1.4.3 exempts them.
test("the stale check keeps 4.5:1 once dimmed", { todo: "SC-008 finding: the stale dim, needs a decision" }, () => {
  const opacity = Number(decl(".check.stale", "opacity"));
  const bg = resolve(BG);
  const stale = [".check-summary", ".check-rows li small", ".check-rows li.ok span:last-child",
    ".check-rows li.bad span:last-child", ".check-outside li", ".check-stale", "h2", "h3", "body"];
  const failing = stale
    .map((s) => [s, ratio(dimmed(resolve(colourOf(s)), bg, opacity), bg)])
    .filter((p) => p[1] < MIN_RATIO)
    .map((p) => `${p[0]}: ${p[1].toFixed(2)}:1`);
  assert.deepStrictEqual(failing, []);
});

// ---------- size ----------

test("no font size in panel.css is under 11 px, and every size is in px", () => {
  const sizes = [];
  for (const r of rules) {
    if ("font-size" in r.decls) sizes.push([r.selector, r.decls["font-size"]]);
    if ("font" in r.decls && r.decls.font !== "inherit") sizes.push([r.selector, r.decls.font.split(/[\s/]/)[0]]);
  }
  assert.ok(sizes.length > 0);
  const bad = sizes.filter(([, v]) => !/^[\d.]+px$/.test(v) || parseFloat(v) < MIN_PX);
  assert.deepStrictEqual(bad, []);
});

test("body text is 12 px", () => {
  assert.match(decl("body", "font"), /^12px\//);
});

test("the markup and scripts set no font size of their own", () => {
  const inline = /style\s*=|\.style\b|cssText|fontSize|font-size/;
  assert.deepStrictEqual(sources.filter((s) => inline.test(s)).map((s) => s.slice(0, 40)), []);
});

test("elements the browser shrinks have a size of their own wherever the panel makes them", () => {
  // <small> renders about 10 px at a 12 px body, and <code> about 10 px from the monospace default.
  const shrinkers = ["small", "code", "sub", "sup", "kbd", "samp", "tt", "pre", "big", "h4", "h5", "h6"];
  const made = shrinkers.filter((tag) => sources.some((s) => new RegExp(`<${tag}[\\s>]`).test(s)));
  assert.deepStrictEqual(made.sort(), ["code", "small"]);
  for (const tag of made) {
    const sized = rules.filter((r) => new RegExp(`(^|\\s)${tag}$`).test(r.selector) && "font-size" in r.decls);
    assert.ok(sized.length > 0, `<${tag}> has no font-size in panel.css`);
  }
});
