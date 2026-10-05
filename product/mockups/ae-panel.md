# AE Mentor panel: ASCII mockup

**Status:** Concept only, not specced. Spec 002 is out of scope for any interface beyond Claude
Code, so building this panel needs its own spec. Given the CEP retirement dates
(`discovery/ae-bridge-findings.md`), it should probably target UXP, not CEP.

**Moment shown:** lesson 2 on **Mentor Practice** (`discovery/Claude AE Tutor Test.aep`), right
after a partial attempt. The mentor eased the first Title › Position pair as the demo, the
learner eased Scale and Opacity, and Position 1.5–3 s is still linear (check #2 in
`discovery/usage-notes/easing-slice.md`).

## 1. Workspace: panel docked on the right

```
┌─ Adobe After Effects ─ File Edit Composition Layer Effect Animation Window ─┐
├───────────┬─────────────────────────────────────────┬───────────────────────┤
│ Project   │ Composition: Mentor Practice            │ ╔═ AE Mentor ═══════╗ │
│ ▾ Comps   │ ┌─────────────────────────────────────┐ │ ║ ● Connected       ║ │
│  ▣ Mentor │ │                                     │ │ ║ Easing · You do ● ║ │
│  Practice │ │                 TITLE  ▸            │ │ ║───────────────────║ │
│  ▣ Icon   │ │              subtitle               │ │ ║ [frame preview]   ║ │
│ ▾ Footage │ │           ━━━━━━━━  (Bar)           │ │ ║ CHECK 2/3 ✓ 1 ✗   ║ │
│           │ └─────────────────────────────────────┘ │ ║ Mentor: hint…     ║ │
├───────────┴─────────────────────────────────────────┤ ║                   ║ │
│ Timeline  0;00;01;12     ▏0s    1s    2s    3s      │ ║                   ║ │
│ ▾ Title                   ▏                         │ ║                   ║ │
│     Position              ▏ ◆━━━━◆ ◇─────◇  ← here  │ ║───────────────────║ │
│     Scale                 ▏◆━━━◆                    │ ║ ▸ Ask…          ⏎ ║ │
│     Opacity               ▏◆━◆                      │ ║ MEMORY  Oct 3 ✓   ║ │
│ ▸ Subtitle  ▸ Bar  ▸ Cursor  ▸ Logo                 │ ╚═══════════════════╝ │
└─────────────────────────────────────────────────────┴───────────────────────┘
```

## 2. Panel up close

```
╔══ AE Mentor ══════════════════════════════════ ◐ ≡ ═╗
║ ● Connected · Mentor Practice · 0;00;01;12          ║
╟─────────────────────────────────────────────────────╢
║ PATH  Motion basics                                 ║
║ ✓ Keyframes ━ ● Easing ━ ○ Graph Editor ━ ○ Bounce  ║
╟─────────────────────────────────────────────────────╢
║ LESSON  Easy Ease on "Title"            attempt 2   ║
║                                                     ║
║    I do  ━━━━━━━━━  We do  ━━━━━━━━━  You do        ║
║     ✓                  ✓                ●           ║
╟─────────────────────────────────────────────────────╢
║ ┌─ Your comp at 1.0s ─────────────────────────────┐ ║
║ │                                                 │ ║
║ │ linear   TITLE ·  ·  ·  ·  ·  ·  ·  ▸           │ ║
║ │ eased    TITLE ·· ·   ·    ·   ·  ··▸           │ ║
║ │                                                 │ ║
║ │ speed  ▁▇▇▇▇▇▇▇▇▁   →   ▁▂▄▆█▆▄▂▁               │ ║
║ └─────────────────────────────────── ↻ Re-render ─┘ ║
╟─────────────────────────────────────────────────────╢
║ CHECK  2 of 3 yours eased · 1 still linear          ║
║                                                     ║
║ Title › Position  0.5–1.5s  ◆━━◆  demo (mentor)     ║
║ Title › Position  1.5–3.0s  ◇──◇  linear      ✗     ║
║ Title › Scale     0.0–1.0s  ◆━━◆  you         ✓     ║
║ Title › Opacity   0.0–0.5s  ◆━━◆  you         ✓     ║
║                                                     ║
║ ┌─ Mentor ────────────────────────────────────────┐ ║
║ │ Nice. Scale and Opacity now ease in, but the    │ ║
║ │ title still slams into its final spot.          │ ║
║ │                                                 │ ║
║ │ Hint: it's the second Position pair, not the    │ ║
║ │ one I did. Select Title and press P.            │ ║
║ └─────────────────────────────────────────────────┘ ║
║                                                     ║
║  [ Check my work ]   [ Hint ]   [ Show me again ]   ║
╟─────────────────────────────────────────────────────╢
║ ▸ Ask the mentor…                               ⏎   ║
╟─────────────────────────────────────────────────────╢
║ MEMORY  Oct 3 · Keyframes ✓ · today: Easing         ║
║         Next: ease strength in the Graph Editor     ║
╚═════════════════════════════════════════════════════╝
```

## How it maps to the slice

| Panel section | Backed by |
|---|---|
| Connection line | `ae_status`, plus AE_UNREACHABLE / AE_BUSY handling |
| PATH row | Skill path. The mentor leads (`decisions/002`) |
| I do / We do / You do | Demo pattern in spec 002 (FR-006: one `set_ease` per lesson) |
| Frame preview | `preview_frame` |
| CHECK list | `snapshot_project` + `diff_since_last`, with the demo pair credited to the mentor |
| MEMORY strip | `read_learner_record` / `record_lesson` |

Hollow diamonds `◇──◇` are linear pairs and filled `◆━━◆` are eased ones, the same way AE's
timeline draws them. There is no "Do it for me" button. "Show me again" only replays the one demo
pair.

## Open questions

- Should the free-text "Ask the mentor" input stay? It makes the panel a second chat surface next
  to Adobe's assistant. Removing it and keeping only the buttons would make it clearer that the
  mentor leads.
