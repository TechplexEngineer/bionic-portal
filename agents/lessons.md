# Lessons Learned

- **Form Styling**: Form fields do not need a background color.
- **Styling Guidelines**: Minimize use of custom styling/CSS. Rely on Bootstrap elements and utility classes wherever possible.
- **Testing Requirements**: Each new feature needs tests to ensure functionality and prevent regressions.
- **Operational Errors**: User-facing configuration failures must emit a server-side error log without including secrets or personal data.
