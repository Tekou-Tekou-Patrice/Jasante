# Feature Specification: Administration Panel

**Feature Branch**: `001-admin-panel`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Build only the administration panel for the sexual and reproductive health and gender-based violence education platform."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Administrator Access (Priority: P1)

An authorised content administrator signs in and reaches a private dashboard, while unauthenticated
visitors cannot view or change administrative content.

**Why this priority**: Protecting content management is required before any publication workflow can
be safely used.

**Independent Test**: An administrator can sign in with valid credentials and see the dashboard;
an unauthenticated visitor is redirected to sign in and cannot access protected pages.

**Acceptance Scenarios**:

1. **Given** an active administrator account, **When** the administrator submits valid credentials,
   **Then** the dashboard is displayed.
2. **Given** an unauthenticated visitor, **When** the visitor opens an administration page,
   **Then** the visitor is asked to sign in and no administrative data is exposed.
3. **Given** a signed-in administrator, **When** the administrator signs out, **Then** protected
   pages require authentication again.

---

### User Story 2 - Publish Educational Content (Priority: P1)

An administrator creates, edits, saves as draft, publishes, and withdraws bilingual articles and
video entries organised by category, so mobile users receive only approved content.

**Why this priority**: The platform's core value is giving the organisation control of educational
content without developer intervention.

**Independent Test**: An administrator can create a category, create an article and a video in that
category, publish each, then withdraw each; list views reflect the selected status and language.

**Acceptance Scenarios**:

1. **Given** a signed-in administrator and an existing category, **When** an article with its
   required fields is saved as a draft, **Then** it appears as a draft and is not publicly available.
2. **Given** a draft article or video, **When** the administrator publishes it, **Then** its status
   changes to published and its category and language remain associated.
3. **Given** a published item, **When** the administrator withdraws it, **Then** it is no longer
   publicly available while its record remains manageable.
4. **Given** a valid YouTube URL, **When** an administrator creates a video entry, **Then** a title,
   description, and thumbnail can be confirmed or supplied before saving.

---

### User Story 3 - Manage Learning and Help Resources (Priority: P2)

An administrator manages quiz questions and support-resource listings so that educational feedback
and local help information remain current.

**Why this priority**: These modules complete the administration scope but depend on secure access
and category management.

**Independent Test**: An administrator creates, edits, and removes a quiz question with one correct
answer and explanation, then creates, edits, and removes a support-resource listing.

**Acceptance Scenarios**:

1. **Given** a category, **When** an administrator saves a quiz question with answers, one correct
   answer, and an educational explanation, **Then** the question is associated with that category.
2. **Given** a resource listing, **When** an administrator changes its contact details or city,
   **Then** the updated information is shown in the resource list.
3. **Given** a quiz question or resource listing, **When** an administrator requests deletion,
   **Then** the system asks for confirmation before removal.

---

### User Story 4 - Monitor Content Inventory (Priority: P3)

An administrator views a concise dashboard that shows the numbers of categories, articles, videos,
quiz questions, and resources, with content counts split by publication status where applicable.

**Why this priority**: It gives non-technical staff an immediate view of publishing progress without
adding analytics outside the requested scope.

**Independent Test**: With known records in each content type and status, the dashboard displays
the corresponding counts.

**Acceptance Scenarios**:

1. **Given** stored content records, **When** an administrator opens the dashboard, **Then** the
   count for each managed content type is displayed.
2. **Given** articles and videos in draft and published states, **When** the administrator opens the
   dashboard, **Then** the status counts match the content lists.

### Edge Cases

- Invalid, inaccessible, or unsupported video links are rejected with a clear message; manually
  supplied metadata remains possible when automatic metadata cannot be obtained.
- Required fields, invalid publication transitions, duplicate category names, and quiz questions with
  zero or multiple correct answers are blocked with field-level guidance.
- An expired session or an unauthorised write attempt ends the action safely and asks the user to
  sign in again without exposing protected content.
- Deleting a category that is still used by content is prevented until the dependent content is
  reassigned or removed.
- Image upload failures do not create a broken published article; the administrator can retry or
  save the article as a draft.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow only authenticated administrator accounts to access the
  administration panel and perform management actions.
- **FR-002**: The system MUST provide sign-in and sign-out flows and protect all administrative
  pages from unauthenticated access.
- **FR-003**: The system MUST allow administrators to create, rename, and delete content
  categories, while preventing deletion of a category that is still in use.
- **FR-004**: The system MUST allow administrators to create, view, edit, save as draft, publish,
  withdraw, and delete articles with a title, body, image, category, language, and publication status.
- **FR-005**: The system MUST allow administrators to upload and replace article images and provide
  meaningful alternative text for each image.
- **FR-006**: The system MUST allow administrators to create, view, edit, save as draft, publish,
  withdraw, and delete video entries with a YouTube link, category, language, title, description,
  thumbnail, and publication status.
- **FR-007**: The system MUST attempt to retrieve video title and thumbnail information from a valid
  YouTube link and MUST allow manual entry when retrieval is unavailable.
- **FR-008**: The system MUST allow administrators to create, view, edit, and delete quiz questions
  containing a category, question text, answer choices, exactly one correct answer, and an educational
  explanation.
- **FR-009**: The system MUST allow administrators to create, view, edit, and delete resource
  listings containing a name, type, contact method, and city; optional call and WhatsApp links may be
  included when supplied.
- **FR-010**: The system MUST display a dashboard with totals for managed content types and separate
  publication-status counts for articles and videos.
- **FR-011**: The system MUST provide readable validation, error, loading, and empty states for all
  management workflows.
- **FR-012**: The system MUST present a responsive, keyboard-operable administration interface with
  visible focus, sufficient contrast, labelled controls, and form errors announced clearly.
- **FR-013**: The system MUST restrict public access to published content only and restrict all
  content-management writes to authorised administrators.
- **FR-014**: The system MUST not collect or manage personally identifiable data for mobile end users.

### Key Entities

- **Administrator**: A staff member authorised to sign in and manage all panel content.
- **Category**: A named thematic grouping for articles, videos, and quiz questions.
- **Article**: A bilingual educational content item with text, image, accessibility description,
  category, and publication state.
- **Video**: An educational YouTube-linked content item with metadata, category, language, and
  publication state.
- **Quiz Question**: A thematic question with answer choices, one correct answer, and educational
  feedback.
- **Resource Listing**: A health, association, or assistance contact with type, city, and contact
  methods.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authorised administrator can sign in and reach the dashboard in under 30 seconds.
- **SC-002**: An administrator can create and publish a complete article, video, quiz question, or
  resource listing in no more than 3 minutes when the content details are ready.
- **SC-003**: In acceptance testing, 100% of unauthenticated attempts to open administrative pages
  are denied access.
- **SC-004**: In acceptance testing, 100% of content-management actions enforce required fields and
  publication-state rules.
- **SC-005**: Keyboard-only users can complete sign-in and create an article without a mouse, and all
  tested interactive controls expose an accessible name.
- **SC-006**: The dashboard reflects newly created, published, withdrawn, or deleted content after a
  refresh with counts matching the content lists.

## Assumptions

- The scope is limited to the web administration panel; the anonymous mobile application, chatbot,
  forum, emergency reporting, and map are out of scope for this feature.
- Administrators use individual email-and-password accounts supplied by the organisation; no public
  registration or multiple editorial roles are required for the first release.
- French and English are the two supported content languages.
- Videos remain hosted externally; the panel stores links and metadata rather than video files.
- The organisation provides administrator accounts, its video-channel link, content, and any final
  branding assets before acceptance testing.
