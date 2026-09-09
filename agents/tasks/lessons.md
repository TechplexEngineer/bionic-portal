# Lessons Learned

- Keep local database initialization in one startup owner. If the development command resets/migrates/seeds D1, wrapper scripts must not run migrations concurrently.
- Parent form workflow: parents are logged-in connected accounts with a dashboard action queue; students prepare forms and parents complete parent-owned fields/signatures. Do not model parent completion as an anonymous emailed-link-only flow.
