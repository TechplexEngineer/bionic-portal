# Lessons Learned

- Keep local database initialization in one startup owner. If the development command resets/migrates/seeds D1, wrapper scripts must not run migrations concurrently.
