# Research: the mockup's claims against the code (spec 007, 2026-11-02)

Read from the code on branch `007-plan` (cut from `ebdceb0`). "Ran" means executed; everything else
was read. Nothing here touched After Effects.

## R1. Can each skill's rows come from existing tool results? Yes, with no mentor change

| Skill | Opening rows | Check rows | Note |
|---|---|---|---|
| Easing | `snapshot_project.targets` are ids; labels join from `findings[].segments[]` | `diff_since_last.targets[]`: `label`, `result` | `findings` is read from the comp now, so a pair already eased drops out on a re-read. The panel keeps labels by id for the lesson |
| Key types | Empty until the learner names a focus, then `target_pairs` | `key_types_check.pairs[]`: `id`, `label`, `verdict` | The check has no layer field; sections join by id to `target_pairs` |
| Speed graph | `pairs` (capped) | `speed_graph_check.pairs[]`: `id`, `label`, `result`, `mistake` | Same join. All six `mistake` codes in the README exist. `landing_hard_labels` comes from the snapshot |
| Offset | `group.members` | `offset_check.members[]`, `still_same`, `order_differs`, `out_of_comp`, `gaps_frames` | No per-member verdict, as the README says |
| Pivot | Empty until a focus, then `focus` | `anchor_check.layers[]`: `item1` to `item5`, `cant_check` | See R3 for one missing word |
| Null | Empty until a focus, then `focus` | `null_parent_check`: `null`, `layers[]`, `stage`, `hints`, `comments`, `graded` | See R3 |

`mode` is on the five snapshot tools with a review; easing has none and is always a lesson.
`no_new_target` reaches all five. Every demo tool returns enough for the Changed box.

## R2. Can `recommend_next` suggest the pivot and null? Yes (ran)

`recommend()` was run with the real `path.json`:

| Record | Recommends |
|---|---|
| Easing, key types, speed graph and offset learned | `transform.anchor` |
| Those plus the pivot learned | `parenting.null` |
| Nothing learned, comp with only pivot candidates (stand-in finders) | `transform.anchor` |

So the missing table rows can be reached, even by a new learner. PN-17 is a real bug.

## R3. Row words the README's table doesn't cover

Panel-only, and defaults are in [contracts/checklist-rows.md](contracts/checklist-rows.md); sent to the
designer as D7.

- **Pivot:** `item1.place_now` can be another named place. "Near it" fits `between`, and `center` when
  center wasn't wanted (the tool's own `not_moved_enough` rule). A different named place
  (`neighbour_place`) has no word.
- **Null:** `three_d`, `region_needed`, `null_name_not_unique`, `focus_name_not_unique`, `which_null`
  and `not_found` have no word. Under the "unknown reads Not checked yet" rule, a real failure would
  read as unchecked.

## R4. The mockup's claims that don't hold

