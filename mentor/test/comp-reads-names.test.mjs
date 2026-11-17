// Spec 014 T037 round 3, fix (h) (cases 09 and 01): describe_layers resolves a name that isn't any layer's
// exact name. One loose match resolves, and the entry says what was asked; two or more return NAME_PARTIAL
// with every candidate's name and index, so the mentor has something to ask with (spec 014 OQ-8).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
use(COMP1);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { loosely } = await import("../tools/comp-reads.mjs");

const call = async (args) => JSON.parse((await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text);
let n = 0;
const plant = (edit) => {
  const s = JSON.parse(fs.readFileSync(COMP1, "utf8"));
  edit(s);
  const f = path.join(home, `planted-${++n}.json`);
  fs.writeFileSync(f, JSON.stringify(s));
  use(f);
};
const rename = (s, index, name) => {
  s.layer_info.find((l) => l.index === index).name = name;
  const keyed = (s.layers || []).find((l) => l.index === index);
  if (keyed) keyed.name = name;
};

test("loosely: the asked text, ignoring case, as a whole word or words in the name", () => {
  for (const [asked, name] of [["rock", "rock.png"], ["Rock", "rock.png"], ["rock", "Rock Shadow.png"], ["shake control", "Shake Control"], ["logo", "General Logo Animation Graphics.png"], [" rock ", "rock.png"]]) {
    assert.equal(loosely(asked, name), true, `${asked} in ${name}`);
  }
  for (const [asked, name] of [["rock", "Rocky.png"], ["title", "Subtitle"], ["", "rock.png"], ["a.b", "axb"], ["(", "a (b"]]) {
    assert.equal(loosely(asked, name), false, `${asked} not in ${name}`);
  }
});

test("case 01 on Comp 1: \"rock\" matches only rock.png, so it resolves, and the entry says what was asked", async () => {
  use(COMP1);
  const r = await call({ layers: ["rock"] });
  assert.equal(r.layers[0].layer, "rock.png");
  assert.equal(r.layers[0].layer_index, 28);
  assert.equal(r.layers[0].asked, "rock");
  assert.ok(Array.isArray(r.layers[0].shifts), "a resolved name is a named layer, with its shifts");
  const exact = await call({ layers: ["rock.png"] });
  assert.equal("asked" in exact.layers[0], false, "an exact name says nothing extra");
  const detail = await call({ layers: ["Rock"], detail: true });
  assert.deepEqual([detail.layers[0].layer, detail.layers[0].asked], ["rock.png", "Rock"]);
});

test("case 09 (two rocks): \"rock\" matches rock.png and Rock Shadow.png, so NAME_PARTIAL names both, with index and parent", async () => {
  plant((s) => rename(s, 22, "Rock Shadow.png"));
  const r = await call({ layers: ["rock"] });
  const info = JSON.parse(fs.readFileSync(COMP1, "utf8")).layer_info;
  const parentOf = (i) => { const p = info.find((l) => l.index === i).parent; return p == null ? null : info.find((l) => l.index === p).name; };
  assert.deepEqual(r.layers, [{
    asked: "rock",
    error: "NAME_PARTIAL",
    candidates: [
      { layer_index: 22, layer: "Rock Shadow.png", parent: parentOf(22) },
      { layer_index: 28, layer: "rock.png", parent: parentOf(28) },
    ],
  }]);
  assert.equal(r.layers[0].candidates[1].parent, "Shake Control", "rock.png rides on Shake Control");
  const exact = await call({ layers: ["rock.png"] });
  assert.equal(exact.layers[0].layer, "rock.png", "an exact name still wins over a loose one");
  use(COMP1);
});

test("an exact name two layers share is still NAME_SHARED (FR-017); a name nothing matches is still NOT_FOUND", async () => {
  use(COMP1);
  const r = await call({ layers: ["G Shakers", "hammer"] });
  assert.equal(r.layers[0].error, "NAME_SHARED");
  assert.deepEqual(r.layers[1], { asked: "hammer", error: "NOT_FOUND" });
});

test("a loose name that matches two layers of the same name (\"g shakers\") lists both, told apart by index", async () => {
  use(COMP1);
  const r = await call({ layers: ["g shakers"] });
  assert.equal(r.layers[0].error, "NAME_PARTIAL");
  assert.deepEqual(r.layers[0].candidates.map((c) => [c.layer_index, c.layer]), [[7, "G Shakers"], [14, "G Shakers"]]);
});
