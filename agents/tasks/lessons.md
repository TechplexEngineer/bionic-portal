# Lessons Learned

- Keep local database initialization in one startup owner. If the development command resets/migrates/seeds D1, wrapper scripts must not run migrations concurrently.
- When a UI link is requested to match an existing button and share its row, reuse the same Bootstrap button classes and place it in the existing layout row rather than adding a separate text-only block.
