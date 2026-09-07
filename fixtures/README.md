# Local database fixture

`prod-anonymized.sql` contains five deterministic synthetic students, all five
production events, and the attendance rows associated with those students.
Sessions, magic codes, KV data, payment identifiers, and unneeded users are
excluded. Student names, emails, phones, parent details, profile fields, and
driver names are synthetic.

`npm run dev` resets the local D1 database before starting the development server,
so every new server starts with this sample data. To do the same reset manually:

```sh
npm run db:reset
```

To apply the fixture to an already-migrated, empty local database without removing
the database file:

```sh
npm run db:seed:local
```

The fixture loads five synthetic students, five events, and 74 attendance rows.
It is intended for a fresh database; use `npm run db:reset` to avoid duplicate rows.

To regenerate after an approved production export, keep the raw export outside
the repository and write only the sanitized result into this directory:

```sh
npm run fixture:anonymize -- /path/to/prod-full.sql fixtures/prod-anonymized.sql
```
