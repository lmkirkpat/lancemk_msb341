// Spec 014 T071 (K5, FR-036, research R9): the record says only what a check saw or the learner said.
// The session keeps the changes each check attributed; record_lesson refuses a summary or next that
// pairs a change word with a layer no check attributed (RECORD_UNATTRIBUTED). AB 6's summary is the
// case: "once moved a parent layer's pivot by mistake; undid that", written in a lesson on rock.png
// whose parent is Shake Control, when no check had said so.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "comp1.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const { attributedFrom, unattributed } = await import("../lib/attributed.mjs");
const { MESSAGES } = await import("../errors.mjs");
const { comp1 } = await import("./fixtures/expressions/comp1.mjs");

const LEARNER = path.join(home, "learner.json");
const record = TOOLS.find((t) => t.name === "record_lesson").handler;
const AB6 = "Set the pivot on rock.png; once moved a parent layer's pivot by mistake; undid that.";
const entry = (over = {}) => ({ skill: "transform.anchor", project: "Comp 1.aep", comp: "Comp 1", attempted: "Set rock.png's pivot", result: "partial", demo_used: false, summary: "Set the pivot on rock.png.", next: "Set the pivot without the layer moving", ...over });

// A pivot lesson on rock.png, started on Comp 1 with a stand-in analyzer (the guard reads only the
// lesson's baseline, targets, focus and attributed list).
function rockLesson() {
  const analyze = () => ({ focus: ["rock.png"], targets: ["t1"], target_refs: [{ layer: "rock.png", property: "Anchor Point" }], demo_target: null, no_demo_reason: "single_target" });
  session.start(comp1(), { skill: "transform.anchor", analyze });
}

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
});

test("the message is data-model § 8's, with no field names", () => {
  assert.equal(MESSAGES.RECORD_UNATTRIBUTED, "The record says the learner changed a layer no check saw them change. Rewrite that sentence so it says only what a check saw or they said, keep everything else, and save again.");
  assert.doesNotMatch(MESSAGES.RECORD_UNATTRIBUTED, /_/);
});

test("AB 6's summary is refused when no check attributed the parent; nothing is written", async () => {
  rockLesson();
  session.markChecked(false);
  await assert.rejects(() => record(entry({ summary: AB6 })), (e) => e.code === "RECORD_UNATTRIBUTED");
  await assert.rejects(() => record(entry({ next: "Undo the change on Shake Control first." })), (e) => e.code === "RECORD_UNATTRIBUTED", "next is guarded too");
  await assert.rejects(() => record(entry({ attempted: "Set rock.png's pivot; changed Shake Control by mistake" })), (e) => e.code === "RECORD_UNATTRIBUTED", "attempted is guarded too");
  assert.equal(fs.existsSync(LEARNER), false);
});

test("the same summary is saved when a check attributed a change on the parent", async () => {
  rockLesson();
  session.markChecked(false, { attributed: [{ layer: "Shake Control", property: "Anchor Point" }] });
  const r = JSON.parse((await record(entry({ summary: AB6 }))).content[0].text);
  assert.equal(r.saved, true);
  assert.equal(session.currentLesson().attributed[0].layer, "Shake Control");
});

test("the lesson's own targets and focus are always the learner's; plain summaries and other layers named without a change word pass", async () => {
  rockLesson();
  session.markChecked(false);
  for (const summary of [
    "Moved rock.png's pivot to the corner; the layer moved too.",
    "Set the pivot on rock.png; Shake Control carries it.",
    "Pivot on rock.png still in the middle.",
  ]) {
    fs.rmSync(LEARNER, { force: true });
    assert.equal(JSON.parse((await record(entry({ summary }))).content[0].text).saved, true, summary);
  }
});

