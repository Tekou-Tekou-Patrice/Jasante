<!--
Sync Impact Report
- Version change: unversioned template -> 1.0.0
- Modified principles: none; five initial project principles established.
- Added sections: Additional Constraints; Development Workflow.
- Removed sections: none.
- Follow-up TODOs: TODO(RATIFICATION_DATE): original adoption date was not available.
-->
# VivaCare Constitution

## Core Principles

### I. Fit-for-Purpose Delivery
Every feature, dependency, abstraction, screen, and configuration change MUST solve a documented
user, operational, or technical requirement. Work that does not support a stated requirement MUST
NOT be added. Rationale: avoiding speculative work keeps the administration application focused,
maintainable, and easier to operate.

### II. Working Software Is Mandatory
Changes MUST build successfully and MUST be verified with the relevant automated checks before they
are considered complete. A change MUST preserve existing behaviour unless a documented requirement
explicitly changes it. Rationale: functionality is more valuable than unverified implementation.

### III. Simplicity Before Abstraction
Implementations MUST use the smallest clear design that meets the current requirement. New
frameworks, dependencies, layers, and general-purpose abstractions require a concrete present use
case and documented justification. Rationale: simple code is easier to review, test, and maintain.

### IV. Explicit, Safe Change Scope
Each change MUST identify its intended outcome and limit edits to files relevant to that outcome.
Refactors, cleanup, and unrelated formatting MUST be separated from feature work unless required to
make the requested change work. Rationale: narrow, explicit scope reduces regressions and makes
reviews reliable.

### V. Verifiable User Outcomes
Requirements MUST be expressed as observable outcomes. Acceptance criteria MUST be testable by an
automated check, reproducible manual procedure, or both; vague claims of completion are insufficient.
Rationale: verifiable outcomes ensure that delivered code actually meets the need.

## Additional Constraints

The application MUST remain compatible with its declared React, TypeScript, and Vite toolchain.
Dependency additions MUST be necessary for an approved requirement, use maintained packages, and be
recorded in the project manifest and lockfile. Secrets, credentials, and personal data MUST NOT be
committed to the repository.

## Development Workflow

Before implementation, work MUST state the requirement and acceptance criteria. During
implementation, developers MUST keep the change minimal and update affected documentation only when
it is needed to operate, understand, or verify the change. Before handoff, run the relevant quality
checks; for application changes this includes `npm run lint` and `npm run build` unless a documented
environmental limitation prevents a command from running. Any limitation or unrun check MUST be
reported with its reason and impact.

## Governance

This constitution governs project planning, implementation, review, and release decisions. Every
change review MUST verify compliance with the core principles, intended scope, acceptance criteria,
and applicable quality checks. Exceptions require a documented reason, impact, mitigation, and
explicit approval before implementation.

Amendments MUST be documented in this file with a Sync Impact Report. The version follows semantic
versioning: MAJOR for incompatible principle redefinitions or removals, MINOR for added principles
or materially expanded governance, and PATCH for clarifications that do not change governance.
Compliance is reviewed during planning and before merging or handing off work; unresolved violations
MUST be corrected or approved as an explicit exception.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-08-24
