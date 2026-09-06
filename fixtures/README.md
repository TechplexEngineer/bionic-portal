# Local database fixture

`prod-anonymized.sql` contains five deterministic synthetic students, all five
production events, and the attendance rows associated with those students.
Sessions, magic codes, KV data, payment identifiers, and unneeded users are
excluded. Student names, emails, phones, parent details, profile fields, and
driver names are synthetic.

To load it into a fresh local D1 database:

```sh
npm run db:reset
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<local-db>.sqlite < fixtures/prod-anonymized.sql
```

To regenerate after an approved production export, keep the raw export outside
the repository and write only the sanitized result into this directory:

```sh
npm run fixture:anonymize -- /path/to/prod-full.sql fixtures/prod-anonymized.sql
```
