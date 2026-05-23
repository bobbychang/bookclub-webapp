# Valencia Bookclub Webapp

Canonical documentation for humans and AI agents working on this project.

## Purpose

Valencia Bookclub Webapp is a Next.js app for running a small book club. It shows the current book, lets members manage their identity, collects community book recommendations, runs book-selection polls, and schedules the next meeting.

When functionality changes, update this file in the same pull request or commit. Capture the intent of the behavior, not only the implementation details, so future humans and AI agents can understand why the feature exists.

## Current Functionality

### Home Page

- Shows the club name from `BOOKCLUB_NAME`.
- Shows the current next book title, author, and cover image.
- Loads the current book from the `bookclub_books` table where `status = NEXT`.
- If no next book exists, show placeholder text, "Next book under selection", without creating a default book record.
- Shows identity controls, scheduling, book selection, recommendations, and previous books on one main page.

### Authentication and Profiles

- Uses Supabase Auth email magic links in normal mode.
- Uses `NEXT_PUBLIC_DEV_MODE=true` to enable an instant email login bypass for development and testing.
- Stores user profile data in the app-specific `bookclub_profiles` table.
- Requires a display name before a member can recommend books, nominate books, vote in polls, mark availability, or RSVP.
- Assumes every row in `bookclub_profiles` belongs to a bookclub member.
- Treats the current host/admin as `rchang915@gmail.com` when creating or updating a profile.
- Admin-only API routes verify `bookclub_profiles.isAdmin`.

### Scheduling

Scheduling uses persistent Supabase/PostgreSQL tables.

- If no scheduling poll exists, members see that the host is choosing dates.
- Admins can start a scheduling round.
- Admins choose proposed dates with a calendar.
- Submitting proposed dates moves the scheduling poll to `VOTING`.
- Members mark each proposed date as `YES`, `MAYBE`, or `NO`.
- Group availability is visible while voting is open.
- Admins can finalize one date.
- A finalized poll shows the confirmed date, location, and guest list.
- Admins can add or edit the finalized location.
- Members can continue to RSVP `YES`, `MAYBE`, or `NO` for the finalized date.
- Admins can start a new scheduling round after one is finalized.

### Book Recommendations and History

- Members with display names can recommend future books.
- Recommendations are stored as `bookclub_books` rows with `status = FUTURE_SUGGESTION`.
- Book metadata is looked up from OpenLibrary by title.
- If OpenLibrary metadata is unavailable, the app still stores the title.
- The recommender or an admin can remove a recommendation.
- Admins can promote a recommendation to the next book.
- Promoting a new next book moves the existing next book to completed history.
- Admins can mark recommendations as read.
- Admins can manually add previous books with optional author, recommender, and completed date.
- Previous books are shown in a table.

### Book Selection Polls

Book selection is a ranked-choice-style elimination poll implemented in memory, not in the database.

- Admins can start a new book selection from the home page when no active poll exists.
- New polls receive a short random code and begin in the `nominating` phase.
- Members nominate a book by typing a title or choosing an existing recommendation from the datalist.
- Members can skip nomination.
- New nominations are also added to the recommendations table when possible.
- Admins start the voting phase after nominations.
- Voting options are the unique nominated titles.
- If fewer than two options exist, placeholder defaults are added by the current implementation.
- Members vote for one remaining option each round.
- Admins end a round, eliminating the lowest-vote option or options.
- If all remaining options tie, the app starts another round with the same options.
- When one option remains, the poll finishes and that option becomes the winner.
- On completion, the app attempts to move the previous next book to completed and promote the winning title to `NEXT`.
- Poll state lives in `lib/store.ts` and can be lost on server restart or process replacement.

## Requirements

### User Requirements

- Users must be able to sign in with email.
- Users must be able to create or update a display name.
- Public page content should remain readable to guests.
- Actions that affect group state should require a signed-in profile with a display name.
- Admin-only actions must be limited to admin profiles.

### Scheduling Requirements

- Members must be able to see whether date selection is waiting on the host, open for availability, or finalized.
- Admins must be able to create a scheduling round, propose dates, finalize a date, and manage the final location.
- Members must be able to answer each proposed date with `YES`, `MAYBE`, or `NO`.
- Members must be able to see other members' availability while scheduling is open.
- After finalization, members must be able to RSVP for the final date.
- The final scheduling view must show the confirmed date, location if known, and grouped guest list.

### Book Management Requirements

- Members must be able to recommend future books.
- Recommendations should include title, author when known, cover URL when known, recommender, and status.
- When no book has `NEXT` status, the app must show placeholder text instead of creating or displaying a default book.
- Admins must be able to choose the next book from recommendations.
- The previous next book should be preserved as a completed book when a new next book is selected.
- Admins must be able to record previous books manually.
- Members or admins must be able to delete recommendations they own or administer.

### Polling Requirements

- Admins must be able to start a book selection poll.
- Members must be able to nominate or skip.
- Admins must be able to open voting after nominations.
- Members must be able to vote once per active round, with later votes replacing their prior choice in that round.
- Admins must be able to resolve rounds until a winner remains.
- The winning title should become the next book.
- Future work should make poll state persistent before relying on it for important production decisions.

## Technical Overview

### Stack

