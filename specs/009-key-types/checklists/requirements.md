# Specification Quality Checklist: Pick the key type on purpose (curriculum skill 1)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Implementation details, judged against this repo's convention.** Like specs 002 to 004, the spec
  names the existing contract it plugs into (the three tool names, `session.keepLinear`,
  `segmentState`, `check-branch.mjs`) because spec 004's contract fixes them and a reviewer checks
  against them. It chooses no new language, framework or file layout.
- **Teaching design not restated.** Focus, stages, pass, hints, version notes, review and record
  are linked to `teaching-design.md` by section. Only what the design delegated is set here: S-1
  (FR-003) and S-2 (FR-014, via spec 004 FR-038).
- **Overlap audit run** (`/overlap-audit`, spec 004 FR-034): the classifier-reuse table and the
  23-row matrix are in the spec. One row is wrong today (17, the practice blink and the session
  baseline), raised as SR-1; one is conditional on a live check (6, SR-2).
- **No [NEEDS CLARIFICATION] markers.** Choices that need someone else are open questions with a
  recommendation (H-1 to H-4 for the builder, C-1 to C-3 for the designer), or live checks L-1 to L-4
  that the build must run before its wording is final (FR-024).
- **Success criteria name their measure** (unit test, eval run, usage notes, `check-branch.mjs`).
- Validation run once; all items pass.
- **Approved 2026-10-21.** H-1 (accept the Mentor Practice fades this sprint; watch in SC-007), H-2
  (strict 0 and 100 within 0.5), H-3 (SR-1 as spec 004 T062 and T063, `fresh`) and H-4 (volunteered
  constant-speed move in a review confirmed and marked, ungraded) as recommended. The designer's
  C-1 to C-3 answers are folded in (FR-005, FR-007, FR-008, FR-013, rows 16, 17, 19, the session
  baseline classifier row, Other edge cases, Assumptions). Row 17 is now right. Plan and tasks come
  next.