test("unattributed(): a sentence needs both a change word and an unattributed layer; longer names first", () => {
  const snapshot = comp1();
  const ctx = { snapshot, attributed: [], own: ["rock.png"] };
  assert.deepEqual(unattributed("Shake Control moved by mistake.", ctx), ["Shake Control"]);
  assert.deepEqual(unattributed("Shake Control carries the rock. The pivot moved.", ctx), [], "different sentences");
  assert.deepEqual(unattributed("Reset the pivot on the parent.", ctx), ["Shake Control"], "'parent' stands for the lesson's layers' parents");
  assert.deepEqual(unattributed("shake control moved by mistake.", ctx), [], "names are case-sensitive");
  assert.deepEqual(unattributed("Changed logo.png and rock.png.", ctx), ["logo.png"]);
  assert.deepEqual(unattributed("Changed logo.png.", { ...ctx, attributed: [{ layer: "logo.png", property: null }] }), []);
  assert.deepEqual(unattributed("", ctx), []);
  assert.deepEqual(unattributed("Moved it.", { ...ctx, snapshot: null }), []);
});

test("attributedFrom(): layers inside a check's change lists and change-kind entries; not the rest", () => {
  const result = {
    passed: false,
    layers: [{ layer: "rock.png", item2: { passed: true } }],
    item5: { moved_layers: [{ layer: "logo.png", distance_px: 4 }], changed_layers: [{ layer: "Shake Control", property: "Anchor Point" }] },
    other_changes: [{ kind: "value_changed", layer: "outline.png", property: "Scale" }],
    still_same: [{ layer: "White Solid 1" }],
    hints: [{ code: "parent_note", layer: "Sweep Control" }],
    comments: [{ kind: "layer_removed", layer: "Old" }],
    moved_children: [{ layer: "B Shakers" }],
    unexpected_changes: [{ layer: "Title", property: "Scale" }],
    extra_holds: [{ layer: "Blink", property: "Opacity" }],
    jumped: { layers: ["Caption"] },
  };
  const names = attributedFrom(result).map((a) => a.layer).sort();
  assert.deepEqual(names, ["B Shakers", "Blink", "Caption", "Old", "Shake Control", "Title", "logo.png", "outline.png"].sort());
  assert.deepEqual(attributedFrom({ passed: true }), []);
});

test("markChecked keeps the list across checks, without duplicates; a lesson with none keeps no list", () => {
  rockLesson();
  session.markChecked(false);
  assert.equal("attributed" in session.currentLesson(), false);
  session.markChecked(false, { attributed: [{ layer: "logo.png", property: "Scale" }] });
  session.markChecked(false, { attributed: [{ layer: "logo.png", property: "Scale" }, { layer: "outline.png" }] });
  assert.deepEqual(session.currentLesson().attributed.map((a) => [a.layer, a.property]), [["logo.png", "Scale"], ["outline.png", null]]);
});

// ---- T081 fix round: true summaries the first build refused.

test("T081: true sentences about motion, and plain nouns that share a layer's name, save", async () => {
  rockLesson();
  session.markChecked(false);
  for (const summary of [
    "Set the pivot on rock.png; it's still moved by its parent's expression.",
    "Set the pivot on rock.png; the parent keeps moving it.",
  ]) {
    fs.rmSync(LEARNER, { force: true });
    assert.equal(JSON.parse((await record(entry({ summary }))).content[0].text).saved, true, summary);
  }
  // Mentor Practice, own layer Title: "the background" is a noun, not the layer Background.
  const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "practice.json"), "utf8"));
  const ctx = { snapshot: practice, attributed: [], own: ["Title"] };
  assert.ok(practice.layer_info.some((l) => l.name === "Background"), "the fixture has a layer named Background");
  assert.deepEqual(unattributed("next, ease the background so it stops moving linearly", ctx), []);
  assert.deepEqual(unattributed("Changed the title's timing.", ctx), []);
  assert.deepEqual(unattributed("Moved Background by mistake.", ctx), ["Background"], "the layer's own name still counts");
});
