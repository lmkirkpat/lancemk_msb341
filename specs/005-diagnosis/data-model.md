# Data Model: Diagnosis (spec 005)

The spec's Key Entities, made concrete. Field names are internal: the mentor never shows them to the
learner (server rule 5). Times are seconds rounded to 3 decimals, as in the snapshot; frames are
whole comp frames.

## Catalogue entry (`mentor/curriculum/diagnosis.json`)

One per DX ID. Contract: [contracts/catalogue.md](contracts/catalogue.md).

| Field | Type | Notes |
|---|---|---|
| `id` | `"DX-01"` … `"DX-09"` | Fixed by the spec (FR-005) |
| `kind` | `style` \| `ask` \| `setting` \| `conflict` | `conflict` is unused until a later read (spec FR-005) |
| `story` | `US1` \| `US4` | DX-08 and DX-09 are off until US4 ships (`enabled: false`) |
| `enabled` | boolean | A disabled kind is never reported |
| `scope` | `comp` \| `layer` \| `property` \| `parent` | Research R4 |
| `rank_weight` | integer, 1 = first | Research R5; mirrors `teaching-design.md` |
| `thresholds` | object | Research R3, e.g. `{ "min_layers": 3, "tolerance_frames": 1, "min_share": 0.5 }` for DX-02 |
| `wording` | object of keys | `title_key`, `effect_key`, `question_key` (ask kinds and style kinds' "on purpose?"), `where_key` (the hint, for a kind with no skill **or** a lesson the learner turned down; every kind has one), `first_key` (optional: the start-here reason for that kind). Values are anchors in `teaching-design.md`, never prose here. Amended 2026-11-09 (SW-3, SB-1) |
| `may_be_intended` | boolean | True for every style and ask kind (FR-006): the skill asks before treating it as something to fix |

The skill map is **not** here: it's `mentor/curriculum/path.json › findings` (FR-010), mirrored from
`curriculum.md`.

## Finding

| Field | Type | Notes |
|---|---|---|
| `key` | string | DX ID + sorted layer names + property display path (research R7). Stable across reads and renumbering |
| `dx` | DX ID | |
| `kind` | from the catalogue | |
| `layers` | `[{ name, index }]` | Index for this read only; names are the identity |
| `property` | display path or null | Null for per-comp and per-parent kinds |
| `times` | `[{ start, end }]` or `[{ at }]` | Seconds, from the comp |
| `measures` | object | Kind-specific data, never sentences: DX-01 `{ pairs, partly_eased: [{ layer, property, linear_end }] }`; DX-02 `{ duration, layer_count, share }`; DX-04 `{ speed_before, speed_after, ratio }`; DX-05 `{ shape: "fade" \| "jump", values }` (`fade` = shape (a), `jump` = shape (b); amended 2026-11-09, SB-2); DX-07 `{ last_change, comp_duration, gap, expression_moving: [{ layer, property }] }` (amended 2026-11-09, SB-3) |
| `rank` | integer | 1-based, after symptom and weights |
| `start_here` | boolean | Exactly one true when there are findings |
| `skill` | `{ id, skill_name, built, learned, review_available }` or null | From `path.json › findings` and the built skills; null means no skill yet |
| `state` | `new` \| `open` \| `fixed` \| `still` \| `changed` \| `intended` \| `unmatched` | `new` on a first read; `open` once shown before; the rest from a re-read (research R7) |

**State changes**

```text
          first read            re-read: key present, same measures
  (none) ───────────► new ─────────────────────────────────────► still ─┐
                       │  re-read: key absent                           │
                       ├────────────────────────────► fixed             │
                       │  re-read: measures differ / other DX on same   │
                       ├────────────────────────────► changed ──────────┤ (each later re-read starts again
                       │  mark_intended                                 │  from the finding's current key)
                       └────────────────────────────► intended  (final for this comp; never raised again there)
  fixed ── re-read: key present again (an undo) ──► open   (edge case: "the learner undoes a fix")
```

## Not-checked list

| Field | Type | Notes |
|---|---|---|
| `set_aside` | `[{ layer, reason }]` | `hidden`, `guide`, `soloed_elsewhere`. Read, not compared |
| `not_checked` | `[{ what, layer?, standing? }]` | `what`: `precomp_inside`, `precomp_time` (remap or stretch), `parent_expression`, `comp_motion_blur` (unread), `expression_only_motion` (`standing: true`, always present) |

## Diagnosis (one result of `diagnose_comp`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | New on the first read of a comp, on `fresh: true`, or when the comp's last diagnosis is older than `recommend.mjs` › `SESSION_WINDOW_HOURS` (3 h); otherwise kept by re-reads and `check_finding` |
| `project`, `comp` | string | File name only (never a folder path), and comp name |
| `taken_at` | ISO time | From the snapshot |
| `symptom` | `{ layers, time }` or null | What the call passed; never the learner's words |
| `symptom_matched` | boolean or null | Null when no symptom was passed |
| `findings` | Finding[] | Ranked; intended findings left out |
| `top` | keys (≤ 3) | The first three by rank |
| `start_here`, `start_here_reason` | key; `depth` \| `symptom` \| `only_one` \| `all_questions` | Research R5 (amended 2026-11-09) |
| `more_count` | integer | `findings.length − top.length`, plus how many of those are ask |
| `scope` | Not-checked list | |
| `since` | `{ date, fixed, changed, intended, still }` or null | When an earlier diagnosis of this comp exists (FR-019, US3; `diagnosis.json` before US3) |
| `recommendation` | Recommendation or null | Research R10 |

## Recommendation

| Field | Type | Notes |
|---|---|---|
| `finding` | key | The start-here finding |
| `kind` | `lesson` \| `practice` \| `review` \| `not_teachable_yet` | |
| `skill`, `skill_name` | string or null | |
| `focus_layers` | string[] | The finding's layer names, passed on at hand-over |
| `pattern` | `{ dx, times_seen }` or null | US3: the same DX in two or more diagnoses |

## Open diagnosis file (`diagnosis.json`, learner home)

```json
{
  "version": 1,
  "comps": {
    "<project>|<comp name>": {
      "id": "…", "taken_at": "…",
      "findings": [{ "key": "…", "dx": "DX-04", "state": "open", "measures": { } }],
      "intended": [{ "key": "…", "date": "2026-11-10" }]
    }
  }
}
```

Read and written on every call; unreadable → set aside next to the original (`DIAGNOSIS_UNREADABLE`),
the diagnosis still runs and the skill says once that it couldn't read its notes (US3 › 5).

## Diagnosis record (`learner.json › diagnoses`, US3)

One entry per diagnosis `id`, upserted after each complete tool call (research R9). Version stays 1.

| Field | Type | Notes |
|---|---|---|
| `id`, `date` | string, ISO | |
| `project`, `comp` | string | As the lesson entries store them |
| `findings` | `[{ dx, layers, property, times, state }]` | Names and times only (FR-017) |
| `recommended` | `{ kind, skill }` or null | One next thing (FR-017) |

**Validation**: no free-text field exists (FR-018). Layer and property names pass the existing
email and phone check or the save is refused (`UNSAFE_RECORD`). `skills`, `lessons` and `marks` are
never written by this path (FR-021).
