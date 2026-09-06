# Lessons Learned

- **Form Styling**: Form fields do not need a background color.
- **Styling Guidelines**: Minimize use of custom styling/CSS. Rely on Bootstrap elements and utility classes wherever possible.
- **Testing Requirements**: Each new feature needs tests to ensure functionality and prevent regressions.
- **Operational Errors**: User-facing configuration failures must emit a server-side error log without including secrets or personal data.
- **Patch Validation**: After editing nested Svelte directives, inspect the exact changed block before running tests so malformed or duplicated attributes are caught immediately.
- **Migration Immutability**: Once a database migration is committed and applied, never edit it; migrations are applied sequentially, so later schema changes require a new migration.
