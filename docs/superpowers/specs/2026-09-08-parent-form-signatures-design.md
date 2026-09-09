# Parent Form Signatures and Account Pairing Design

## Goal

Make student and parent form completion seamless: students provide the form information they own, parents sign the parent-owned portions from a logged-in dashboard, and all pending signatures are aggregated across the student’s events.

## User experience

### Student profile and age

- `/register` collects a required `dateOfBirth` value in ISO date format.
- Existing student profile data remains editable; existing rows receive a nullable DOB until the student updates the profile, and event registration remains blocked until DOB is present.
- Under-18 status is calculated on the server from DOB and the event start date. The client does not decide whether a parent is required.

### Form ownership

The existing event form definition remains the source of truth. Ownership is derived from field names to avoid changing the Bionic Sign package:

- Names beginning with `parent_` are parent-owned.
- Names beginning with `student_` are student-owned.
- Names without either prefix remain student-owned for backward compatibility.

The server validates ownership on every save/submit action. Students cannot submit or overwrite parent-owned values, and parents cannot submit or overwrite student-owned values.

All forms attached to an event are automatically assigned to every registration for that event. This supports multiple permission forms without requiring per-student admin assignment. Existing legacy `permissionFormUrl` behavior remains separate and unchanged.

### Student flow

1. The student registers for an event and sees each assigned form.
2. The student fills student-owned fields and saves a draft. Student-owned fields are prefilled where existing behavior supports it, including the student name.
3. If the form has required parent-owned fields and the student is under 18, the student selects a parent email from the profile’s stored parent emails and chooses “Send to parent.”
4. The server creates or refreshes a parent invitation for that registration/form and sends an email containing a one-time link.
5. The student dashboard shows `Student incomplete`, `Parent pending`, or `Complete` for each form. Resending is available subject to the existing email cooldown pattern.

If a student is 18 or older, parent-owned fields are not required for completion and the student may complete the form. If a form has no parent-owned fields, it follows the existing student-only submission flow.

### Parent flow and seamless pairing

The invitation link is tied to the normalized parent email, student, registration, and form. It is stored as a hash with an expiry.

- If the parent is already signed in with the invited email, clicking the link automatically creates the `parent_student_links` row if needed and opens the parent task.
- If the parent is not signed in, the link forwards through the existing email magic-link login flow with a safe return path. After successful authentication with the invited email, the application consumes the invitation, creates the account pairing, and returns the parent to the pending form.
- The parent sees only parent-owned fields and the student/event context, then signs and submits.
- After pairing, the parent dashboard aggregates all pending parent tasks for every linked student and event, including multiple forms for the same event.

The existing manual “Link a Student” flow remains available as a fallback for adding another student. The first version intentionally does not add additional identity verification beyond the invited email and student-selected parent email; stronger verification can be added later.

## Data model

### Student DOB

Add nullable `date_of_birth` text to `students`, represented as `dateOfBirth: string | null` in application code. A later backfill is not possible from current data, so existing users are prompted to complete the field.

### Form workflow

Extend `event_form_submissions` to store the combined draft/final values and workflow metadata:

- `student_values` JSON, initially `{}`
- `parent_values` JSON, initially `{}`
- `student_completed` boolean, initially false
- `parent_completed` boolean, initially false
- `parent_completed_at` nullable timestamp

The existing `values` and `signed_pdf_key` columns remain compatible during migration. New submissions use the separated values, while the final combined values are written to `values`; `signed_pdf_key` is written only when a complete PDF is generated. The unique `(registration_id, event_form_id)` constraint remains the workflow identity.

### Account pairing and invitations

Reuse `parent_student_links` for the durable connection. Add a `parent_form_invites` table so one parent can receive several independent form links without overwriting another invite. It stores an ID, submission ID, normalized email, token hash, expiry, consumed timestamp, and creation timestamp. Invitation rows are the sole source of invitation state; the submission row records only form workflow state.

## Server boundaries and security

- Add shared helpers for DOB/age calculation, field ownership classification, workflow status, invitation issuance/consumption, and combined PDF submission validation.
- Every student route checks the registration belongs to the authenticated student.
- Every parent route checks the authenticated user’s email equals the invitation email and that the parent is linked to the student before reading or writing parent values.
- The invitation token is single-use for auto-pairing, expires, is never stored in plaintext, and is excluded from logs.
- Form definitions are validated with `validateDefinition` before ownership classification.
- Submitted values are validated against the definition, ownership, field type, requiredness, and current workflow state on the server. Browser-disabled fields are not trusted.
- Email errors log only a stable operation message and provider status, never emails, tokens, form values, or PDF contents.

## Routes and UI

- `/register`: add DOB input and server validation.
- `/dashboard`: add parent action aggregation and student per-form statuses/actions.
- `/dashboard/forms/[registrationId]/[formId]`: student draft/save/send-parent flow; retain existing student-only completion behavior.
- `/dashboard/parent/forms/[inviteId]` or an equivalent authenticated parent route: parent-owned form view and submit action after invitation auto-linking.
- `/login` and `/login/verify`: preserve a safe invitation return path and complete pairing after authentication.
- `/admin/events/[id]/registrations`: show workflow status per assigned form and retain admin override controls where already present.

## Failure handling

- Missing DOB blocks event registration with a clear link back to profile completion.
- Missing parent email blocks “Send to parent” but does not discard the student draft.
- Expired or consumed invite links show a recoverable message and offer login/dashboard navigation; they do not expose form data.
- Email delivery failure leaves the draft and prior invite intact, logs a safe error, and returns a retryable error.
- Parent submit with missing/invalid parent fields leaves the task pending and returns field validation errors.
- Student resubmission after parent completion creates a new pending parent state only if it changes required student-owned values; it never silently invalidates a completed parent signature.

## Testing and verification

Add unit/server tests for:

- DOB required validation and under-18 calculation around the event date.
- Field ownership classification, including prefix and backward-compatible unprefixed names.
- Student draft persistence and rejection of parent-owned values.
- Parent invite issuance, cooldown/expiry/single-use behavior, email matching, and automatic account pairing.
- Parent dashboard aggregation across multiple students, events, and forms.
- Parent submission, combined final values/PDF state, and rejection of student-owned values.
- Registration and admin status calculations with partial workflows.

Run focused Vitest tests, `npm run check`, `npm run build`, and `git diff --check`. Exercise the invitation login return path with an end-to-end test if the existing test harness supports seeded auth and email-link tokens.
