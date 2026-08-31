# Research: Administration Panel

## Decision: Extend the existing React/Vite application

**Rationale**: The repository already contains a TypeScript React/Vite starter. Keeping one web
application is the shortest path to a working panel and follows the simplicity rule.

**Alternatives considered**: A separate Next.js application adds a second project and deployment
surface without a server-rendering requirement. A custom API duplicates the managed backend scope.

## Decision: Use Supabase Auth, PostgreSQL, Storage, and RLS

**Rationale**: The brief mandates Supabase. Enable RLS on every exposed table, revoke default client
grants, grant only necessary operations, and define a policy for each operation. This makes browser
access safe without a custom backend.

**Alternatives considered**: Client-only checks do not secure data. A service-role credential in the
browser bypasses RLS and is prohibited.

## Decision: One admin_users allow-list table

**Rationale**: The first release has one staff role. A private table keyed by authenticated user ID
makes membership checks explicit and reusable without premature permission-management features.

**Alternatives considered**: All authenticated users as administrators is unsafe. Multiple roles are
deferred because the brief requires only administrators.

## Decision: Store article images in a policy-controlled bucket

**Rationale**: Administrators manage images in Supabase Storage. Storage policies restrict write
operations to the allow-list; public display is restricted to images belonging to published articles.

**Alternatives considered**: Embedding image data in content rows impairs performance. Repository
assets would require a developer for each update.

## Decision: Store YouTube links and editable metadata

**Rationale**: Videos remain hosted on YouTube. The form validates links and pre-fills metadata when
available but permits verified manual metadata so editorial work is not blocked by retrieval failure.

**Alternatives considered**: Uploading video files violates the brief. Requiring automatic metadata
would make the workflow unreliable.

## Decision: Explicit publication states

**Rationale**: Draft, published, and withdrawn states support preparation, controlled release, and
removal while anonymous reads are limited to published items.

**Alternatives considered**: A publication boolean cannot distinguish draft from withdrawn.

## Sources consulted

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [YouTube IFrame Player API](https://developers.google.com/youtube/player_parameters)

