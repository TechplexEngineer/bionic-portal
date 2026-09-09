# Parent Form Signatures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DOB-based student eligibility, student/parent-owned form workflows, logged-in parent dashboards, and automatic account pairing from emailed form invitations.

**Architecture:** Keep event forms automatically assigned to every registration. Store draft values separately by signer in the existing submission row, make final PDF storage nullable until both parties finish, and use a dedicated hashed invitation table for concurrent parent links. Generate a parent-safe flattened preview from the student values and use `exportFlattenedPdf` server-side to create the final combined PDF.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Drizzle ORM/D1 SQLite, Cloudflare R2, Brevo SMTP API, bionic-sign, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-parent-form-signatures-design.md`

## Global Constraints

- Field names beginning with `parent_` are parent-owned.
- Field names beginning with `student_` are student-owned.
- Field names without either prefix remain student-owned for backward compatibility.
- Under-18 status is calculated on the server from DOB and the event start date.
- The invitation token is single-use for auto-pairing, expires, is never stored in plaintext, and is excluded from logs.
- Email errors log only a stable operation message and provider status, never emails, tokens, form values, or PDF contents.
- Existing legacy `permissionFormUrl` behavior remains separate and unchanged.
- All event forms attached to an event are automatically assigned to every registration for that event.

## File map

- `src/lib/server/db/schema.ts`: DOB, workflow, and invitation schema.
- `drizzle/0012_parent_form_workflow.sql`: immutable D1 migration.
- `src/lib/server/formWorkflow.ts`: pure ownership, age, status, and value-validation helpers.
- `src/lib/server/parentInvites.ts`: token issue/consume and parent pairing helpers.
- `src/lib/server/brevo.ts`: parent invitation email helper.
- `src/routes/register/+page.server.ts`, `src/routes/register/+page.svelte`: DOB collection/validation.
- `src/routes/(secure)/compete/+page.server.ts`: DOB gate before event registration.
- `src/routes/(secure)/dashboard/forms/[registrationId]/[formId]/+page.server.ts`, `+page.svelte`: student drafts and invitations.
- `src/routes/(secure)/dashboard/parent/+page.server.ts`, `+page.svelte`: parent action queue.
- `src/routes/(secure)/dashboard/parent/forms/[inviteId]/+page.server.ts`, `+page.svelte`, `base/+server.ts`: auto-linked parent form flow and safe PDF preview.
- `src/routes/login/+page.server.ts`, `src/routes/login/verify/+page.server.ts`: invitation return/pairing.
- `src/routes/(secure)/dashboard/+page.server.ts`, `+page.svelte`: workflow-aware dashboards.
- `src/routes/(secure)/admin/events/[id]/registrations/+page.server.ts`, `+page.svelte`: admin status display.
- Matching `*.test.ts` files beside server helpers/routes: regression coverage.

---

### Task 1: Add DOB and workflow database primitives

**Files:**
- Create: `drizzle/0012_parent_form_workflow.sql`
- Modify: `src/lib/server/db/schema.ts`
- Test: `src/lib/server/db/schema.test.ts`

**Interfaces:**
- Produces `students.dateOfBirth: string | null`, nullable `eventFormSubmissions.signedPdfKey`, `studentValues`, `parentValues`, `studentCompleted`, `parentCompleted`, `parentCompletedAt`, and `parentFormInvites`.

- [ ] **Step 1: Write failing schema tests**

Add assertions that the schema exports `parentFormInvites`, exposes the new student/workflow columns, and permits a final submission record without a signed PDF key.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm run test:unit -- --run src/lib/server/db/schema.test.ts`
Expected: FAIL because the new columns/table are absent.

- [ ] **Step 3: Implement schema and migration**

Add nullable DOB and workflow columns. Rebuild `event_form_submissions` in SQL so `signed_pdf_key` is nullable while preserving its unique constraint and foreign keys. Create `parent_form_invites` with foreign key to the submission, normalized email, token hash, expiry, consumed timestamp, and creation timestamp, plus an index/unique constraint preventing more than one active token for the same submission/email.

- [ ] **Step 4: Run schema tests and local migration**

