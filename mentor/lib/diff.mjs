// FR-007: compare the comp now with the lesson baseline, by segment id (data-model.md › Check result).
// Only the lesson's targets are graded; anything else that changed is listed in plain language.

import { segments } from "./analyze.mjs";

const SEP = " › ";
const secs = (t) => String(Number(t.toFixed(3)));
const propLabel = (layer, prop) => `${layer.name}${SEP}${prop.display_name}`;
const segLabel = (s) => `${propLabel(s.layer, s.prop)} ${secs(s.from_time)}–${secs(s.to_time)} s`;

// What a pair's motion depends on: its times and the two sides that face each other.
const signature = (s) => JSON.stringify([s.from_time, s.to_time, s.from.out_type, s.to.in_type, s.from.out_ease, s.to.in_ease]);

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
    if (touched.has(key)) notes.push(`${label} was changed (not part of this lesson)`);
  }
  for (const [key, { layer, prop }] of after) {
    if (!before.has(key)) notes.push(`${propLabel(layer, prop)} is now animated (wasn't before)`);
  }
  return notes;
}

export function diff(baseline, current, session) {
  const demoId = session.demo ? session.demo.segment_id : null;
  const totalForLearner = session.targets.filter((id) => id !== demoId).length;

  if (current.comp.id !== session.comp_id) {
    return {
      comp_matches: false,
      lesson_comp: baseline.comp.name,
      targets: [],
      unexpected_changes: [],
      summary: { learner_eased: 0, still_linear: 0, total_for_learner: totalForLearner },
      passed: false,
    };
  }

  const was = new Map(segments(baseline).segments.map((s) => [s.id, s]));
  const now = new Map(segments(current).segments.map((s) => [s.id, s]));
  const targets = session.targets.map((id) => {
    const after = now.get(id);
    let result;
    if (!after) result = "removed";
    else if (after.state === "linear") result = "still_linear"; // includes an undone demo: it needs easing again
    else result = id === demoId ? "eased_by_demo" : "eased_by_learner";
    const before = was.get(id);
    return { segment_id: id, label: before ? segLabel(before) : id, result };
  });

  const summary = {
    learner_eased: targets.filter((t) => t.result === "eased_by_learner").length,
    still_linear: targets.filter((t) => t.result === "still_linear").length,
    total_for_learner: totalForLearner,
  };
  return {
    comp_matches: true,
    lesson_comp: baseline.comp.name,
    targets,
    unexpected_changes: unexpectedChanges(baseline, current, new Set(session.targets)),
    summary,
    passed: summary.still_linear === 0,
  };
}
