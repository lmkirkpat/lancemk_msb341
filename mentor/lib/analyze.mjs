// FR-002: from a snapshot to the lesson's findings, targets and demo target (research R7,
// data-model.md › Segment). Pure and deterministic, so the answer key can prove it (SC-001).

import { MentorError } from "../errors.mjs";

// Hold first: a hold out side means the value jumps, so there's no motion to ease, whatever the
// next key's in side says. Both sides linear is "linear". Exactly one linear side is "partly_eased":
// the motion eases at one end but still starts or stops hard at the other (usage notes, panel
// session 1), so it still needs easing and never counts as done.
export function segmentState(from, to) {
  if (from.out_type === "hold") return "held";
  const startLinear = from.out_type === "linear";
  const endLinear = to.in_type === "linear";
  if (startLinear && endLinear) return "linear";
  if (startLinear || endLinear) return "partly_eased";
  return "eased";
}

// Which end of a partly eased pair is still linear: "start" (the first key's out side) or "end".
export function linearEnd(s) {
  if (s.state !== "partly_eased") return null;
  return s.from.out_type === "linear" ? "start" : "end";
}

// Pairs a lesson can target: anything still linear at either end.
export const needsEase = (state) => state === "linear" || state === "partly_eased";

export const segmentId = (layer, prop, i) => `${layer.index}/${prop.path}/${i}`;

// Every analyzable pair in layer, property and key order, plus what was skipped and why.
export function segments(snapshot) {
  const out = [];
  const skipped = [];
  for (const layer of snapshot.layers) {
    for (const prop of layer.properties) {
      const reason = prop.expression_enabled ? "expression" : prop.keys.length < 2 ? "single_key" : null;
      if (reason) {
        skipped.push({
          layer: layer.name, layer_index: layer.index, property: prop.display_name,
          path: prop.path, display_path: prop.display_path, reason,
        });
        continue;
      }
      for (let i = 1; i < prop.keys.length; i++) {
        const from = prop.keys[i - 1];
        const to = prop.keys[i];
        out.push({
          id: segmentId(layer, prop, i),
          layer, prop, from, to,
          display_path: prop.display_path,
          from_time: from.time,
          to_time: to.time,
          state: segmentState(from, to),
        });
      }
    }
  }
  return { segments: out, skipped };
}

export function analyze(snapshot, { focus_layers } = {}) {
  const focus = focus_layers && focus_layers.length ? [...focus_layers] : null;
  if (focus) {
    const known = new Set([...snapshot.layers.map((l) => l.name), ...snapshot.precomp_layers.map((l) => l.name)]);
    const unknown = focus.filter((name) => !known.has(name));
    if (unknown.length) {
      throw new MentorError("UNKNOWN_LAYER", `No layer named ${unknown.map((n) => `"${n}"`).join(", ")} in this comp. ` +
        "Use a layer name exactly as it appears in the findings.");
    }
  }

  const { segments: all, skipped } = segments(snapshot);
  const counts = { linear: 0, partly_eased: 0, eased: 0, held: 0 };
  for (const s of all) counts[s.state]++;

  // Findings: linear pairs grouped by layer and property, in snapshot order.
  const findings = [];
  for (const s of all) {
    if (!needsEase(s.state)) continue;
    let group = findings[findings.length - 1];
    if (!group || group._layer !== s.layer || group._prop !== s.prop) {
      group = { _layer: s.layer, _prop: s.prop, layer: s.layer.name, property: s.prop.display_name, segments: [] };
      findings.push(group);
    }
    const seg = { id: s.id, display_path: s.display_path, from_time: s.from_time, to_time: s.to_time, state: s.state };
    if (s.state === "partly_eased") seg.linear_end = linearEnd(s);
    group.segments.push(seg);
  }

  const inFocus = (s) => !focus || focus.includes(s.layer.name);
  const targetSegments = all.filter((s) => needsEase(s.state) && inFocus(s));
  // The demo has to be somewhere the learner can see it: never a hidden layer or a null. And it
  // must never take the learner's only pair: with one target there's no demo (FR-006, usage notes
  // panel session 1), and the mentor walks the learner through it instead.
  const visible = targetSegments.find((s) => s.layer.enabled && !s.layer.is_null);
  const demo = targetSegments.length >= 2 ? visible : null;
  const noDemoReason = demo ? null : targetSegments.length === 0 ? "nothing_to_ease" : targetSegments.length === 1 ? "single_pair" : "no_visible_layer";

  return {
    findings: findings.map(({ _layer, _prop, ...f }) => f),
    skipped,
    hidden_layers: snapshot.layers.filter((l) => !l.enabled).map((l) => l.name),
    precomp_layers: snapshot.precomp_layers.map((l) => l.name),
    focus,
    targets: targetSegments.map((s) => s.id),
    demo_target: demo ? demo.id : null,
    no_demo_reason: noDemoReason,
    counts,
  };
}
