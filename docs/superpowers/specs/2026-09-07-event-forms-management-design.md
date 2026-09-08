# Event Forms Management Design

## Goal

Give admins a simple event-scoped forms library where they can list, view, create, and edit forms while keeping PDF upload separate from Bionic Sign field editing.

## Flow

- `/admin/events/:id/forms` is the forms list and landing page.
- `/admin/events/:id/forms/new` accepts the form name and blank PDF, uploads the PDF to R2, creates the D1 form record, and redirects to the editor.
- `/admin/events/:id/forms/:formId/edit` loads the stored base PDF and definition into `PdfFormDesigner`.
- Saving the editor updates the form name/definition and redirects back to the forms list.
- Existing signed submissions are not modified by definition edits.

## Data and security

The existing `event_forms` record remains the source of truth for the form name, base PDF R2 key, and JSON field definition. All page loads/actions and PDF delivery endpoints verify the event/form relationship; the admin route tree supplies admin authorization.

## Compatibility

The existing event creation flow redirects to the forms list. Existing events and legacy `permissionFormUrl` registrations continue to work. No database migration is needed.

## Verification

Add markup/server tests for list links, new-form redirect/setup, and edit-save redirect; run focused tests, `npm run check`, `npm run build`, and `git diff --check`.
