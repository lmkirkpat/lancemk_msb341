// Spec 015's read tool for the ask mode, describe_layers (contracts/describe-layers.md, OQ-2; research
// R10, R11). Read-only: one or two snapshots, never a write snippet, and never the learner record
// (FR-019, FR-020). No skill lists it yet; spec 014 decides who calls it, so this file exports TOOLS
// and no SKILLS.
//
// Two shapes (FR-016): a summary per layer, with no expression text ever, and a detail for named
// layers with each expression's text cut at 1,500 characters. "Not read" is always explicit
// (FR-018). Phase 1 never reads inside precomps: read.precomps is always not_read.

import { MentorError, registerErrors } from "../errors.mjs";
import { byIndex, layerInfo } from "../lib/layer-info.mjs";
import { expressionReads, expressionsRead, linksIn, rawExpression, valuesAt } from "../lib/expressions.mjs";
import { motionSources } from "../lib/motion-sources.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";

registerErrors({
  DETAIL_NEEDS_LAYERS: "Detail is for named layers. Name the layers you want in detail, or ask for the summary of the whole comp.",
});

// The reads, through one object so tests can watch what each call asks for.
export const io = { takeSnapshot };

export const LIMITS = { layer_bytes: 4096, summary_bytes: 12288, detail_bytes: 16384, text_chars: 1500 };
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const notRead = (reason) => ({ status: "not_read", reason });
const bytes = (v) => Buffer.byteLength(JSON.stringify(v), "utf8");
const textReply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

// Each asked entry as a layer index, or an error entry (FR-017: a shared name returns the candidates).
function resolveAsked(snapshot, asked) {
  const layers = layerInfo(snapshot).layers;
  return asked.map((a) => {
    if (typeof a === "number") {
      const l = layers.find((x) => x.index === a);
      return l ? { index: l.index } : { asked: a, error: "NOT_FOUND" };
    }
    const same = layers.filter((x) => x.name === a);
    if (same.length === 1) return { index: same[0].index };
    if (same.length > 1) {
      const nameOf = (i) => (i == null ? null : (layers.find((x) => x.index === i) || {}).name ?? null);
      return { asked: a, error: "NAME_SHARED", candidates: same.map((l) => ({ layer_index: l.index, parent: nameOf(l.parent) })) };
    }
    return { asked: a, error: "NOT_FOUND" };
  });
}

// The layers asked for plus every layer up their Parent chains (research R9's fine sweeps).
function withParents(snapshot, indexes) {
  const out = new Set();
  for (const i of indexes) {
    const seen = new Set();
    for (let l = byIndex(snapshot, i); l && !seen.has(l.index); l = l.parent == null ? null : byIndex(snapshot, l.parent)) {
      seen.add(l.index);
      out.add(l.index);
    }
  }
  return [...out].sort((a, b) => a - b);
}

function exprSummary(x) {
  return { property: x.property, group: x.group, on: x.on, error: !!x.error, builds_on: x.builds_on, moves: x.moves };
}

function summaryOf(entry, ctx) {
  const { map, links, exprOf } = ctx;
  const m = map.layers.find((l) => l.layer_index === entry.index);
  const li = links.get(entry.index);
  const mine = exprOf.get(entry.index) || [];
  const refsOut = mine.reduce((n, x) => n + x.refs.length, 0);
  return {
    layer_index: entry.index,
    layer: entry.name,
    kind: entry.kind,
    class: m ? m.class : null,
    parents: m && Array.isArray(m.parents)
      ? m.parents.map((p) => ({ layer_index: p.layer_index, layer: p.layer, class: p.class, moves_children: p.moves_children, moves_by: p.moves_by ?? null, expressions: (exprOf.get(p.layer_index) || []).filter((x) => x.active).map((x) => ({ property: x.property, moves: x.moves })) }))
      : notRead("no_layer_info"),
    children: m && Array.isArray(m.children) ? m.children.length : notRead("no_layer_info"),
    effects: Array.isArray(entry.effects) ? entry.effects.map((f) => f.name) : notRead(entry.effects === undefined ? "older_snapshot" : "error"),
    expressions: ctx.exprRead === "all" ? mine.map(exprSummary) : ctx.exprRead,
    links_in: li && li.status === "read"
      ? { count: li.links.length, first: li.links.slice(0, 3).map((l) => ({ from_layer: l.from_layer, from_property: l.from_property, property: l.property, inferred: true, target_renders: l.target_renders.renders })), unresolved_in_comp: li.unresolved_in_comp }
      : li || notRead("older_snapshot"),
    refs_out: ctx.exprRead === "all" ? refsOut : ctx.exprRead,
    precomp: entry.kind === "precomp" ? notRead("phase_2") : "not_a_precomp",
  };
}

