# Lessons Learned

- Keep local database initialization in one startup owner. If the development command resets/migrates/seeds D1, wrapper scripts must not run migrations concurrently.
- When a UI link is requested to match an existing button and share its row, reuse the same Bootstrap button classes and place it in the existing layout row rather than adding a separate text-only block.
- When sibling landing-page options have unequal content, use equal-width Bootstrap cards with consistent internal structure to preserve visual symmetry.
