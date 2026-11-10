# Contract: the finding catalogue (`mentor/curriculum/diagnosis.json`)

The catalogue is data (spec FR-005, FR-010), owned by the skill-builder. Its wording comes from the
curriculum designer's [`teaching-design.md`](../teaching-design.md) (T001), which it mirrors the way
`path.json` mirrors `curriculum.md`. A test (`mentor/test/diagnosis-catalogue.test.mjs`) fails if the
two disagree.

```json
{
  "about": "Mirror of specs/005-diagnosis/teaching-design.md › Catalogue. Change both in the same merge; mentor/test/diagnosis-catalogue.test.mjs compares them. Thresholds: specs/005-diagnosis/research.md R3.",
  "kinds": [
    {
      "id": "DX-02",
      "kind": "style",
      "story": "US1",
      "enabled": true,
      "scope": "comp",
      "rank_weight": 5,
      "may_be_intended": true,
      "thresholds": { "min_layers": 3, "min_moves": 3, "tolerance_frames": 1, "min_share": 0.5 },
      "wording": { "title_key": "dx-02-title", "effect_key": "dx-02-effect", "where_key": "dx-02-where" }
    }
  ]
}
```

## Rules

1. **Exactly nine kinds**, DX-01 to DX-09, each once. A tenth is a spec change, not a data change.
2. **`rank_weight`** is a permutation of 1 to 9 and matches `teaching-design.md`'s order.
3. **`wording` keys** each name an anchor that exists in `teaching-design.md`. The catalogue holds no
   prose, so the words have one source.
4. **Ask kinds** (DX-05, DX-06) have a `question_key`. Style kinds have `may_be_intended: true`.
5. **`enabled: false`** for DX-08 and DX-09 until US4's tasks land (T034 flips them).
6. **The skill map** is `path.json › findings` and isn't repeated here. The test checks every DX ID
   has an entry there (a skill ID or `null`).
7. **Thresholds** are read by `diagnosis-findings.mjs` only from here; no number is hard-coded in the
   detectors. Changing one means updating the answer keys in the same change.
