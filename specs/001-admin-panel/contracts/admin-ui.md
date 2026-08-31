# Administration UI Contract

This interface contract defines observable routes, actions, validation, and access outcomes.

## Route Contract

| Route | Access | Required outcome |
|---|---|---|
| /login | Public | Email/password sign-in; success redirects to dashboard |
| / | Administrator | Dashboard totals and status counts |
| /categories | Administrator | List, create, rename, dependency-safe delete |
| /articles and article editor routes | Administrator | List and draft/publish/withdraw/delete editor |
| /videos and video editor routes | Administrator | List and YouTube metadata-aware editor |
| /quizzes and quiz editor routes | Administrator | List and question/options editor |
| /resources and resource editor routes | Administrator | List and help-resource editor |

Unauthenticated access to any administrative route redirects to login. Authenticated non-admin
sessions receive no management data and are denied management actions.

## Shared Interaction Contract

- Fields have visible labels; icon-only controls have accessible names.
- Required fields validate on submit and bind errors to their controls.
- Save draft, publish, withdraw, and delete are distinct labelled actions.
- Deletion opens a named confirmation dialog with trapped focus and restored triggering focus.
- Success, failure, loading, and empty states communicate their status to assistive technology.
- Lists and forms are fully keyboard operable with visible focus.

## Content Form Contract

| Form | Required fields | Rules |
|---|---|---|
| Category | name | Unique name; deletion blocked while in use |
| Article | category, language, title, body, status | Image alternative text required with image |
| Video | category, language, URL, title, description, thumbnail, status | Valid video identifier; metadata editable |
| Quiz | category, language, question, 2-6 options, explanation | Exactly one correct option |
| Resource | name, type, city, language, status, one contact/detail | Contact data normalised |

## Dashboard Contract

Dashboard displays totals for categories, articles, videos, quiz questions, and resources plus
draft/published/withdrawn counts for articles and videos. Counts refresh after mutation or reload.