- Framework: Next.js App Router
- Language: TypeScript
- UI: React, Tailwind CSS v4, lucide-react icons
- Auth: Supabase Auth with `@supabase/ssr`
- Database: Supabase PostgreSQL via Prisma
- ORM: Prisma 6.2.1
- Date UI: `react-day-picker`
- Tests: Playwright
- Deployment: Vercel 
- Version Control: github at `git@github.com:bobbychang/bookclub-webapp.git`

### Important Paths

- `app/page.tsx`: Main book club page.
- `app/poll/[code]/page.tsx`: Book-selection poll UI.
- `components/Auth/*`: Email login, profile setup, profile widget, auth wrapper.
- `components/Scheduling/*`: Date proposal, availability, RSVP, and availability grid UI.
- `components/Recommendations.tsx`: Recommendations and previous books UI.
- `app/api/books/route.ts`: Book CRUD and status transitions.
- `app/api/recommendations/route.ts`: Recommendation-specific API.
- `app/api/polls/*`: In-memory poll creation and voting.
- `app/api/admin/scheduling/*`: Admin scheduling mutation routes.
- `prisma/schema.prisma`: Database models and table mappings.
- `lib/books.ts`: OpenLibrary metadata lookup and default cover handling.
- `lib/routes.ts`: Base path helpers for `/bookclub` deployments.

### Data Model

Prisma models map to these database tables:

- `Profile` maps to `bookclub_profiles`.
- `SchedulingPoll` maps to `bookclub_scheduling_polls`.
- `ProposedDate` maps to `bookclub_proposed_dates`.
- `Availability` maps to `bookclub_availabilities`.
- `Book` maps to `bookclub_books`.

Book status values:

- `FUTURE_SUGGESTION`: Recommended for future selection.
- `NEXT`: Current next book.
- `COMPLETED`: Previously read book.

Scheduling status values used by the app:

- `IDLE`: No active scheduling work.
- `PROPOSING`: Admin is choosing dates.
- `VOTING`: Members are marking availability.
- `FINALIZED`: Date has been selected.

## Database Safety Rules

This project shares one Supabase/PostgreSQL backend with other personal projects. Database isolation is critical.

- Every bookclub-specific table, view, function, trigger, migration, and query target must use the `bookclub_` prefix.
- All app functionality must read and write only `bookclub_*` tables, plus Supabase's managed `auth.users` table through supported Auth APIs.
- Profiles are no longer shared between apps. Use `bookclub_profiles` for all profile reads, writes, and foreign keys.
- Authentication uses Supabase's global `auth.users` table.
- Foreign keys for bookclub data should target `bookclub_profiles` when they reference users.
- Row Level Security should be enabled for `bookclub_*` tables exposed to browser clients. Policies should restrict mutations to the signed-in user's own profile/rows or to admin users, while allowing read access only where the product requires it.
- Do not query, alter, drop, or infer ownership of another project's prefixed tables.
- Review SQL and Prisma migrations for prefix safety before running them.
- Prefer additive migrations and targeted updates over destructive schema changes.

## Environment Variables

Common variables used by the app:

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_BASE_PATH=
```

Notes:

- Prisma uses `DATABASE_URL`.
- Schema pushes and direct database operations may require `DIRECT_URL`.
- Supabase pooler connections commonly use port `6543` with `sslmode=require`.
- Direct Supabase connections commonly use port `5432`.
- Set `NEXT_PUBLIC_BASE_PATH=/bookclub` when serving the app under that path.
- `NEXT_PUBLIC_DEV_MODE=true` enables instant login and should be handled carefully if pointed at production data.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Deployment Notes

- The app is deployed on Vercel at `https://bookclub-tau-fawn.vercel.app`.
- The public domain is `bookclub.bobbychang.co`.
- Manage production environment variables and deployment settings in Vercel.


## AI Agent Instructions

AI agents should keep this file as the canonical source of project intent.

- Before changing behavior, read this file and the relevant code.
- When adding, removing, or changing functionality, update the requirements and functionality sections in this file in the same change.
- Document the user-facing intent first, then implementation notes where they help future maintainers.
- Keep the documentation readable by both humans and AI agents: use clear headings, stable names, explicit status values, and concrete file paths.
- Preserve database isolation rules for every database-related change.
- Do not use unprefixed or other-project tables.
- Do not treat the in-memory poll store as durable data.
- When adding new persistent data, update `prisma/schema.prisma`, migration/setup notes, and this README together.
- When adding new routes that need the `/bookclub` base path, use `appPath()` or `apiPath()`.
- When adding admin functionality, enforce authorization server-side, not only in the UI.
- When using OpenLibrary or another external service, preserve graceful fallback behavior.
- If original requirements are ambiguous, infer from the codebase, document the assumption, and leave enough detail for the user to correct it.

## Known Gaps and Follow-Up Work

- Book-selection polls are not persistent and can be lost on restart.
- Poll admin checks are partly UI/query based in the poll page; important admin mutations should be hardened server-side before broader use.
- The poll flow adds placeholder options when fewer than two nominations exist.
- A dedicated admin dashboard is still pending.
- Some scheduling writes happen directly from client components through Supabase; ensure Row Level Security policies continue to match the intended access model.
