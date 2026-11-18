# Contract: `describe_layers` (spec 015, OQ-2)

A read-only MCP tool in `mentor/tools/comp-reads.mjs`. Spec 015 owns its inputs, shapes and
statuses; spec 014 decides when the ask mode calls it and which skills list it in `allowed-tools`.
In this spec no skill lists it.

## Input

| Field | Type | Default | Notes |
|---|---|---|---|
| `layers` | array of int or string | none (whole comp) | Index, or a name. A name two layers share returns `NAME_SHARED` for that entry (FR-017). A name that's no layer's exact name is matched loosely (below) |
| `detail` | bool | false | false: summary shape; true: detail shape for the named layers |
| `at_time` | number | the comp's current time | Time for base and after-expression values (FR-003) |
| `comp_id` | int | the active comp | Phase 2 only: describe an inner comp's layers by id |

`detail: true` without `layers` is refused (`DETAIL_NEEDS_LAYERS`): detail is per layer by design
(FR-016).

## What it reads

One snapshot with `measure_layers` = the named layers plus every layer up their parent chains
(research R9), plus `sample_times: [at_time]`. Phase 2: when any named layer, or any parent, is a
precomp, or `comp_id` is given, one `precomp-contents` read.

## Output

```
{
  comp: { name, time },
  read: { expressions: "all" | not_read, links: "read" | not_read, sweeps: "fine" | "coarse" | not_read,
          shifts: "read" | not_read,                // FR-004a; not_read "not_asked" with no `layers`
          own_keys: "read", switches: "read" | not_read,   // FR-004b (Amendment 7)
          precomps: "read" | not_read },            // phase 1: precomps is always not_read
  layers: [ Layer summary | Layer detail | { asked, error: "NAME_SHARED", candidates: [{ layer_index, parent }] }
            | { asked, error: "NAME_PARTIAL", candidates: [{ layer_index, layer, parent }] }
            | { asked, error: "NOT_FOUND" } ],
  size: { bytes, cut: [layer names left out] }       // present only when the reply hit its cap
}
```

Layer summary and Layer detail: data-model § 6. `not_read` is `{ status: "not_read", reason }`.

