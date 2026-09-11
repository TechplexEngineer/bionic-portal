# Parent pending student links

## Goal

Let a parent complete registration before a student, while minimizing errors and automatically linking the accounts when the student later registers.

## Design

The parent registration action will validate every submitted student email on the server. Existing students are linked immediately. Valid emails with no matching student row are stored in a new `pending_parent_student_links` table keyed by parent and normalized email. The parent profile is saved regardless of whether a student currently exists.

The parent registration page will display pending emails separately from linked students. A parent can remove a pending email through a dedicated form action, which provides a recovery path for typos without requiring the student to register first.

When a student completes registration, the student action will find pending records for the authenticated email, create conflict-safe parent/student links, and remove the fulfilled pending records. No student row is created from parent-supplied information.

## Error handling and validation

- Normalize email addresses by trimming and lowercasing them.
- Reject malformed emails server-side using the repository's existing email format rule before profile or pending-link writes.
- Deduplicate repeated email rows within one submission.
- A missing student is not an error; it becomes pending.
- A malformed email returns a 400 response and leaves existing data unchanged.
- Pending-link insert conflicts are ignored so resubmission is safe.

## Verification

Add server tests for malformed parent emails, pending creation, pending removal, and automatic resolution during student registration. Preserve existing immediate-link and multi-row coverage, then run formatting, type checking, unit tests, and production build.
