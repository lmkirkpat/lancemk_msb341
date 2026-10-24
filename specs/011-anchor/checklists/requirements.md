# Specification Quality Checklist: Set the pivot (curriculum skill 5)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-23
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

- **Implementation names, on purpose.** As in specs 008 to 010, the spec names the three tools,
  wave B's shared modules (`layer-info`, `comp-space`, `visibility`, `motion-sources`) and
  `unexpectedChanges()`, because spec 004's contract fixes them and the overlap audit's findings
  (filters 1 to 6) are about which shared function a job may reuse. SC-006 and SC-008 name
  `npm test` and `check-branch.mjs` as their measures.
- **No [NEEDS CLARIFICATION] markers.** H-1 to H-5 and SR-1 were approved 2026-10-23 as
  recommended, and the designer answered D-1 to D-3 and set H-3's condition (TD § 15); all are
  written into the requirements.
- **Spec 004 FR-028** was reworded the same day (H-1): it keeps the two measures and points here
  for the own-space rule's floor, the check time and items 3 to 5.
- **Blocked on spec 004 wave B's shared pass** (tasks-wave-b.md T100 to T163, approved, with SR-1
  as T160) for the build; not for approval.
- Live checks L-1 to L-5 settle facts during the build; they aren't guessed here.
