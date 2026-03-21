# Valencia Bookclub Webapp - Project State & Context

## 🎯 Current Status
The project has been transformed from a simple voting app into a full Book Club Home Page with authentication and scheduling features. It is currently deployed on an AWS EC2 instance.

## 🏗️ Architecture & Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL) managed via **Prisma 6.2.1**
- **Authentication**: Email Magic Links (Supabase Auth)
- **Styling**: Tailwind CSS
- **Deployment**: AWS EC2 (Amazon Linux) with a custom `deploy.sh` script.

## ✅ Completed Features
1. **Landing Page**: Styled home page for "Valencia Bookclub Boys" featuring the next book and a dynamic scheduling section.
2. **Auth System**:
   - Switched from SMS to **Email Magic Links**.
   - Admin account: `rchang915@gmail.com`.
   - Dev Mode bypass for local/prod testing (Login as Admin/User A/User B).
3. **Scheduling System**:
   - **Phase 1 (Proposing)**: Admin chooses dates from a calendar.
   - **Phase 2 (Voting)**: Members mark availability (Yes, No, Maybe).
   - **Phase 3 (Finalized)**: Admin confirms a date; UI replaces poll with a confirmation announcement and attendee grid.
4. **DevOps**:
   - Git repository initialized and linked to `https://github.com/bobbychang/bookclub-webapp.git`.
   - Deployment script `deploy.sh` handles pulls, builds, and background restarts on EC2.
   - 2GB Swap file added to EC2 to support Next.js builds on low-memory instances.

## 🛠️ Technical Details & "Gotchas"
- **Database Connection**: Use Port **6543** (Pooler) with `?sslmode=require` for Prisma.
- **Permissions**: Broad permissions have been granted to `anon` and `authenticated` roles in the `public` schema, and **RLS is currently disabled** on the main tables to simplify development.
- **IDs**: Database IDs (UUIDs) are currently generated in the frontend/client because default Postgres generation was inconsistent during the migration phase.
- **Environment**: 
  - `NEXT_PUBLIC_DEV_MODE=false` triggers real Email Auth.
  - `NEXT_PUBLIC_DEV_MODE=true` enables the yellow "Dev Mode Shortcuts" box.

## 📋 Pending Tasks
- [ ] **RCV Integration**: Update the Ranked Choice Voting page (`/poll/[code]`) to use the new `Profile` accounts instead of anonymous `localStorage` names.
- [ ] **Admin Dashboard**: A central place for the host to manage all rounds and polls.
- [ ] **RLS Refinement**: Re-enable Row Level Security and write specific policies for better security.
- [ ] **Domain**: Set up a custom domain for the EC2 IP (`16.146.60.32`).

---
*Last Updated: March 21, 2026*
