# Data Model: Administration Panel

## Conventions

- Every table has a UUID primary key plus created_at and updated_at timestamps.
- language is fr or en for editorial content.
- publication_status is draft, published, or withdrawn; anonymous reads return published records only.
- Every exposed table uses RLS and least-privilege grants. is_admin() checks admin_users membership.

## Entities

### admin_users

Allow-list of staff accounts created through authentication.

| Field | Rules |
|---|---|
| user_id | Primary key; authenticated user reference; required |
| created_at | Required and system-set |

The table is not selectable from the browser; policies call the membership helper.

### categories

| Field | Rules |
|---|---|
| id | Primary key |
| name | Required; unique after normalisation; 2-80 characters |
| slug | Required; unique; URL-safe |
| description | Optional; maximum 280 characters |

One category has many articles, videos, and quiz questions. Deletion is rejected while dependencies exist.

### articles

| Field | Rules |
|---|---|
| id | Primary key |
| category_id | Required category reference |
| language | Required; fr or en |
| title | Required; 5-160 characters |
| body | Required editorial text |
| image_path | Optional storage object path |
| image_alt | Required when image_path exists; 5-250 characters |
| publication_status | Required; default draft |
| published_at | Required when published; otherwise null |
| created_by / updated_by | Required administrator reference |

Index publication_status, language, category_id, published_at descending.

### videos

| Field | Rules |
|---|---|
| id | Primary key |
| category_id | Required category reference |
| language | Required; fr or en |
| youtube_url | Required valid YouTube URL; unique |
| youtube_video_id | Required extracted identifier; unique |
| title | Required; 5-160 characters |
| description | Required; 20-2,000 characters |
| thumbnail_url | Required HTTPS URL |
| publication_status | Required; default draft |
| published_at | Required when published; otherwise null |
| created_by / updated_by | Required administrator reference |

Index publication_status, language, category_id, published_at descending.

### quiz_questions and quiz_options

A question has category_id, language, question, explanation, publication_status, and administrator
audit fields. Its options belong to the question and have option_text, position, and is_correct.

A question has 2-6 options and exactly one correct option. Form validation and a database constraint
or trigger enforce this invariant before publication.

### resources

A resource has name, resource_type, city, optional phone, WhatsApp, address, description, language,
publication_status, and administrator audit fields. At least one contact/detail field is required.
Index publication_status, language, city.

## Access Matrix

| Actor | Categories | Editorial content | Article images |
|---|---|---|---|
| Anonymous visitor | Published-facing references only | Published records only | Published-article images only |
| Authenticated non-admin | No access | No access | No access |
| Allow-listed admin | Full CRUD | Full CRUD | Full CRUD |

Policies are defined per SELECT, INSERT, UPDATE, and DELETE. Database tests cover every allowed and
denied route.
