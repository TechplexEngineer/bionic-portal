# Lessons Learned

- **Form Styling**: Form fields do not need a background color.
- **Styling Guidelines**: Minimize use of custom styling/CSS. Rely on Bootstrap elements and utility classes wherever possible.
- **Testing Requirements**: Each new feature needs tests to ensure functionality and prevent regressions.
- **Operational Errors**: User-facing configuration failures must emit a server-side error log without including secrets or personal data.
- **Patch Validation**: After editing nested Svelte directives, inspect the exact changed block before running tests so malformed or duplicated attributes are caught immediately.
- **Migration Immutability**: Once a database migration is committed and applied, never edit it; migrations are applied sequentially, so later schema changes require a new migration.
- **Workflow Autonomy**: Proceed with implementation without waiting for design approval; pause only when scope or authorization would materially change.
- **Enhanced Form State**: SvelteKit's default `use:enhance` resets submitted forms; editable rows should use explicit draft state and a custom `reset: false` update when saved values must remain visible.
- **Enhanced Form Navigation**: Actions submitted with `use:enhance` should return success instead of redirecting when the URL does not change; same-page redirects reset the browser scroll position.
- **Unique Each Keys**: When adding keyed Svelte loops to reusable tables, key by the rendered column position or another guaranteed-unique identity; data-field names can legitimately repeat across columns.
- **Student List Visibility**: Keep hidden status available to row actions, but do not render it as a student-list column when the UI requirement is to expose only the toggle action.
