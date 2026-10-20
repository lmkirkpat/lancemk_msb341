# Specification Quality Checklist: Diagnosis ("what's wrong here?")

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

- "What the mentor can read today" names files and functions on purpose: the cockpit asked for
  the evidence brief's claim I to be checked against `mentor/`, and the result sets the story
  priorities. Requirements and success criteria stay free of implementation.
- FR-005's thresholds ("the same time", "sudden", "well before") are left to the plan and fixed
  by the answer key (SC-001). That's deliberate, not a gap; the teaching side of whether the
  mentor may state a threshold at all is open question 4.
- No [NEEDS CLARIFICATION] markers: the five open questions in the spec each carry a
  recommended answer, and the spec is written to those answers. Plan only after they're decided.