Run: `npm run test:unit -- --run src/lib/server/db/schema.test.ts`
Run: `npm run db:reset`
Expected: PASS and migration applies to the local D1 database.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/db/schema.ts drizzle/0012_parent_form_workflow.sql src/lib/server/db/schema.test.ts
git commit -m "feat: add parent form workflow schema"
```

### Task 2: Add pure workflow and invitation services

**Files:**
- Create: `src/lib/server/formWorkflow.ts`
- Create: `src/lib/server/formWorkflow.test.ts`
- Create: `src/lib/server/parentInvites.ts`
- Create: `src/lib/server/parentInvites.test.ts`
- Modify: `src/lib/server/brevo.ts`
- Test: `src/lib/server/brevo.test.ts`

**Interfaces:**
- Produces `getAgeOnDate(dateOfBirth, date)`, `getOwnedFields(definition, owner)`, `validateOwnedValues(definition, values, owner)`, `getFormStatus(...)`, `issueParentFormInvite(...)`, `consumeParentFormInvite(...)`, and `sendParentFormInvite(...)`.

- [ ] **Step 1: Write failing unit tests**

Cover DOB birthday boundaries, owner classification, rejection of cross-owner/type/required values, status combinations, token hash/expiry/single-use behavior, email normalization, and safe Brevo payload generation.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- --run src/lib/server/formWorkflow.test.ts src/lib/server/parentInvites.test.ts src/lib/server/brevo.test.ts`
Expected: FAIL because the helpers are absent.

- [ ] **Step 3: Implement minimal helpers**

Use the existing SHA-256/base64url pattern from `magicLinks.ts`. Validate values with the bionic-sign field types and preserve unknown/unowned values out of persisted updates. `getFormStatus` must distinguish student incomplete, parent pending, and complete while allowing adult forms to complete without parent values.

- [ ] **Step 4: Run tests to verify green**

Run the same focused command; expected PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/formWorkflow.ts src/lib/server/formWorkflow.test.ts src/lib/server/parentInvites.ts src/lib/server/parentInvites.test.ts src/lib/server/brevo.ts src/lib/server/brevo.test.ts
git commit -m "feat: add form ownership and parent invite services"
```

### Task 3: Collect DOB and gate new registrations

**Files:**
- Modify: `src/routes/register/+page.server.ts`
- Modify: `src/routes/register/+page.svelte`
- Modify: `src/routes/(secure)/compete/+page.server.ts`
- Test: `src/routes/register/register.server.test.ts`
- Test: `src/routes/(secure)/compete/compete-page.server.test.ts`

**Interfaces:**
- Consumes `getAgeOnDate` validation primitives.
- Produces a required `students.dateOfBirth` profile value and a clear event-registration failure for profiles without DOB.

- [ ] **Step 1: Add failing action tests**

Assert missing/invalid DOB fails profile save, valid DOB is inserted and updated, and event registration without DOB returns a profile-completion message without inserting a registration.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run test:unit -- --run src/routes/register/register.server.test.ts src/routes/(secure)/compete/compete-page.server.test.ts`
Expected: FAIL because DOB is not read, stored, or checked.

- [ ] **Step 3: Implement server and form changes**

Read `dateOfBirth`, validate strict `YYYY-MM-DD` and a non-future date, persist it in insert/upsert sets, render a required date input beside the student identity fields, and add the registration gate before duplicate checking.

- [ ] **Step 4: Run tests and check markup**

Run the focused tests and `npm run check`; expected PASS with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/register src/routes/'(secure)'/compete src/routes/register/register.server.test.ts src/routes/'(secure)'/compete/compete-page.server.test.ts
git commit -m "feat: collect student date of birth"
```

### Task 4: Implement student drafts and send-parent flow

**Files:**
- Modify: `src/routes/(secure)/dashboard/forms/[registrationId]/[formId]/+page.server.ts`
- Modify: `src/routes/(secure)/dashboard/forms/[registrationId]/[formId]/+page.svelte`
- Create/Modify: `src/routes/(secure)/dashboard/forms/[registrationId]/[formId]/form-page.server.test.ts`

**Interfaces:**
- Consumes `formWorkflow`, `parentInvites`, and `sendParentFormInvite`.
- Produces student actions `saveDraft`, `sendParent`, and `submit` with server-enforced ownership and a student form model containing workflow status and parent email choices.

- [ ] **Step 1: Write failing route tests**

Test student-owned draft persistence with no PDF, rejection of parent-owned values, parent email requirement, invite creation/email call, adult completion, and final complete submission for forms without parent fields.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npm run test:unit -- --run 'src/routes/(secure)/dashboard/forms/[registrationId]/[formId]/form-page.server.test.ts'`
Expected: FAIL because draft and invitation actions do not exist.