**Loose names (added 2026-11-17, spec 014 T037 fix (h), answers 014's OQ-8):** a name with no exact
match (case-sensitive, as before) is matched loosely: the asked text, ignoring case, as a whole word or
words in a layer's name, so "rock" matches `rock.png` (the name without its extension) and `Rock
Shadow.png`, but not `Rocky.png`. All loose matches are one tier. One match resolves: that layer's entry is
a normal named entry (shifts included) plus `asked`, the text it was asked by, so the caller uses the real
`layer` name from then on. Two or more return `NAME_PARTIAL` with every candidate's `layer_index`, `layer`
name and `parent` name, in layer order; the caller asks which (014 FR-014's one clarifying question). No
match is `NOT_FOUND`. An exact name always wins, and an exact name two layers share is still
`NAME_SHARED` (FR-017).

**Footprint shift (FR-004a, added 2026-11-16):** each layer named in `layers` carries `shifts`, one
entry per parent-chain transform expression that moves it, with its peak shift in comp pixels on that
layer's box or `shift_px: null` with a reason (data-model § 6, research R15). Never a number in degrees
or percent in its place, and never 0 for "couldn't work it out". The fine sweep in this tool's snapshot
also records `max_value` (data-model § 1); no other snapshot sends `measure_layers`, so no skill's reply
changes. *Added 2026-11-16 (spec Amendment 9):* `reason` may also be `switch_not_read` (a 3D or
Auto-Orient switch in the chain that couldn't be read, never taken as off); `chain_moves` includes a
named layer whose box changes over time, and `direction_unknown` a Rotation source under non-uniform
scale (data-model § 6, research R15).

**Own keys and switches (FR-004b, added 2026-11-16):** every layer entry, summary and detail, carries
`own_keys` (each keyed property with its key count, `key_types` of `single_key`, `all_held`,
`none_held` or `some_held`, and `expression_on: true` when its expression is on) plus `locked`,
`three_d` and, on precomp and footage layers only, `collapse` (data-model § 6). A named layer always
carries them, `[]` and `false` included; the whole-comp summary carries `own_keys` only when non-empty
and a switch only when it's on, and `read.own_keys` and `read.switches` say that absence means none. A
switch that wasn't read is `not_read`, never `false`. Reply-only: `comp-reads.mjs` reads them from the
snapshot it already takes, and no snippet or skill reply changes.

**Ease (added 2026-11-17, spec 014 T037 fix (i)):** each `own_keys` entry also carries `ease`: `eased`,
`linear` or `mixed`, over its pairs that move. A pair that snaps (key types' `snaps`) doesn't move and
doesn't count; each other pair is rolled up by easing's own pair rule (`analyze.mjs` `segmentState`, the
one the easing lessons use): `eased` when every pair is eased at both ends (Easy Ease included), `linear`
when every pair is linear at both ends, and `mixed` otherwise (a partly eased pair, or eased and linear
pairs together). With no pair that moves (`single_key`, `all_held`) there's no `ease`. In a summary and in
detail, named and whole comp. Live Mentor Practice: Subtitle's Position is `eased`, its Opacity `mixed`.
About 16 bytes per keyed property; Comp 1's whole-comp summary stays under 12 KB.

**Links in (renamed 2026-11-17, spec 014 T037 fix (l)):** each link into a layer carries
`from_renders`, whether the **from layer** (the one holding the expression, which the link drives)
renders at the comp's current time: in a summary's `links_in.first[]` the bool (or `null` when not
read), in detail `{ renders, why, at_time }` (data-model § 2, Link). It was `target_renders`, with the
same value; the old name read as the linked layer's own state, which for a control null is always "doesn't
render". Comp 1: the one link into Sweep Control is from Black Solid 1, `from_renders: false` (eye off).

**When a shift shows (added 2026-11-18, spec 014 T037 fix (o)):** each `shifts` entry with a number also
carries `over_1px`: `{ from, until }` (seconds: the first sample at 1 px or more on the box, and the sample
after the last one), `{ from, until: null, to_end: true }`, `"never"`, or `{ status: "not_read", reason }`
(`older_snapshot`, `direction_unknown`, `not_sampled`), from the fine sweep's new `offsets` and
`offsets_every` (data-model § 1, § 6). No other snapshot sends `measure_layers`, so no skill's reply
changes. Captures from before this date have no `offsets`, so their spans are `older_snapshot` until
they're captured again.

**Children by name (added 2026-11-18, spec 014 T037 fix (p)):** a layer with 1 to 5 children also carries
`child_layers: [{ layer_index, layer }]` next to the `children` count, summary and detail, named and whole
comp; more than 5 is the count only (live Comp 1: Shake Control's 13). A reply never has to talk about a
child it can't name. At most about 35 bytes per layer in a whole-comp summary (data-model § 6).

## Limits (SC-007, research R11)

- Summary: ≤ 4 KB per layer with its sources; ≤ 12 KB for the whole comp. Over the cap, layers are
  dropped from the end and named in `size.cut`.
- Detail: expression text cut at 1,500 characters (`cut_short`, `full_length`); reply ≤ 16 KB.
- No expression text in the summary, ever.
- *Amended 2026-11-16 (merge `1499819`):* in a summary, a parent's `moves` is said once, on the
  parent's own entry. A child's parent entry omits `moves` when that parent is also in the reply, and
  keeps it when the parent isn't (for example, after a cut). `fit()` rebuilds the reply after each cut,
  so a child whose parent was cut gets `moves` back, and its size note counts against the cap. (Live
  Comp 1: 13,412 to 10,526 bytes.)
- Detail shows expression text and errors with `\n` line ends (AE 27.0 gives `\r`; spec E30).
- *Amended 2026-11-16 (Amendment 7, FR-004b):* a summary lists at most 8 own keyed properties per
  layer, then `own_keys_more`; detail lists all. The whole-comp summary leaves out empty `own_keys` and
  switches that are off: said in full on every layer, they'd add about 1.9 KB to Comp 1's 10.5 KB and
  break the 12 KB cap; left out, they add about 0.2 KB.

## Errors

The server's existing codes (`AE_UNREACHABLE`, `AE_BUSY`, `NO_ACTIVE_COMP`) and rule 2 apply. A
`comp_id` not in the project's precomp tree returns `COMP_NOT_FOUND`.

## Never

- Changes the project, the selection, the playhead or the active comp (FR-019).
- Writes the learner record (FR-020).
- Returns `none`, `[]` or `false` for a read that didn't run (FR-018).
