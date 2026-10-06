"use strict";
// Eval cases 17–20 must send the panel's exact requests (research R10, FR-019).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { REQUESTS } = require("../lib/requests.js");

const CASES = path.join(__dirname, "..", "..", "product", "evals", "easing", "cases");
const load = (id) => JSON.parse(fs.readFileSync(path.join(CASES, `${id}.json`), "utf8"));

const LAST = {
  "17-button-check-partial": "check",
  "18-button-hint": "hint",
  "19-button-show-me": "show_me",
  "20-button-show-me-again": "show_me_again",
};

test("each button case's last turn sends that button's request", () => {
  for (const [id, kind] of Object.entries(LAST)) {
    assert.equal(load(id).turns.at(-1).say, REQUESTS[kind].request, id);
  }
});

test("every turn in the button cases is a panel request", () => {
  const all = new Set(Object.values(REQUESTS).map((r) => r.request));
  for (const id of Object.keys(LAST)) {
    for (const t of load(id).turns) assert.ok(all.has(t.say), `${id}: "${t.say}" isn't a panel request`);
  }
});
