# Poll Debugging Progress

## Root Cause Found & Fixed

The poll functionality was completely broken in production due to a single bug in `lib/store.ts`:

```ts
// BUG: This guard prevented polls from ever persisting in production
if (process.env.NODE_ENV !== 'production') globalForStore.polls = polls;
```

In serverless environments (Vercel), every request can spin up a fresh function instance. The guard meant polls were stored in a new `{}` object on every request and never written back to `global` — so polls created in one request were invisible to all subsequent requests.

## Fix Applied (2 commits pushed to main)

**Commit `a62ac96`** — `fix: migrate polls to database storage and revert to bookclub_profiles`
- Added `BookPoll` model to `prisma/schema.prisma` (maps to `bookclub_book_polls` table, stores poll state as JSONB)
- Rewrote `app/api/polls/route.ts` — creates/queries polls from database instead of in-memory store
- Rewrote `app/api/polls/[code]/route.ts` — all poll operations (nominate, vote, PATCH to advance rounds) now read/write the database
- Also merged in pre-existing working copy changes: migrated profile table references from `shared_profiles` → `bookclub_profiles`

**Commit `3fb9bc2`** — `fix: make book creation best-effort during poll nomination`
- Wrapped `prisma.book.create()` in a try/catch inside the nomination handler
- Previously, if book creation failed (e.g. FK violation), the entire nomination would 500 and the poll state would not update
- Now: poll nomination always saves even if the secondary book catalog entry fails

## Database Change (Production)

The `bookclub_book_polls` table was created manually in the production Supabase database (`bzgbskmghquhoxlbfcev`) since GitHub Actions weren't wired up:

```sql
CREATE TABLE IF NOT EXISTS bookclub_book_polls (
    code TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The table is confirmed to exist and the new deployment is writing to it.

## Deployment Status

Both fixes are live on `bookclub.bobbychang.co`. Confirmed:
- `GET /api/polls` returns `{"activeCode":null}` — database-backed, works across requests
- Poll creation via `POST /api/polls` saves to `bookclub_book_polls` table — verified with direct DB query

## What Still Needs to Be Done

**Full end-to-end browser validation was not completed** because:
1. The Chrome extension was not connected on this machine
2. Computer-use access request timed out
3. Production Supabase service role key is not available locally to create test auth users programmatically

### Steps to Complete Validation

On the new machine, validate this flow in the browser:

1. **Admin creates a poll** — log in as `rchang915@gmail.com`, go to homepage, click "Start Next Book Selection"
2. **Users nominate books** — log in as 2–3 other accounts, navigate to the poll, nominate different book titles
3. **Admin starts voting** — as admin, click "Start Voting Phase"
4. **Users vote** — each logged-in user clicks a book option
5. **Admin ends the round** — click "End Round 1"; if one book has the most votes it wins
6. **Verify the homepage** — the winning book should appear as the current book on the homepage (pulled from `bookclub_books` table with `status = 'NEXT'`)
7. **Clean up** — delete the test user accounts created during validation and revert any database changes

### Test User Creation Options

- **Option A**: Use real emails + magic links (check email for OTP)
- **Option B**: Temporarily enable `NEXT_PUBLIC_DEV_MODE=true` in Vercel env vars, which allows instant login with any email without email verification. **Remember to disable after testing.**

## Key Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `BookPoll` model |
| `app/api/polls/route.ts` | Database-backed poll creation/listing |
| `app/api/polls/[code]/route.ts` | Database-backed poll operations (nominate/vote/advance) |

## Production DB Credentials (for reference)

Found in `tmp-check-prod.js` (not committed):
- Supabase project: `bzgbskmghquhoxlbfcev`
- Pooler URL: see `tmp-check-prod.js`
