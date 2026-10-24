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
  D-1 (re-store the null while nothing is parented) and D-2 (a null moved only on Anchor Point) go
  back to the designer, and FR-012 and FR-020 say where they apply.
- Spec 004 FR-029 conflicts with S-1 to S-3; this spec measures per S-1 to S-3 and asks the builder
  to repoint FR-029 (H-1). Spec 004 is not edited here.
- No [NEEDS CLARIFICATION] markers. Five builder questions (H-1 to H-5), each with a
  recommendation; the spec is written to them.
- Live facts (null defaults, Option or Shift parenting, B9 under a scaled and rotated null, the
  demo's no-jump write, auto-orient, renumbering, the proposal margin) are live checks L-1 to L-6.
- Status: draft, awaiting the builder's approval. Plan and tasks come after.
