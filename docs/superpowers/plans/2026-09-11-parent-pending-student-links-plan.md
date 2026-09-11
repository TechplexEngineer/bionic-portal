# Parent pending student links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let parents register before students and automatically connect valid pending student emails when those students register.

**Architecture:** Persist normalized pending parent/student email pairs in a dedicated table. Parent registration links existing students immediately and stores unknown emails as pending; student registration resolves and removes matching pending records after its student upsert.

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, Drizzle ORM, Cloudflare D1/SQLite, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-11-parent-pending-student-links-design.md`

## Global Constraints

- Keep migrations forward-only and do not edit applied migrations.
- Validate email syntax on the server using the existing repository rule.
- Use Bootstrap utilities and existing form patterns; avoid custom styling.
- Preserve idempotent linking with conflict-safe inserts.

### Task 1: Add pending-link schema and migration

**Files:**

- Modify: `src/lib/server/db/schema.ts`
- Create: `drizzle/0015_pending_parent_student_links.sql`

- [x] Add `pendingParentStudentLinks` with parent id and normalized email; make `(parent_id, student_email)` unique.
- [x] Add the corresponding forward-only SQL migration and keep the foreign key to `user.id`.
- [x] Run the schema-focused tests and migration generation/check appropriate to the repository.

### Task 2: Test and implement parent pending-link behavior

**Files:**

- Modify: `src/routes/(secure)/register/parent/+page.server.ts`
- Modify: `src/routes/(secure)/register/parent/parent-registration.server.test.ts`

- [x] Write failing tests for malformed email rejection, saving an unknown email as pending, and safe duplicate pending submissions.
- [x] Run the focused tests and confirm they fail for the missing behavior.
- [x] Implement server-side email validation, pending-link load data, pending-link creation, and a `removePendingStudent` action.
- [x] Run the focused tests and confirm they pass.

### Task 3: Update parent UI for pending emails and typo recovery

**Files:**

- Modify: `src/routes/(secure)/register/parent/+page.svelte`

- [x] Render pending emails with a remove button and explain that they will link automatically after student registration.
- [x] Keep multiple editable email rows and show server validation errors without clearing the draft rows.
- [x] Run `npm run check` and the client/build checks.

### Task 4: Resolve pending links during student registration

**Files:**

- Modify: `src/routes/register/+page.server.ts`
- Modify: `src/routes/register/register.server.test.ts`

- [x] Write a failing test for resolving a pending parent link after student registration.
- [x] Run the focused test and confirm it fails for the missing resolution behavior.
- [x] After the student upsert, insert parent links for matching pending emails and delete fulfilled pending rows.
- [x] Run focused and full unit tests.

### Task 5: Verify and integrate

**Files:**

- Modify: `docs/superpowers/specs/2026-09-11-parent-pending-student-links-design.md`
- Modify: `docs/superpowers/plans/2026-09-11-parent-pending-student-links-plan.md`

- [x] Run `git diff --check`, focused tests, all unit tests, `npm run check`, formatting checks, and `npm run build`.
- [x] Review the final diff for partial-write or privacy issues and record results in the plan.
- [ ] Commit, push the feature branch, merge into local `main`, and push `main`.

## Review

- Parent registration now saves the parent profile even when students have not registered, storing normalized pending email requests.
- Pending requests are visible and removable, providing typo recovery without requiring a second parent registration.
- Server-side email format validation rejects malformed rows before database writes.
- Student registration automatically creates parent links and removes fulfilled pending requests.
- Verification: 136 unit tests, `npm run check`, `npm run build`, targeted Prettier checks, and `git diff --check` pass. Existing Svelte warnings remain unchanged.
