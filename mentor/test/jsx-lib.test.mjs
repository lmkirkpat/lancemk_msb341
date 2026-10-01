// Runs the ES3 libraries in mentor/jsx/lib/ against mock AE property trees, so path rules are
// pinned down before a live AE session depends on them.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "jsx", "lib");
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };

function loadLib() {
  const ctx = vm.createContext({ PropertyType });
  for (const f of fs.readdirSync(LIB).filter((f) => f.endsWith(".jsx")).sort()) {
    vm.runInContext(fs.readFileSync(path.join(LIB, f), "utf8"), ctx);
  }
  return ctx;
}

// Minimal AE-like tree: layer (depth 0) > groups > properties.
function node(matchName, name, propertyType, children = []) {
  const n = { matchName, name, propertyType, parentProperty: null, propertyDepth: 0, propertyIndex: 0, children };
  n.numProperties = children.length;
  n.property = (key) => {
    if (typeof key === "number") return children[key - 1] ?? null;
    return children.find((c) => c.matchName === key || c.name === key) ?? null;
  };
  return n;
}
function wire(parent, depth = 0) {
  parent.propertyDepth = depth;
  parent.children.forEach((c, i) => {
    c.parentProperty = depth === 0 ? parent : parent;
    c.propertyIndex = i + 1;
    wire(c, depth + 1);
  });
  return parent;
}

const position = node("ADBE Position", "Position", PropertyType.PROPERTY);
const xPosition = node("ADBE Position_0", "X Position", PropertyType.PROPERTY);
const trimEnd = node("ADBE Vector Trim End", "End", PropertyType.PROPERTY);
const trimEnd2 = node("ADBE Vector Trim End", "End", PropertyType.PROPERTY);
const layer = wire(
  node("ADBE Vector Layer", "Bar", PropertyType.NAMED_GROUP, [
    node("ADBE Transform Group", "Transform", PropertyType.NAMED_GROUP, [position, xPosition]),
    node("ADBE Root Vectors Group", "Contents", PropertyType.INDEXED_GROUP, [
      node("ADBE Vector Group", "Rectangle 1", PropertyType.NAMED_GROUP, [
        node("ADBE Vectors Group", "Contents", PropertyType.INDEXED_GROUP, [
          node("ADBE Vector Filter - Trim", "Trim Paths 1", PropertyType.NAMED_GROUP, [trimEnd]),
        ]),
      ]),
      node("ADBE Vector Group", "Rectangle 2", PropertyType.NAMED_GROUP, [
        node("ADBE Vectors Group", "Contents", PropertyType.INDEXED_GROUP, [
          node("ADBE Vector Filter - Trim", "Trim Paths 1", PropertyType.NAMED_GROUP, [trimEnd2]),
        ]),
      ]),
    ]),
  ]),
);

test("propPath uses match names, with #index only under indexed groups", () => {
  const lib = loadLib();
  assert.equal(lib.propPath(position), "ADBE Transform Group/ADBE Position");
  assert.equal(lib.propPath(xPosition), "ADBE Transform Group/ADBE Position_0");
  assert.equal(
    lib.propPath(trimEnd),
    "ADBE Root Vectors Group/ADBE Vector Group#1/ADBE Vectors Group/ADBE Vector Filter - Trim#1/ADBE Vector Trim End",
  );
  assert.notEqual(lib.propPath(trimEnd), lib.propPath(trimEnd2), "two rectangles must get different paths");
});

test("displayPath uses display names joined with ›", () => {
  const lib = loadLib();
  assert.equal(lib.displayPath(position), "Transform › Position");
  assert.equal(lib.displayPath(trimEnd), "Contents › Rectangle 1 › Contents › Trim Paths 1 › End");
});

test("propByPath reverses propPath, and rejects a wrong index", () => {
  const lib = loadLib();
  for (const p of [position, xPosition, trimEnd, trimEnd2]) assert.equal(lib.propByPath(layer, lib.propPath(p)), p);
  assert.throws(() => lib.propByPath(layer, "ADBE Root Vectors Group/ADBE Vector Group#3/ADBE Vectors Group"), /not found/);
  assert.throws(() => lib.propByPath(layer, "ADBE Transform Group/ADBE Scale"), /not found/);
});

test("toJSON writes valid JSON, escaping quotes and control characters", () => {
  const lib = loadLib();
  const value = { a: [1, 2.5, null, true], s: 'q"uo\\te\nline', empty: [], nested: { x: {} } };
  assert.deepEqual(JSON.parse(lib.toJSON(value)), value);
  assert.deepEqual(JSON.parse(lib.toJSON(value, "  ")), value);
});
