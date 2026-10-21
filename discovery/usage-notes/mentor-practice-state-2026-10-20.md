# Mentor Practice: state on 2026-10-20

A read-only read of every keyed property in Mentor Practice (`discovery/Claude AE Tutor Test.aep`,
comp id 97), taken by the cockpit through the bridge before the wave A skill specs (008 to 010).
After Effects **26.5x89** on macOS 27.0.1. The project had unsaved changes; nothing was saved or
changed. Compared with what `mentor/dev/build-practice-comp.jsx` builds. Answers the teaching
designs' open items 008 B-1, 010 B-4 and curriculum B2.

Key types are written in-out: L linear, B bezier, H hold. "Eased" is influence 33.33, speed 0
(Easy Ease).

| # | Layer | Property | Now | As built | Changed? |
|---|---|---|---|---|---|
| 1 | Title (parent CTRL) | Position | 4 keys (0.5, 1.5, 3, **4.37 s**), all eased | 3 keys, linear | Eased in earlier lessons; a 4th key added at 4.37 s |
| 1 | Title | Scale | 0.5 → 1.5 s, eased | linear | Eased |
| 1 | Title | Opacity | 0.5 → 1.5 s, eased | linear | Eased |
| 2 | Subtitle (parent CTRL) | Position | 0.3, 1.3, **4.37 s**, eased; values 120 px lower than built | 2 keys, eased | A key added at 4.37 s, and moved |
| 2 | Subtitle | Opacity | key 1 linear in / bezier out, key 2 linear (half-eased) | same | No |
| 3 | CTRL (null) | Position | 0 → 1 s, linear | same | No |
| 4 | Bar | Trim Paths End | 0.2 → 1.2 s, eased | linear | Eased |
| 4 | Bar | X Position (separated) | 0, 0.6, 1.2 s, linear | same | No |
| 5 | Glow | Gaussian Blur Blurriness | 0 → 1 s, linear | same | No |
| 6 | Cursor | Opacity | 6 keys, 0 to 2.5 s, **all hold** | hold | No |
| 7 | Logo | Rotation | 0 → 2 s (0 to 90°), linear, **expression on** | same | No |
| 7 | Logo | Scale | one key | same | No |
| 8 | Old Take (eye off) | Position | 0 → 1 s, linear | same | No |
| 9, 10 | Icon (precomp), Background | none | | | |

## What it means for the wave A specs

- **Skill 2, speed graph (008):** Mentor Practice now has eased pairs to work on: Title's three
  Position pairs, Scale and Opacity, and Bar's Trim Paths End. Title Position has three pairs, so
  the demo can take one and leave the learner the rest; Scale and Opacity are one pair each.
- **Skill 1, key types (009):** **B2 answered:** the Cursor is all hold now, as built, and nothing
  in the record or usage notes says it was changed and changed back, so it was almost certainly
  hold on 2026-10-08 (Adobe's reading of it goes in skill 1's "why" as a misread). Since it's
  already held, it isn't a skill 1 target (a done target isn't a target). Logo's Rotation is a
  constant spin, linear on purpose, but an expression is on it (the "expressions over keys"
  overlap). The linear pairs left (CTRL, Bar X Position, Glow, Old Take, Subtitle Opacity) are
  easing's targets, not snaps. So **skill 1 needs the second practice comp** (B1) for a real target.
- **Skill 3, offset (010):** Title's Position, Scale and Opacity all start at 0.5 s and land at
  1.5 s together: the clean properties target. Layer starts are 0 s (CTRL, Bar Position, Glow,
  Cursor, Old Take, hidden), 0.2 s (Bar Trim Paths), 0.3 s (Subtitle), 0.5 s (Title), which
  supports the designer's "a good layers lesson needs the second practice comp".
- **Linear on purpose:** the builder decided on 2026-10-20 that Knack remembers a learner's "keep
  this linear" as a fact about the layer and property (not a motive), and easing and diagnosis
  stop flagging that pair. Logo's Rotation is the kind of pair it's for.
- The 4.37 s keys on Title and Subtitle aren't in any usage note. They're probably from a lesson
  or a manual test; they don't affect the specs, but a skill's fixture shouldn't assume three keys.
