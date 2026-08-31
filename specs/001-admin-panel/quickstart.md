# Quickstart: Administration Panel Validation

## Prerequisites

- Node.js compatible with the project lockfile.
- Supabase project with an allow-listed administrator account.
- Local Supabase URL and browser-safe publishable key; never a service-role key.
- Applied schema, RLS, and storage migration from supabase/migrations/.

## Start the Panel

1. Install dependencies with npm install.
2. Configure local Supabase environment values through the project example file.
3. Run npm run dev and open the Vite local address.
4. Run npm run lint and npm run build; both must pass before handoff.

## End-to-End Acceptance

### Secure access

1. Open an administrator route while signed out. Expected: redirect to sign-in.
2. Sign in as an allow-listed administrator. Expected: dashboard opens.
3. Sign out and reopen a protected route. Expected: access is denied.
4. Sign in as a non-allow-listed account. Expected: no data or mutation actions are available.

### Content workflows

1. Create category SSR, then try duplicate creation. Expected: duplicate rejected.
2. Create a French article with category, title, body, image, and alternative text. Save draft,
   publish, then withdraw it. Expected: status and dashboard counts update.
3. Try publishing an image article without alternative text. Expected: field-level error.
4. Add a valid YouTube URL. Expected: available metadata pre-fills yet remains editable; publish works.
5. Create a quiz with four options and one correct answer. Expected: it saves; zero or multiple
   correct answers are rejected.
6. Create, edit, and delete a resource with name, type, city, and a contact/detail. Expected:
   deletion asks for confirmation.

### Security and accessibility

1. Run database policy tests. Expected: anonymous/non-admin access is denied and anonymous reads
   return only published records.
2. Navigate login, dashboard, and all create forms with a keyboard. Expected: visible logical focus
   with no trap outside confirmation dialogs.
3. Screen-reader test login, dashboard, article editor, and confirmation dialog. Expected:
   controls, errors, status messages, and dialogs are understandable.
4. Check final design tokens with a contrast checker. Expected: normal text and interactive controls
   meet the chosen AA-oriented threshold.