- [ ] **Step 3: Implement server actions**

Load the registration/form/student relationship, load or create the workflow row, merge only the submitted student-owned values, calculate adult/under-18 requirements using event start date, issue an invite for a selected stored parent email, and write the final combined values/PDF only when completion criteria are met.

- [ ] **Step 4: Implement student UI**

Show saved workflow status, student-editable fields, a save-draft button, parent email selector and send/resend button when needed, and clear pending/complete messaging. Keep the existing filler for the student’s editable view and submit its values to the new actions.

- [ ] **Step 5: Run tests and type checks**

Run the focused test and `npm run check`; expected PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/'(secure)'/dashboard/forms
git commit -m "feat: save student form drafts and invite parents"
```

### Task 5: Implement invitation auto-pairing and parent form completion

**Files:**
- Create: `src/routes/(secure)/dashboard/parent/+page.server.ts`
- Create: `src/routes/(secure)/dashboard/parent/+page.svelte`
- Create: `src/routes/(secure)/dashboard/parent/forms/[inviteId]/+page.server.ts`
- Create: `src/routes/(secure)/dashboard/parent/forms/[inviteId]/+page.svelte`
- Create: `src/routes/(secure)/dashboard/parent/forms/[inviteId]/base/+server.ts`
- Modify: `src/routes/login/+page.server.ts`
- Modify: `src/routes/login/verify/+page.server.ts`
- Test: `src/routes/(secure)/dashboard/parent/parent-page.server.test.ts`
- Test: `src/routes/(secure)/dashboard/parent/forms/parent-form-page.server.test.ts`
- Test: `src/routes/login/login.server.test.ts`

**Interfaces:**
- Consumes `parentFormInvites`, durable `parentStudentLinks`, `formWorkflow`, and `exportFlattenedPdf`.
- Produces automatic pairing from invitation, parent task aggregation, parent-only form editing, and final combined PDF persistence.

- [ ] **Step 1: Write failing tests**

Cover signed-in invite consumption creating the link, mismatched email rejection, login return preserving the invite, parent queue aggregation over multiple registrations/forms, parent-only value validation, and final PDF generation from combined values.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npm run test:unit -- --run 'src/routes/(secure)/dashboard/parent/**/*.test.ts' src/routes/login/login.server.test.ts`
Expected: FAIL because parent routes and invitation completion are absent.

- [ ] **Step 3: Implement auto-pairing and login continuation**

On an invited request, require the authenticated user email to match the invitation. If unauthenticated, redirect to `/login?next=<safe invite route>` and carry the invite ID through verification. After magic-link authentication, consume the invitation and upsert `parent_student_links` before returning to the task.

- [ ] **Step 4: Implement parent task and safe preview**

Aggregate pending parent workflows for all links. Serve a preview PDF flattened with student values and a definition containing only parent-owned fields, so the parent cannot edit student fields in the UI. On parent submit, merge validated parent values with stored student values and call `exportFlattenedPdf` against the original base PDF before storing the final PDF and combined `values`.

- [ ] **Step 5: Implement parent dashboard/form UI**

Use Bootstrap cards/list groups to show student, event, form, and pending status. Provide one-click task links, parent-only filler/signature controls, and success/error states. Keep the manual student-link fallback intact.

- [ ] **Step 6: Run tests and checks**

Run focused tests and `npm run check`; expected PASS.

- [ ] **Step 7: Commit**

```bash
git add src/routes/'(secure)'/dashboard/parent src/routes/login
git commit -m "feat: auto-link parents and complete signature tasks"
```

### Task 6: Update dashboards and admin workflow status

