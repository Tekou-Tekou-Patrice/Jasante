# Implementation Plan: Administration Panel

**Branch**: 001-admin-panel | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

## Summary

Build a responsive administration panel for authorised staff to manage categories, bilingual articles,
YouTube-linked videos, quizzes, and help resources. Extend the existing React/Vite application with
Supabase authentication, data access, media storage, route protection, and an accessible management UI.
Supabase policies enforce the same access rules at database and storage layers.

## Technical Context

**Language/Version**: TypeScript 6.0 and React 19.2

**Primary Dependencies**: Vite 8, React Router, @supabase/supabase-js, Vitest, React Testing Library.

**Storage**: Supabase PostgreSQL; Supabase Storage article-images bucket; external YouTube video hosting.

**Testing**: ESLint, TypeScript production build, focused component tests, database-policy tests, and
documented manual acceptance/accessibility checks.

**Target Platform**: Current desktop and mobile browsers; desktop is the primary administrative workflow.

**Project Type**: Single-page web application backed by Supabase services.

**Performance Goals**: Dashboard and paginated lists usable within 2 seconds on typical broadband;
lists request no more than 25 records per page.

**Constraints**: No service-role credential in the browser. RLS applies to every exposed table and
storage object. Only published public content may be read anonymously. Keyboard operation, visible
focus, AA-oriented contrast, and labelled form controls are mandatory.

**Scale/Scope**: One administrator role; six persisted entities; six management routes plus sign-in
and dashboard; French and English content; no mobile app, forum, chatbot, emergency reporting, or map.

## Constitution Check

**Pre-design gate: PASS.**

- Every planned component maps to FR-001 through FR-014; no optional product features are included.
- Lint, type/build, component, database-policy, and quickstart checks are required before handoff.
- The plan preserves the supplied single React application and adds no custom backend or state framework.
- Changes stay within the web application and a new Supabase migration/test directory.
- The quickstart makes security, CRUD, and accessibility outcomes observable.

**Post-design gate: PASS.** The data model and UI contract use one administrator role, explicit
publication states, and RLS membership checks. No unjustified complexity is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-ui.md
└── tasks.md                 # Generated later by speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/                     # router, route guard, application shell
├── components/              # reusable accessible UI and form controls
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── categories/
│   ├── articles/
│   ├── videos/
│   ├── quizzes/
│   └── resources/
├── lib/                     # Supabase client, validation, shared types
├── styles/
└── main.tsx

supabase/
├── migrations/              # schema, grants, RLS, storage policies
└── tests/                   # database/RLS tests

tests/
└── components/              # focused client-side tests
```

**Structure Decision**: Keep the supplied Vite app as one deployable administration panel. Group
UI and data operations by content feature, centralise the Supabase client and shared validation, and
keep reproducible schema/security rules in supabase/.

## Complexity Tracking

No constitution violations or additional complexity require justification.