| # | Claim or assumption | What the code says | Handling |
|---|---|---|---|
| 1 | `:has` and `@container` for short docks | AE 26.5's CEP is 12.0.1.2 with CEF 99.2.15 (Chromium 99), read from the app bundle. Both arrived in Chromium 105 | Plan P4 |
| 2 | "A small eval cost, next-mentor's cases only" | `product/evals/` has no next-mentor set, and every runner passes `--tools ToolSearch`, so none allows the hand-over | New set (Open question 7) |
| 3 | Panel hand-over works | `adapter-claude-code.js` passes `--tools ToolSearch`, which leaves out `Skill`. The panel has never run a hand-over | Plan P3; a check comes first |
| 4 | Show me again is one request | Its text says "the pair you already eased". No `SKILL.md` mentions it. It's wrong for five skills | Open question 8 |
| 5 | "Start fresh" and End lesson | `session.start` keeps one lesson per skill and comp until it passes. With a demo or check it's never stale, and `fresh` is refused (`LESSON_UNDERWAY`). The next lesson resumes it | FR-092, Open question 6 |
| 6 | `home-unreadable` from the record alone | `readJson` renames a broken file to `learner.json.unreadable-<time>` on the mentor's first read. After that the file is missing, which looks like a first run | FR-095 |
| 7 | "Warm-up due" is safe from `review_due` | Easing's record gets a `review_due` too, with no review mode | Gated on the review flag (FR-021) |
| 8 | Status lines and allowlist | `MENTOR_TOOLS` and `activity.js` hold easing's tools only | R6 |
| 9 | Stale .7 figure, "5.2:1", floor .63 | Ran: `#c8c8c8` at .7 is 5.38 on `#232323`, 5.18 on `#262626`, 4.97 on `#2b2b2b`. Floor .63 holds only on `#262626` or darker (4.32 on `#2b2b2b`) | .7 passes on all three; the test computes from the real background |
| 10 | `lesson-error-demo` copy | "the demo pair is already eased" fits easing only | D8 |
| 11 | Check setup button | Its screen is spec 006's, held | No button this build (D9) |
| 12 | Manifest | `MinSize` height is 400; the spec's floor is 480 | Open question 9 |
| 13 | Timeline positioning | `contrast.test.js` bans `.style` and `style=` in panel scripts, to stop inline font sizes. Offset's diamonds need a position | Narrow the test to font sizes (T010) |
| 14 | `lesson-partial` is the only non-pass ending | A skill can record `result: partial` when the learner stops, with `saved: true` and no pass | D6 |
| 15 | The stored version has "no eval re-run" | `read_learner_record` returns the whole record, so easing and next-mentor would see a new field | Noted in FR-093 |

## R5. FR-030's third case: can B1 tell the same? No

On A the helper sends `tool_call` only once the model's whole answer is in, and only for calls that will
run (helper protocol). On B1, `stream.js` emits `tool_call` when it reads the `assistant` line from Claude
Code's output. Nothing promises that line arrives before the tool starts, or that it survives a process
dying mid-write. So "no `tool_call` seen" doesn't prove "no demo started".

**Also:** B1's timeout ends the turn in the adapter but leaves the process running, so a demo could still
run after the panel stopped waiting, and a retry would be written to a process still working. Try again on
B1 must stop the process and resume the session first.

**Rule:** each adapter says whether it makes the promise (`announcesCalls`: A true, B1 false). On B1, no
result always means the check. `assertCanDemo`'s `DEMO_USED` backstops both.

## R6. Does option A's helper have the same gap? Half

- **Allowlist: no.** `helper/lib/skills.mjs` reads each skill's `allowed-tools` from its `SKILL.md`, and
  the loop swaps the list at a hand-over. The gap is B1's.
- **Status lines: yes.** `activity.js` is the panel's, used on both runtimes.
- **A's hand-over** still waits on spec 013's T060, which doesn't block this build.

## R7. How often does `lesson-focus-stale` happen? (ran; README Open question 5)

Counted from stored eval transcripts, first run of each case: easing `2026-10-29-142512`, speed graph
`2026-10-29-142640`, offset `2026-10-29-144419`. These are scripted turns, so it's a rough guide, not a
live rate.

| Skill | Second turns after an opening read | Re-read | Went to a check | Neither |
|---|---|---|---|---|
| Easing | 24 | 24 | 0 | 0 |
| Speed graph | 23 | 6 | 6 | 11 |
| Offset | 31 | 27 | 0 | 4 |

"Neither" is mostly harmless: speed graph's and offset's rows are already the proposal, so "Sounds good"
changes nothing. By their wording, speed graph 06 ("Can we shape Logo's Rotation instead?") and offset 01
("Title's three properties, please.") are the ones where rows could really be out of date; I didn't read
those turns further. That's about 2 of 78, and none on easing, whose opening rows are the widest. SC-014
counts the live rate.

## R8. Offset's scale

See plan P5. Comp length is rejected: at about 220 px of track on a 10 s comp, a 4-frame gap at 30 fps is
about 3 px, narrower than the 7 px diamond, so the stagger the picture exists to show wouldn't read.

## R9. `/health` is enough for the connection mark

`bridge/cep/host.js` already reads it three ways: an answer, nothing listening, and no answer within 2 s
("AE may be busy"). `bridge-status.js` flattens these to null today. No bridge change is needed.
