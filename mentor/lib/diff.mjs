// FR-007: compare the comp now with the lesson baseline, by segment id (data-model.md › Check result).
// Only the lesson's targets are graded; anything else that changed is listed in plain language.

import { segments, linearEnd } from "./analyze.mjs";

const SEP = " › ";
const secs = (t) => String(Number(t.toFixed(3)));
const propLabel = (layer, prop) => `${layer.name}${SEP}${prop.display_name}`;
const segLabel = (s) => `${propLabel(s.layer, s.prop)} ${secs(s.from_time)}–${secs(s.to_time)} s`;

// What a pair's motion depends on: its times and the two sides that face each other.
const signature = (s) => JSON.stringify([s.from_time, s.to_time, s.from.out_type, s.to.in_type, s.from.out_ease, s.to.in_ease]);
// The same for every key of a property. Used where segments() leaves the property out (an
// expression), so its pairs aren't compared above (usage notes, T023 check 9: Logo › Rotation).
const keysSignature = (p) => JSON.stringify(p.keys.map((k) => [k.time, k.in_type, k.out_type, k.in_ease, k.out_ease]));

// The first key whose value differs, or null. Snapshots from before values were recorded (and
// properties whose values aren't numbers) have no value to compare, so they never differ.
function changedValueAt(was, now) {
  for (let i = 0; i < was.keys.length; i++) {
    const a = was.keys[i].value;
    const b = now.keys[i].value;
    if (a == null || b == null) continue;
    if (JSON.stringify(a) !== JSON.stringify(b)) return was.keys[i].time;
  }
  return null;
}

function propsByKey(snapshot) {
  const map = new Map();
  for (const layer of snapshot.layers) for (const prop of layer.properties) map.set(`${layer.index}/${prop.path}`, { layer, prop });
  return map;
}

function unexpectedChanges(baseline, current, targets) {
  const notes = [];

  // Segment ids use layer indexes, so a renamed, added or reordered layer is worth saying out loud.
  const nowByIndex = new Map(current.layers.map((l) => [l.index, l]));
  for (const was of baseline.layers) {
    const now = nowByIndex.get(was.index);
    if (now && now.name !== was.name) notes.push(`Layer ${was.index} is now "${now.name}" (was "${was.name}")`);
  }

  const before = propsByKey(baseline);
  const after = propsByKey(current);
  // Properties with an untargeted pair whose motion changed.
  const segsAfter = new Map(segments(current).segments.map((s) => [s.id, s]));
  const touched = new Set();
  for (const s of segments(baseline).segments) {
    const now = segsAfter.get(s.id);
    if (!targets.has(s.id) && now && signature(s) !== signature(now)) touched.add(`${s.layer.index}/${s.prop.path}`);
  }

  for (const [key, { layer, prop }] of before) {
    const now = after.get(key);
    const label = propLabel(layer, prop);
    if (!now) { notes.push(`${label} no longer has keyframes`); continue; }
    if (now.prop.keys.length !== prop.keys.length) {
      notes.push(`${label} now has ${now.prop.keys.length} keys (was ${prop.keys.length})`);
      continue;
    }
    if (now.prop.expression_enabled !== prop.expression_enabled) {
      notes.push(`${label} expression was turned ${now.prop.expression_enabled ? "on" : "off"}`);
      continue;
    }
    const valueAt = changedValueAt(prop, now.prop);
    if (valueAt != null) notes.push(`${label} value changed at ${secs(valueAt)} s`);
    else if (touched.has(key)) notes.push(`${label} was changed (not part of this lesson)`);
    else if (prop.expression_enabled && prop.keys.length > 1 && keysSignature(prop) !== keysSignature(now.prop)) {
      notes.push(`${label} keys were changed (not part of this lesson). It has an expression, so this may not change the motion`);
    }
  }
  for (const [key, { layer, prop }] of after) {
    if (!before.has(key)) notes.push(`${propLabel(layer, prop)} is now animated (wasn't before)`);
  }
  return notes;
}