**Files:**
- Modify: `src/routes/(secure)/dashboard/+page.server.ts`
- Modify: `src/routes/(secure)/dashboard/+page.svelte`
- Modify: `src/routes/(secure)/admin/events/[id]/registrations/+page.server.ts`
- Modify: `src/routes/(secure)/admin/events/[id]/registrations/+page.svelte`
- Test: `src/routes/(secure)/dashboard/dashboard-page.server.test.ts`
- Test: `src/routes/(secure)/admin/events/[id]/registrations/registrations-page.server.test.ts`

**Interfaces:**
- Consumes `getFormStatus` and parent queue data.
- Produces accurate student, parent, and admin workflow labels for partial and complete forms.

- [ ] **Step 1: Write failing status tests**

Assert student action items show parent pending separately from student incomplete, parent dashboard data is exposed for linked users, and admin totals count only fully complete forms.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npm run test:unit -- --run 'src/routes/(secure)/dashboard/dashboard-page.server.test.ts' 'src/routes/(secure)/admin/events/[id]/registrations/registrations-page.server.test.ts'`
Expected: FAIL because existing code treats any submission as complete.

- [ ] **Step 3: Implement server load changes**

Replace submission-exists checks with workflow status calculations, include parent tasks for parent users, and preserve the existing paid/legacy permission-form logic.

- [ ] **Step 4: Implement UI status/actions**

Render per-form badges/actions using Bootstrap utilities, link students to drafts and parents to signature tasks, and show aggregate pending items without adding custom styling.

- [ ] **Step 5: Run focused tests and type checks**

Run focused tests and `npm run check`; expected PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/'(secure)'/dashboard src/routes/'(secure)'/admin/events/'[id]'/registrations
git commit -m "feat: show parent signature workflow status"
```

### Task 7: Full verification and end-to-end invitation flow

**Files:**
- Modify: `e2e/demo.test.ts`
- Modify: `docs/superpowers/plans/2026-09-08-parent-form-signatures.md`

- [ ] **Step 1: Run all unit tests**

Run: `npm run test:unit -- --run`
Expected: PASS.

- [ ] **Step 2: Run static checks and build**

Run: `npm run check && npm run build`
Expected: PASS with no Svelte/type/build errors.

- [ ] **Step 3: Run browser tests**

Add an end-to-end scenario using the existing seeded test setup: complete a student profile with DOB, register for an event with two forms, save student values, issue an invitation, authenticate the parent with the invited email, confirm automatic pairing and two parent dashboard tasks, and complete both parent signatures. Run: `npm run test:e2e`. Expected: PASS.

- [ ] **Step 4: Inspect diff and migration**

Run: `git diff --check && git diff main...HEAD --stat && git status --short`
Confirm the generated `vendor/bionic-sign/.svelte-kit/` directory remains untracked and is not included in feature commits.

- [ ] **Step 5: Add review notes to this plan**

Append a `## Review` section listing tests run, any limitations, and the final workflow/security review.

- [ ] **Step 6: Commit verification notes**

```bash
git add docs/superpowers/plans/2026-09-08-parent-form-signatures.md
git commit -m "docs: record parent form workflow verification"
```

## Review

- Implemented migration `0012_parent_form_workflow.sql` with nullable DOB, partial workflow values, nullable final PDF storage, and hashed parent invitation records.
- Implemented server-owned field classification, DOB-based age calculation, student draft persistence, parent invitation email, automatic pairing, parent dashboard aggregation, parent-only form view, and combined final PDF generation.
- Updated student/admin dashboard completion logic so drafts and parent-pending forms are not reported as fully complete.
- Verification: `npm run test:unit -- --run` — 27 files and 111 tests passed.
- Verification: `npm run check` — exit 0, 0 errors, 36 existing Svelte warnings.
- Verification: `npm run build` — exit 0.
- Verification: `git diff --check` — exit 0.
- Browser verification: `npm run test:e2e` was blocked by the dev server timing out while loading `src/styles/bootstrap.scss`; the existing home-page test received HTTP 500 before the feature flow could run.
- The pre-existing generated `vendor/bionic-sign/.svelte-kit/` directory remains untracked and was not included in commits.
