# Specification Quality Checklist: Move a group with a null (curriculum skill 6)

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

- Names of tools, files and shared functions appear on purpose, as in specs 008 and 010: spec 004's
  skill-module contract fixes them (record ID, tool prefix, the three tools, the files a skill
  adds), and the overlap audit has to say which shared filter each job reuses. Success criteria
  name checks (`check-branch.mjs`, unit tests, eval runs) only as the way each is measured.
- The teaching design is linked by section, not copied (`decisions/007`). S-1 to S-6 are taken;
  the designer answered D-1, D-2, unique names and a null with a parent in TD § 14, and FR-004,
  FR-009, FR-012, FR-015 and FR-020 carry them. D-3 (the null's own name shared) is new, low
  stakes and doesn't block: FR-019's "can't tell, ask" is the default.
- Spec 004 FR-029 was repointed here on 2026-10-23 (H-1).
- No [NEEDS CLARIFICATION] markers. H-1 to H-5 answered 2026-10-23: all as recommended except SR-2
  (declined), which FR-009 and FR-012 reflect.
- Live facts (null defaults, Option or Shift parenting, B9 under a scaled and rotated null, the
  demo's no-jump write, auto-orient, renumbering, the proposal margin) are live checks L-1 to L-6.
- Status: approved 2026-10-23. Plan and tasks come next.
