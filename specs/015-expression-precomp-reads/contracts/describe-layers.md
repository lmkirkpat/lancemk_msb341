# Contract: `describe_layers` (spec 015, OQ-2)

A read-only MCP tool in `mentor/tools/comp-reads.mjs`. Spec 015 owns its inputs, shapes and
statuses; spec 014 decides when the ask mode calls it and which skills list it in `allowed-tools`.
In this spec no skill lists it.

## Input

| Field | Type | Default | Notes |
|---|---|---|---|
| `layers` | array of int or string | none (whole comp) | Index, or a name. A name two layers share returns `NAME_SHARED` for that entry (FR-017) |
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
          precomps: "read" | not_read },            // phase 1: precomps is always not_read
  layers: [ Layer summary | Layer detail | { asked, error: "NAME_SHARED", candidates: [{ layer_index, parent }] }
            | { asked, error: "NOT_FOUND" } ],
  size: { bytes, cut: [layer names left out] }       // present only when the reply hit its cap
}
```

Layer summary and Layer detail: data-model § 6. `not_read` is `{ status: "not_read", reason }`.

## Limits (SC-007, research R11)

- Summary: ≤ 4 KB per layer with its sources; ≤ 12 KB for the whole comp. Over the cap, layers are
  dropped from the end and named in `size.cut`.
- Detail: expression text cut at 1,500 characters (`cut_short`, `full_length`); reply ≤ 16 KB.
- No expression text in the summary, ever.

## Errors

The server's existing codes (`AE_UNREACHABLE`, `AE_BUSY`, `NO_ACTIVE_COMP`) and rule 2 apply. A
`comp_id` not in the project's precomp tree returns `COMP_NOT_FOUND`.

## Never

- Changes the project, the selection, the playhead or the active comp (FR-019).
- Writes the learner record (FR-020).
- Returns `none`, `[]` or `false` for a read that didn't run (FR-018).