function detailOf(entry, ctx, snapshot, atTime) {
  const s = summaryOf(entry, ctx);
  const mine = ctx.exprOf.get(entry.index) || [];
  const li = ctx.links.get(entry.index);
  return {
    ...s,
    expressions: ctx.exprRead === "all"
      ? mine.map((x) => {
        const raw = rawExpression(snapshot, x.layer_index, x.path);
        const full = raw ? raw.text_length : 0;
        const text = raw ? raw.text : "";
        const cut = text.length > LIMITS.text_chars || (raw && raw.text_cut);
        return {
          ...exprSummary(x),
          display_path: x.display_path,
          keys: x.keys,
          error: x.error,
          text: text.slice(0, LIMITS.text_chars),
          cut_short: !!cut,
          full_length: full,
          values: isNum(atTime) && raw ? valuesAt(snapshot, raw, atTime) : notRead("no_time"),
          refs: x.refs,
        };
      })
      : ctx.exprRead,
    links_in: li && li.status === "read" ? { ...li, links: li.links } : li || notRead("older_snapshot"),
  };
}

function sweepsRead(snapshot, measured) {
  if (!Array.isArray(snapshot.expression_sweeps)) return notRead("older_snapshot");
  const missing = (snapshot.fine_not_read || []).filter((f) => measured.includes(f.layer));
  if (missing.length) return { status: "not_read", reason: missing[0].reason, coarse: "read" };
  return measured.length ? "fine" : "coarse";
}

// Drops layers from the end until the reply fits, naming each one left out.
function fit(reply, cap) {
  const cut = [];
  while (bytes(reply) > cap && reply.layers.length > 1) {
    const l = reply.layers.pop();
    cut.unshift(l.layer ?? l.asked);
  }
  if (cut.length) reply.size = { bytes: bytes(reply), cut };
  return reply;
}

export async function describeLayers({ layers: asked, detail = false, at_time } = {}) {
  if (detail && !(Array.isArray(asked) && asked.length)) throw new MentorError("DETAIL_NEEDS_LAYERS");
  const times = isNum(at_time) ? { sample_times: [at_time] } : {};
  let snapshot = await io.takeSnapshot(times);
  const named = Array.isArray(asked) && asked.length ? resolveAsked(snapshot, asked) : null;
  const indexes = named ? named.filter((e) => e.index != null).map((e) => e.index) : [];
  let measured = [];
  if (indexes.length && expressionsRead(snapshot) === "all") {
    const chain = withParents(snapshot, indexes);
    const swept = new Set(snapshot.expressions.filter((x) => x.active && x.group === "transform").map((x) => x.layer));
    measured = chain.filter((i) => swept.has(i));
    if (measured.length) snapshot = await io.takeSnapshot({ ...times, measure_layers: measured });
  }
  const atTime = isNum(at_time) ? at_time : snapshot.comp.time;
  const exprRead = expressionsRead(snapshot);
  const er = expressionReads(snapshot);
  const exprOf = new Map();
  for (const x of er.list) exprOf.set(x.layer_index, [...(exprOf.get(x.layer_index) || []), x]);
  const ctx = { map: motionSources(snapshot), links: linksIn(snapshot, { time: atTime }), exprOf, exprRead };
  const read = {
    expressions: exprRead,
    links: exprRead === "all" ? "read" : exprRead,
    sweeps: sweepsRead(snapshot, measured),
    precomps: notRead("phase_2"),
  };
  const entries = named
    ? named.map((e) => (e.index == null ? e : byIndex(snapshot, e.index)))
    : layerInfo(snapshot).layers;
  const out = entries.map((e) => (e.error ? e : detail ? detailOf(e, ctx, snapshot, atTime) : summaryOf(e, ctx)));
  const reply = { comp: { name: snapshot.comp.name, time: snapshot.comp.time }, read, layers: out };
  return textReply(fit(reply, detail ? LIMITS.detail_bytes : LIMITS.summary_bytes));
}

export const TOOLS = [
  {
    name: "describe_layers",
    title: "Describe layers",
    description:
      "Read-only. What moves the active comp's layers: expressions on any property (on, error, whether each builds on its own " +
      "value, how far it moves), what links to each layer and whether that shows, effects, and parents. Omit layers for a " +
      "summary of the whole comp; name layers (index, or a name only one layer has) for their summary, or with detail for " +
      "each expression's text. Links and builds-on are inferred from the text. It can't see inside precomps yet.",
    inputSchema: {
      type: "object",
      properties: {
        layers: { type: "array", items: { type: ["integer", "string"] }, description: "Layer indexes or names. Omit for the whole comp." },
        detail: { type: "boolean", description: "Each named layer's expression text, errors, links and references. Needs layers." },
        at_time: { type: "number", minimum: 0, description: "Seconds: the time for values before and after each expression. Default: the playhead." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: describeLayers,
  },
];
