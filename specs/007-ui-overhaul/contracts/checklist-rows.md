# Contract: tool codes to checklist rows

The README's per-skill table is the source for words and sections; this adds the code each word maps from.
**(D7)** marks a default for a word the README lacks, for the UI designer to confirm. Any code not listed reads "○ Not
checked yet", never a pass. "Passed" comes only from the tool's `passed`.

## Easing: `diff_since_last.targets[].result`

`eased_by_learner` ✓ Eased by you · `eased_by_demo` ✓ Demo · `still_linear` ✗ Still linear · `partly_eased` ◐ Half eased (detail from
`linear_key_time`) · `removed` ⊘ Keys changed · `unmatched` ⊘ Can't tell which. Outside: `unexpected_changes`. Count: `summary`.

## Key types: `key_types_check`

`pairs[].verdict`: `held_by_learner` ✓ Held by you · `held_by_demo` ✓ Demo · `not_held` ✗ Not held · `wrong_side` ◐ Hold on the wrong key ·
`removed_or_changed` ⊘ Keys changed · `expression` ⊘ Expression on it · `unmatched` ⊘ Can't tell which. **Meant to keep moving:**
`should_move_held[]` ✗ Now snaps. **Runs at constant speed:** `constant_speed.verdict`: `linear` ✓ Linear, stays · `not_linear` ✗ Not linear ·
`expression` ⊘ Expression. Outside: `extra_holds`, `other_changes`.

## Speed graph: `speed_graph_check.pairs[]`

`result` `passed`: `credit` `demo` ✓ Demo, else ✓ Shaped by you. `not_passed` by `mistake`: `not_shaped` ✗ Not shaped yet · `no_handle` ✗ No ease on a
key · `arrives_moving` ◐ Still moving as it lands · `back_to_default` ◐ Back to the default · `long_both_ends` ◐ Long at both ends · `in_out_mixed` ◐
Shaped the wrong side. `keys_changed`, `removed` ⊘ Keys changed · `unmatched` ⊘ Can't tell which. Detail: `dimension`. **You said it lands hard · left
out:** the snapshot's `landing_hard_labels`, ○ Your call. `fastest` is never shown. Outside: `other_changes`.

## Offset: `offset_check`

Row state from the group, since there's no per-member verdict. `status` `keys_changed` ⊘ Keys changed. Layers kind: in a `still_same` pair ✗ With [other];
`split` and `on_purpose` ✓ Split on purpose; `split` alone ? Split; else ✓ On its own. Properties kind: `lands_in_comp` false ◐ Lands past the end; in
`still_same` ✗ With [other]; else ✓ Apart. Detail: starts, `moved_by`, `credit`. Footer: `order_differs`. Group line: `gaps_frames`. Outside: `out_of_comp`,
`other_changes`. All ✓ doesn't mean passed.

## Pivot: `anchor_check.layers[]` (section: the layer)

- **Pivot:** `item1.passed` ✓ In place · `place_now` `between`, or `center` when not wanted, ◐ Near it · `outside` ✗ Outside, to its [`outside_side`] · another
  named place ✗ At [place] **(D7)**.
- **Layer stays:** `item2.passed` ✓ Stayed, else ✗ Moved [`direction`]. **At rest:** `item3.set_away_from_rest` ✗ Set away from rest.
- **Position keys** (if `item4`): ✓ Held, else ✗ Slid at [`worst.time`].
- **Others:** `item5.passed` ✓ Nothing did, else ✗ [layer] moved.
- `cant_check` ⊘ Can't check, on the row it names. No pixel numbers. Hint codes stay the mentor's.
- Outside: panel words for `other_changes` kinds: `layer_removed`, `renamed`, `eye_changed`, `anchor_changed`, `keys_added`, `layer_added`.

## Null: `null_parent_check` (sections open as `stage` reaches them)

- **The null:** `n1` and `n2` true ✓ 2D, no parent · `not_a_null` ✗ Not a null · `no_null` ✗ No null yet · `null_has_parent` ? Has a parent · `three_d` ✗ It's 3D **(D7)** ·
  `which_null` ? Which null? **(D7)** · `null_name_not_unique` ? Two layers share its name **(D7)** · `n3` ✓/✗ Pivot at [region].
- **The group, per layer:** `p1` true ✓ Follows [null] · `jumped` ✗ Jumped [px] [direction] · `wrong_parent`, `visible_parent` ✗ Follows [other] · `pickwhip_position` ◐ Position linked, not
  parented · `p3` false ✗ Its keys changed · `not_checked` ⊘ Couldn't check · `not_parented` ✗ Not parented yet **(D7)** · `focus_name_not_unique` ? Two layers share its name **(D7)** · `not_found` ⊘
  Not in the comp **(D7)**.
- **The move:** before `stage` `move` ○ After the group · `p4.passed` ✓ [property] · `opacity_move` ✗ Opacity doesn't carry · other failures ✗ No move yet · `region_needed` ? Where does it turn from? **(D7)**.
- **Worth a look · not graded:** `comments`. Outside: panel words for `other_changes` kinds.
- `graded: false`: the list stays as it was, marked as stale (FR-017).

## Every check tool

`comp_matches: false`, or a failed result with AE unreachable or busy: no new rows; the list is marked stale.
