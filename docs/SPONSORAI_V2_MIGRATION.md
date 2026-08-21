# SponsorAI V2 — database migration

The repository previously used `prisma db push` and had no checked-in migration history. The V2 migration is therefore a delta from the V1 schema committed in Git:

`prisma/migrations/20260821190000_sponsorai_v2_core/migration.sql`

## Existing database

1. Take and verify a PostgreSQL backup.
2. Confirm the live schema matches the pre-V2 `prisma/schema.prisma` revision.
3. Review the generated SQL delta.
4. Apply the delta in a maintenance window using the deployment process for that environment.
5. Run `npx prisma generate` for the application image.
6. Run the smoke checks below before enabling outreach.

Do not run `prisma migrate deploy` blindly on an existing database that has no Prisma migration history. Either baseline migration tracking first or apply this reviewed delta through the database deployment mechanism.

## Fresh development database

The current development convention remains:

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

## Smoke checks

- Open `/prospection` and verify contact coordinates are not present in the page payload.
- Enrich a controlled test company and confirm only role/contactability summaries appear.
- Confirm a first outreach is blocked until human approval is recorded.
- Send only to a controlled test recipient.
- Post a signed provider webhook fixture and verify `OutreachEvent` and `LearningEvent` are idempotent.
- Create a test meeting, proposal and external contract; mark the contract signed and confirm the Deal timeline and attribution.

No migration or live send is performed automatically by the application build.
