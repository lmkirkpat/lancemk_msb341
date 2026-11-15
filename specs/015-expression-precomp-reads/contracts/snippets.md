# Contract: snippet changes (spec 015)

Both snippets are ES3, read-only, run through `mentor/bridge-client.mjs` (constitution II: fixed
snippets, no script text from the model). Each read is wrapped so one failure gives a `not_read`
status and the rest still returns, as `snapshot.jsx` does today.

## `snapshot.jsx` (phase 1)

**New args** (all optional; with none, the snippet behaves as today plus the new fields):

| Arg | Type | Effect |
|---|---|---|
| `sample_times` | number[] | unchanged |
| `measure_layers` | int[] | fine sweeps (research R9) for these layers' active transform expressions |

**New output fields:** `expressions`, `expressions_read`, `expression_sweeps`, and
`layer_info[].effects`, `layer_info[].samples[].base` (data-model § 1). No existing field changes shape or value.

**Budget:** the new passes add ≤ 0.5 s on Comp 1 and Mentor Practice (SC-008), measured live in
T033 with `capture.mjs --time`.

## `precomp-contents.jsx` (phase 2, new)

**Args:** `{ comp_id?: int, max_depth?: int (default 5) }`. Without `comp_id`, starts from the active
comp's precomp layers.

**Output:** `{ root_comp_id, comps: { [comp_id]: Comp contents }, mappings: [Time mapping],
read: { status, depth_limit, loops: [comp_id], too_deep: [comp_id] } }` (data-model § 7).

**Budget:** whole-project read of Comp 1 ≤ 1.5 s (SC-013), measured live in T053.

## Fixture mode

- `snapshot`: returns the saved fixture. Saved `expression_sweeps` of kind `fine` are returned only for
  the layers the fixture was captured with; others read `not_read: fixture`.
- `precomp-contents`: a fixture twin loads the companion file named by the state file's `contents`
  key; with none, it returns `{ read: { status: "not_read", reason: "fixture" } }`.
