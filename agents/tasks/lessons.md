# Lessons Learned

- Keep local database initialization in one startup owner. If the development command resets/migrates/seeds D1, wrapper scripts must not run migrations concurrently.
- Parent form workflow: parents are logged-in connected accounts with a dashboard action queue; students prepare forms and parents complete parent-owned fields/signatures. Do not model parent completion as an anonymous emailed-link-only flow.
- When a UI link is requested to match an existing button and share its row, reuse the same Bootstrap button classes and place it in the existing layout row rather than adding a separate text-only block.
- When sibling landing-page options have unequal content, use equal-width Bootstrap cards with consistent internal structure to preserve visual symmetry.
- When a user corrects a form requirement after implementation, enforce it in both the browser markup and the server action, and add a regression test for bypassing client-side validation.
