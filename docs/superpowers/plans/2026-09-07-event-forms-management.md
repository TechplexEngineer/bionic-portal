# Event Forms Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split event form administration into a list page, upload/setup page, and Bionic Sign editor with save-back navigation.

**Architecture:** Keep `event_forms` unchanged. The list page owns navigation and metadata; the new page uploads the blank PDF to R2 and creates a form record; the edit page owns definition/name updates and returns to the list.

**Tech Stack:** SvelteKit server loads/actions, Svelte 5, Drizzle D1, Cloudflare R2, Bionic Sign `PdfFormDesigner`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-07-event-forms-management-design.md`

## Global Constraints

- Preserve existing R2 key layout and signed submissions.
- Keep all form routes under the existing admin authorization tree.
- Use Bootstrap utilities and avoid custom CSS.
- Do not add a database migration.

---

### Task 1: Convert the current event forms page into a list

**Files:**
- Modify: `src/routes/(secure)/admin/events/[id]/forms/+page.server.ts`
- Modify: `src/routes/(secure)/admin/events/[id]/forms/+page.svelte`
- Modify: `src/routes/(secure)/admin/events/[id]/forms/forms-page.test.ts`

**Steps:**

- [ ] Add failing assertions that the list renders each form with View/Edit links and a Create New Form link.
- [ ] Run the focused test and confirm it fails because the current page embeds the editor instead of list links.
- [ ] Remove upload/editor state and the save action from the list page; retain event/form loading.
- [ ] Render an empty state, form cards/rows with field counts, and links to `/forms/new` and `/forms/:formId/edit`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Add upload/setup page

**Files:**
- Create: `src/routes/(secure)/admin/events/[id]/forms/new/+page.server.ts`
- Create: `src/routes/(secure)/admin/events/[id]/forms/new/+page.svelte`
- Test: `src/routes/(secure)/admin/events/[id]/forms/new/forms-new-page.test.ts`

**Steps:**

- [ ] Add a failing server test for PDF/name validation and redirect after R2/D1 creation.
- [ ] Run the test and confirm it fails because the new route does not exist.
- [ ] Move the current upload action into the new route, creating the form with an empty definition and redirecting to `/forms/:formId/edit`.
- [ ] Build a setup form containing only name and PDF upload, using the current R2 key convention.
- [ ] Run the focused test and confirm it passes.

### Task 3: Add the Bionic Sign edit page

**Files:**
- Create: `src/routes/(secure)/admin/events/[id]/forms/[formId]/edit/+page.server.ts`
- Create: `src/routes/(secure)/admin/events/[id]/forms/[formId]/edit/+page.svelte`
- Test: `src/routes/(secure)/admin/events/[id]/forms/edit-page.test.ts`

**Steps:**

- [ ] Add a failing markup/server test for loading the existing form and redirecting to the list after save.
- [ ] Run the test and confirm it fails because the edit route does not exist.
- [ ] Load the event form, expose its definition/name to the page, and update only those fields in the save action.
- [ ] Reuse the authenticated base-PDF endpoint through a route-local URL and render `PdfFormDesigner` full width.
- [ ] Submit the updated definition/name and redirect to `/admin/events/:id/forms`.
- [ ] Run focused tests and confirm they pass.

### Task 4: Rewire navigation and verify the complete flow

**Files:**
- Modify: `src/routes/(secure)/admin/events/add/+page.server.ts`
- Modify: `src/routes/(secure)/admin/events/[id]/registrations/+page.svelte`

**Steps:**

- [ ] Update event creation and existing admin links to land on the list page.
- [ ] Run the full unit suite and production build.
- [ ] Run `npm run check` and record only known pre-existing diagnostics if present.
- [ ] Run `git diff --check` and inspect the final route tree.

## Review

- Task reviews passed for the list, setup, editor, and navigation/verification work.
- Final review blocker fixed in `8393992`: the View link now targets the existing authenticated base-PDF endpoint.
- Focused forms tests and build pass. `npm run check` still reports one unrelated pre-existing logout test type error and existing warnings.
- No commit, merge, or push was performed for this work.
