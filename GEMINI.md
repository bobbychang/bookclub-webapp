# Valencia Bookclub Webapp - Project State & Context

## 🎯 Current Status
The project has been transformed from a simple voting app into a full Book Club Home Page with authentication and scheduling features. It is currently deployed and live on an AWS EC2 instance.

## 🏗️ Architecture & Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL) managed via **Prisma 6.2.1**
- **Authentication**: Email Magic Links (Supabase Auth)
- **Styling**: Tailwind CSS / Tailwind v4 Theming
- **CI/CD**: GitHub Actions for automated Prisma schema pushes.
- **Deployment**: AWS EC2 (Amazon Linux) with a custom `deploy.sh` script.

## ✅ Completed Features
1. **Landing Page**: Styled home page for "Valencia Bookclub Boys" featuring the next book and a dynamic scheduling section.
2. **Auth System**:
   - Switched from SMS to **Email Magic Links**.
   - **Public Read Access**: Site content is visible to guests; interactions are gated by an inline Profile Widget.
   - Admin account: `rchang915@gmail.com`.
   - Dev Mode bypass for local/prod testing (Login as Admin/User A/User B).
3. **Scheduling System**:
   - **Phase 1 (Proposing)**: Admin chooses dates from a calendar.
   - **Phase 2 (Voting)**: Members mark availability (Yes, No, Maybe).
   - **Phase 3 (Finalized)**: Admin confirms a date; UI replaces poll with a confirmation announcement and attendee grid.
4. **Book Selection**: Ranked Choice Voting (RCV) integrated with `Profile` accounts.
5. **Recommendations**: Community book feed using OpenLibrary API for metadata retrieval.
6. **Theming**: Premium "Slate & Blue" system with full Light/Dark mode support using Tailwind v4 semantic tokens.
7. **Environment Sync**: 
   - **Staging Project**: `bookclub-staging` (`siybezdcbtaqrauiqeop`) established for safe feature testing.
   - **GitHub Actions**: Automated schema synchronization between local, staging, and production.
8. **DevOps**:
   - **Custom Domain**: `bobbychang.co/bookclub` linked via GoDaddy.
   - Git repository initialized and linked to `https://github.com/bobbychang/bookclub-webapp.git`.
   - Deployment script `deploy.sh` handles pulls, builds, and background restarts on EC2.
   - 2GB Swap file added to EC2 to support Next.js builds on low-memory instances.

## 🛠️ Technical Details & "Gotchas"
- **Database Connection**: Use Port **6543** (Pooler) with `?sslmode=require` for Prisma. **DIRECT_URL** on port **5432** is required for `prisma db push`.
- **Staging**: Access staging credentials in `.env.staging`. Use `npx prisma db push` with staging URLs to sync schema.
- **Security**: **Row Level Security (RLS) is ENABLED** on all tables. Policies enforce that users can only modify their own data, using `auth.uid()::text` for profile matching.
- **IDs**: Database IDs (UUIDs) are currently generated in the frontend/client because default Postgres generation was inconsistent during the migration phase.
- **Environment**: 
  - `NEXT_PUBLIC_DEV_MODE=false` triggers real Email Auth.
  - `NEXT_PUBLIC_DEV_MODE=true` enables the yellow "Dev Mode Shortcuts" box.

## 🚀 SSH & Deployment Guide (For the AI Agent)
The project is hosted on an AWS EC2 instance. Use the following details to run commands remotely:
- **IP Address**: `16.146.60.32`
- **User**: `ec2-user`
- **SSH Key**: `C:\Users\Robert\.ssh\aws_bobby_key`
- **Project Path**: `/home/ec2-user/voting-app-prod`
- **Command Format**: `ssh -i "C:\Users\Robert\.ssh\aws_bobby_key" ec2-user@16.146.60.32 "cd voting-app-prod && [command]"`

### Common Remote Tasks:
- **Deploy Updates**: `ssh -i "C:\Users\Robert\.ssh\aws_bobby_key" ec2-user@16.146.60.32 "cd voting-app-prod && ./deploy.sh"`
- **Check Logs**: `ssh -i "C:\Users\Robert\.ssh\aws_bobby_key" ec2-user@16.146.60.32 "cd voting-app-prod && cat app.log"`
- **Restart**: `ssh -i "C:\Users\Robert\.ssh\aws_bobby_key" ec2-user@16.146.60.32 "pkill -f 'next-server' || true && cd voting-app-prod && nohup npm run start > app.log 2>&1 &"`

## 📋 Pending Tasks
- [ ] **Admin Dashboard**: A central place for the host to manage all rounds and polls.
- [ ] **HTTPS/SSL**: Finalize certificate setup and auto-renewal for the custom domain.

## 🤖 Agent Rules & Constraints
- **Validation**: All feature validation must be done using the full browser process. Automated test cases can run headless, but when explicitly asked to validate a feature, the agent must use the `browser_subagent` to visually verify the functionality on the dev server.

---
*Last Updated: March 22, 2026*
