// Spec 015 T015 finding (SC-007): on live Comp 1 the whole-comp summary went over 12 KB. Two causes:
// each of Shake Control's 13 children repeated its expressions' moves, and fit() added the size note
// after fitting, which tipped the reply over its cap. A parent's moves are now said once, on its own
// entry, when it's in the same reply; and the size note counts against the cap.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const { comp1, LIVE } = await import("./fixtures/expressions/comp1.mjs");
const COMP1 = path.join(home, "comp1.json");
fs.writeFileSync(COMP1, JSON.stringify(comp1()));
fs.writeFileSync(stateFile, JSON.stringify({ project: COMP1 }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const reads = await import("../tools/comp-reads.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const raw = async (args = {}) => (await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text;
const size = (text) => Buffer.byteLength(text, "utf8");
const on = LIVE ? "live" : "derived";

test(`Comp 1 (${on}), whole comp: a child names its parent's expressions; the moves are on the parent's own entry`, async () => {
  const r = JSON.parse(await raw({}));
  const shake = r.layers.find((l) => l.layer === "Shake Control");
  const rock = r.layers.find((l) => l.layer === "rock.png");
  assert.deepEqual(rock.parents.map((p) => [p.layer_index, p.moves_by, p.expressions]), [[shake.layer_index, "expression", [{ property: "Position", error: false }, { property: "Rotation", error: false }]]]);
  assert.deepEqual(shake.expressions.map((x) => x.property), ["Position", "Rotation"]);
  // Live: the sweep's numbers; derived (no sweeps): not read. Either way it's said here, once.
  for (const x of shake.expressions) assert.ok(x.moves && ("varies" in x.moves || x.moves.status === "not_read"), `${x.property} moves are on Shake Control's entry`);
  assert.equal(r.size, undefined, "nothing cut");
});

test(`Comp 1 (${on}), one layer: the parent isn't in the reply, so its moves stay on the child's entry`, async () => {
  const rock = JSON.parse(await raw({ layers: ["rock.png"] })).layers[0];
  for (const x of rock.parents[0].expressions) assert.ok(x.moves && ("varies" in x.moves || x.moves.status === "not_read"), x.property);
  const both = JSON.parse(await raw({ layers: ["rock.png", "Shake Control"] })).layers;
  assert.deepEqual(both[0].parents[0].expressions.map((x) => Object.keys(x)), [["property", "error"], ["property", "error"]], "named together: said once");
});

test(`Comp 1 (${on}): a cut reply, size note included, is never over its cap, and a parent cut off gives its moves back to the children`, async () => {
  const keep = reads.LIMITS.summary_bytes;
  try {
    for (const cap of [3000, 5000, 7000, 9000]) {
      reads.LIMITS.summary_bytes = cap;
      const text = await raw({});
      const r = JSON.parse(text);
      assert.ok(size(text) <= cap, `cap ${cap}: ${size(text)} bytes`);
      assert.equal(r.size.bytes, size(text), `cap ${cap}: size.bytes is the reply's own size`);
      assert.equal(r.layers.length + r.size.cut.length, 29, `cap ${cap}: every layer kept or named as cut`);
      const listed = new Set(r.layers.map((l) => l.layer_index));
      for (const l of r.layers) {
        for (const p of l.parents) {
          for (const x of p.expressions) assert.equal("moves" in x, !listed.has(p.layer_index), `cap ${cap}: ${l.layer} › ${p.layer} › ${x.property}`);
        }
      }
    }
  } finally {
    reads.LIMITS.summary_bytes = keep;
  }
});