// The demo's fingerprint. set-ease.jsx applies influence 33.33 exactly; F9 (Easy Ease) applies
// 33.3333…, which snapshots record as 33.333. Real captures show both (eval fixtures after-demo,
// partial, title-done), so the demo can be told apart from the learner's own ease.
export const DEMO_INFLUENCE = 33.33;
const hasFingerprint = (eases) => Array.isArray(eases) && eases.length > 0 &&
  eases.every((e) => e && typeof e.influence === "number" && Math.abs(e.influence - DEMO_INFLUENCE) < 0.0005);
const knowsEase = (eases) => Array.isArray(eases) && eases.length > 0 && eases.every((e) => e && typeof e.influence === "number");

// Who the demo pair's ease belongs to right now:
//   "demo"     eased, and at least one facing side still has the demo's value. (F9 on a shared key
//              can overwrite the other side, as in the partial fixture, and the demo is still there.)
//   "redone"   eased, but neither side has the demo's value: the learner undid it and eased it again.
//   "gone"     not eased: the learner undid it (or changed it).
//   "unknown"  eased, but the snapshot has no ease values to compare. The mentor asks (SKILL.md).
function demoState(seg) {
  if (!seg || seg.state !== "eased") return "gone";
  if (!knowsEase(seg.from.out_ease) || !knowsEase(seg.to.in_ease)) return "unknown";
  return hasFingerprint(seg.from.out_ease) || hasFingerprint(seg.to.in_ease) ? "demo" : "redone";
}

// The demo pair is credited to the demo only while the demo is in place. Once a check has seen it
// undone, or its ease no longer carries the demo's fingerprint, it's the learner's pair from then
// on, so easing it again counts as their work (usage notes, panel session 1).
export function diff(baseline, current, session) {
  const demoSeg = session.demo ? session.demo.segment_id : null;
  const nowSegs = new Map(segments(current).segments.map((s) => [s.id, s]));
  const sameComp = current.comp.id === session.comp_id;
  const demoNow = demoSeg && sameComp && nowSegs.has(demoSeg) ? demoState(nowSegs.get(demoSeg)) : null;
  const demoUndone = !!(demoSeg && (session.demo.undone || demoNow === "gone" || demoNow === "redone"));
  const demoId = demoUndone ? null : demoSeg;
  const totalForLearner = session.targets.filter((id) => id !== demoId).length;

  if (current.comp.id !== session.comp_id) {
    return {
      comp_matches: false,
      lesson_comp: baseline.comp.name,
      targets: [],
      unexpected_changes: [],
      summary: { learner_eased: 0, still_linear: 0, partly_eased: 0, total_for_learner: totalForLearner },
      passed: false,
      demo_undone: !!(session.demo && session.demo.undone),
    };
  }

  const was = new Map(segments(baseline).segments.map((s) => [s.id, s]));
  const now = nowSegs;
  const targets = session.targets.map((id) => {
    const after = now.get(id);
    let result;
    if (!after) result = "removed";
    else if (after.state === "linear") result = "still_linear"; // includes an undone demo: it needs easing again
    else if (after.state === "partly_eased") result = "partly_eased";
    else result = id === demoId ? "eased_by_demo" : "eased_by_learner";
    const before = was.get(id);
    const t = { segment_id: id, label: before ? segLabel(before) : id, result };
    if (result === "partly_eased") {
      t.linear_end = linearEnd(after);
      t.linear_key_time = Number((t.linear_end === "start" ? after.from_time : after.to_time).toFixed(3));
    }
    if (id === demoSeg) {
      if (demoUndone) t.demo_undone = true;
      // How the check knows who eased it (C: "unknown" means the mentor asks the learner).
      t.demo_credit = demoUndone
        ? (session.demo.undone ? "learner_after_undo" : demoNow === "redone" ? "learner_redo" : "learner_after_undo")
        : demoNow === "unknown" ? "unknown" : "demo";
    }
    return t;
  });

  const summary = {
    learner_eased: targets.filter((t) => t.result === "eased_by_learner").length,
    still_linear: targets.filter((t) => t.result === "still_linear").length,
    partly_eased: targets.filter((t) => t.result === "partly_eased").length,
    total_for_learner: totalForLearner,
  };
  return {
    comp_matches: true,
    lesson_comp: baseline.comp.name,
    targets,
    unexpected_changes: unexpectedChanges(baseline, current, new Set(session.targets)),
    summary,
    passed: summary.still_linear === 0 && summary.partly_eased === 0,
    demo_undone: demoUndone,
  };
}
