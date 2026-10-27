# Quickstart: validating skill 1, key types (spec 009)

**Status**: Draft, awaiting the builder's approval. § 1 runs in the cloud container; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), in order; § 6 is a day or more later. Spec 004's
[quickstart.md](../004-ae-curriculum/quickstart.md) covers the shared branch.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                                # green on stand-ins
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

Run `/agent-audit` on `.claude/skills/key-types-mentor/SKILL.md`. Hand back; the cockpit makes the
branch available on the Mac.

## 2. 🖐 Live checks L-1 to L-4 (before `SKILL.md`'s wording and the snippet are final, FR-024)

Setup: After Effects 26.5 on `discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one
skill-builder in this branch's local worktree holds the AE lock (not during spec 008's or 010's
sitting). Duplicate Mentor Practice 2 and plant on the duplicate only. The builder does the hand
actions; the agent reads with `node mentor/dev/capture.mjs` and logs every answer.

| Check | Do | Log |
|---|---|---|
| L-4 | `capture.mjs --compare mentor/test/fixtures/layer-info/practice2b.json` on Mentor Practice 2 (2026-10-26: Mentor Practice 2 as built has spec 004's 2b layers, so `practice2-before.json` no longer matches) | "Matches"; Blink, Spinner and Cut present with key values (FR-021) |
| L-1 | On the duplicate, a Blink pair with the first key linear out and the second key hold in; scrub frames inside the pair | Whether the value travels or jumps (decides row 6's hint and SR-2) |
| L-2 | Animation > Toggle Hold Keyframe on one Blink key, then read; open the key's right-click menu; find Keyframe Interpolation | Which sides it sets (out only or both, as the snapshot reads them); the menu places and the Mac shortcut shown on the menu; where Temporal Interpolation: Linear is |
| L-3 | Undo L-2's toggle, run `key_types_demo` on the same pair (temp `AE_MENTOR_HOME`; `key_types_snapshot` with `skill_options.focus` on Blink › Opacity first), read; compare with a hand toggle on the next pair | Same key icon, same types read back; one Edit > Undo restores it |

If L-2 shows both sides, set `HOLD_SIDES = "both"` in the desk block (§ 4) and repeat L-3 then.

**Done 2026-10-26** ([`live-sitting-2026-10-26.md`](live-sitting-2026-10-26.md); results in spec ›
Live checks): L-1 jumps at the first key (SR-2); L-2 out side only, ⌃⌥⌘H and ⌥⌘K; L-3 the same as a
hand toggle, influence 16.667 included (After Effects sets it), one undo restores; L-4 matches
`practice2b.json`.

## 3. 🖐 Captures (same duplicate; the practice blink on a duplicate of Mentor Practice)

Saved as `mentor/test/fixtures/key-types/<name>.json`; names match `answer-key.json`.

| File | Shape (overlap row) |
|---|---|
| `practice-now.json` | Mentor Practice itself, as it is (FR-008: Title and Subtitle Opacity candidates, the Cursor held, Logo's expression) |
| `blink-one-held.json`, `blink-all-held.json` | One Blink pair held; every Blink pair held (KT-d, pass) |
| `select-all-hold.json` | Blink, Cut, Card and Pause all held, select-all style (rows 16, 19, KT-f). Title isn't on Mentor Practice 2, so the builder's stand-in uses these layers (2026-10-21) |
| `overlap-layers.json` | A precomp's own Opacity, hidden layers, a matte with its eye off, a null, a linear 0 to 100 fade, a pause-only property (rows 10, 11, 13, 14, 16, 21; added 2026-10-21, the builder's stand-in). Captured live 2026-10-26 with no unknown-values layer (see the row 22 line below) |
| `wrong-side.json` | Blink's second key held on its in side only (FR-011). Per L-1 the 1 to 1.4 s pair snaps, at 1 s |
| `mixed-pair.json` | L-1's shape |
| `separated-x-held.json` | A separated Position with X held and Y not (row 7) |
| `hold-at-zero.json` | Blink held at Opacity 0 (row 12) |
| `loopout-blink.json` | A blink with `loopOut()` on (row 1) |
| `hold-only-effect.json` | A checkbox effect parameter and Source Text keyed (row 8) |
| `nested-opacity.json` | A shape fill's and a text animator's Opacity keyed 0 ↔ 100 (row 9). The text layer is **"Tagline"**: "Caption" is a 2b layer on Mentor Practice 2 (2026-10-26) |
| `spinner-eased.json` | Spinner with one pair eased (stage 6 `not_linear`) |
| `after-demo.json`, `after-demo-undone.json`, `after-demo-reheld.json` | The demo, its undo, the learner's own hold (row 20) |
| `practice-blink-before.json`, `practice-blink-after.json` | Mentor Practice duplicate before and after adding a 4-key blink (100, 0, 100, 0, half a second apart) to a visible layer (row 17) |
| `keys-moved.json` | A Blink key moved mid-attempt (row 18) |

**Row 22 stays synthetic (2026-10-26):** a live read always returns key values, so unknown values
can't be planted. `synthetic/unknown-values.json` is built from live files only (`practice2b.json`
plus a copy of `overlap-layers.json`'s Fader with its values set to null) by
`synthetic/make-unknown-values.mjs`, and says `synthetic` at the top (FR-021).

Then delete both duplicates, check Mentor Practice matches `practice-now.json` and Mentor Practice 2
matches `layer-info/practice2b.json`, check no capture holds a user or folder name, save, release
the lock.

## 4. Desk block (AE open, lock released, not 🖐)

```bash
cd mentor && npm test     # on live captures; stand-in folder deleted
```

Set `HOLD_SIDES` from L-2 (snippet and lib). Fill `SKILL.md`'s `<!-- L-2 -->` places with the menu
path and shortcut exactly as logged (none if none shows); write the wrong-side hint from L-1. If
L-1 shows a jump, hand back SR-2 for the shared owner. Any result that changes a requirement goes
in the hand-back for the spec writer before § 5.

## 5. 🖐 First live lesson (SC-001, SC-002)

The builder, in a plain Claude Code session in the repo (not a subagent), Mentor Practice 2 active,
easing learned: `/key-types-mentor`. Expect: the intent question first, at most three candidates
named, Blink named as the one to snap, a demo on one Blink pair only if asked, frames either side of
the jump, then a check per pair. At stage 6, name Spinner's Rotation: confirmed, and the record
then holds one kept-linear mark. Time from `calls.jsonl` (≤ 15 min, ≤ 1 demo); note per pair whether
the check matched the timeline (SC-002: 9 of 10 across the build). Optional: `/ease-mentor` on
Mentor Practice 2 afterwards leaves Spinner's Rotation out and names it once (SC-006).

**What to expect on Mentor Practice 2 as built (added 2026-10-26, from the sitting and the desk
block):**

- **Before starting:** `capture.mjs --compare mentor/test/fixtures/layer-info/practice2b.json` on
  Mentor Practice 2. Differences outside Blink, Cut and Spinner (say from an earlier live lesson) are
  fine; Blink (1, 1.4, 1.8, 2.2 s; 100, 0, 100, 0; all bezier) and Cut (3 to 3.1 s) must be unheld,
  and Spinner (0.25 to 4.25 s, 0 to 360) linear at both ends with no expression. Use the real learner
  home (easing is learned there), not a temp one.
- **Candidates:** Blink, then Cut (two, by first key time). Seal is named as left out (a precomp);
  none of the 2b layers is a candidate. The stage 2 frames come from an already-held pair (Dot 1 or
  Flag Position).
- **Demo:** on Blink's 1 to 1.4 s pair only; frames at about 1.367 and 1.433 s. The "after" frame has
  Blink at 0: the mentor says it vanishes there, never that it's hidden (row 12). The demo's key reads
  influence 16.667 on its held side, as a hand toggle does (After Effects' doing, not a bug).
- **Wording:** at 26.5 the mentor may name ⌃⌥⌘H and ⌥⌘K and no other shortcut (FR-018); it never
  says "freeze".
- **To try for SC-002 (optional):** set Blink's 1.4 s key to Hold in Keyframe Interpolation…
  instead of toggling the 1 s key. If the read shows that key's incoming side as hold (not checked
  live yet; L-2 only read the toggle), the check should say the 1 to 1.4 s pair snaps too early
  (L-1), not that it fades, and not pass it. Note what the dialog wrote either way.
- **Afterwards:** the lesson leaves Blink held. Put Mentor Practice 2 back to
  `layer-info/practice2b.json` (Edit › Undo, or close without saving) before the other skills' live
  lessons, which start from it. The record keeps the pass and the Spinner mark, so § 6's review still
  works (Cut is a new target). Don't hold Cut before § 6.

## 6. 🖐 Live review, a day or more later (SC-007)

With § 5's record, on Mentor Practice 2: the review asks what should snap first, then "make it
snap" on Cut, no demo, walkthrough or menu path; recorded as a review with the next due date. Note
whether a review offered on Mentor Practice nags (H-1).
