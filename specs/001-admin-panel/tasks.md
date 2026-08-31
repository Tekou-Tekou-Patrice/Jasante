# Tasks: Administration Panel

**Input**: Design documents from specs/001-admin-panel/

## Phase 1: Setup

- [ ] T001 Create feature folders and shared TypeScript types in src/app/, src/components/, src/features/, and src/lib/
- [ ] T002 Add Supabase, routing, icons, and test dependencies in package.json
- [ ] T003 Configure environment example and ignore coverage of local secrets in .env.example and .gitignore

## Phase 2: Foundational

- [ ] T004 Create schema, grants, RLS policies, storage bucket policies, and indexes in supabase/migrations/001_admin_panel.sql
- [ ] T005 Create Supabase client, authentication helpers, and protected routes in src/lib/supabase.ts and src/app/
- [ ] T006 Create accessible design tokens, application shell, feedback components, and route navigation in src/styles/ and src/components/
- [ ] T007 Create shared validation, CRUD data helpers, pagination, and RLS test plan in src/lib/ and supabase/tests/

## Phase 3: User Story 1 - Secure Administrator Access (P1)

**Goal**: Only allow-listed administrators can reach protected management features.

**Independent Test**: Sign in, route protection, and sign out work; non-admin and signed-out access is denied.

- [ ] T008 [US1] Implement sign-in, sign-out, session loading, and access-denied states in src/features/auth/
- [ ] T009 [US1] Implement dashboard shell and administrator-only route guard integration in src/app/ and src/features/dashboard/

## Phase 4: User Story 2 - Publish Educational Content (P1)

**Goal**: Manage categories, bilingual articles, images, and YouTube-linked videos.

**Independent Test**: An administrator creates category, drafts/publishes/withdraws article and video, and sees validated lists.

- [ ] T010 [US2] Implement category list, create, rename, dependency-safe delete in src/features/categories/
- [ ] T011 [US2] Implement article list, accessible editor, image upload, and publication actions in src/features/articles/
- [ ] T012 [US2] Implement video list, YouTube validation/metadata prefill, editor, and publication actions in src/features/videos/

## Phase 5: User Story 3 - Manage Learning and Help Resources (P2)

**Goal**: Manage quizzes and help resources.

**Independent Test**: An administrator manages a valid quiz and a resource, with confirmation before deletion.

- [ ] T013 [US3] Implement quiz list and editor with exactly-one-correct-answer validation in src/features/quizzes/
- [ ] T014 [US3] Implement resource list and editor with contact validation in src/features/resources/

## Phase 6: User Story 4 - Monitor Content Inventory (P3)

**Goal**: Display accurate content totals and status counts.

**Independent Test**: Dashboard counts match records after a refresh.

- [ ] T015 [US4] Implement dashboard aggregate counts and linked summary cards in src/features/dashboard/

## Phase 7: Polish and Validation

- [ ] T016 Add focused client tests and database-policy tests in tests/ and supabase/tests/
- [ ] T017 Update README.md with setup, Supabase migration, administrator guide, and validation instructions
- [ ] T018 Run lint, production build, and quickstart validation; record results in specs/001-admin-panel/quickstart.md

## Dependencies

T001-T007 block feature work. US1 unlocks secured workflows. US2, US3, and US4 depend on the
foundation and shared shell; US2 provides categories used by the remaining editors. Final validation
follows all completed user stories.

## Implementation Strategy

Implement the secured shell and database first, then category/article/video management, followed by
quiz/resources and dashboard aggregation. Keep each CRUD form usable with keyboard navigation and
explicit error feedback.

