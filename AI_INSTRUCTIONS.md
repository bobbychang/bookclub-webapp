**CRITICAL INSTRUCTION: DATABASE ISOLATION**
This project shares a backend PostgreSQL database (Supabase) with several other independent personal projects. To prevent catastrophic data loss or corruption in other projects, you must strictly adhere to the following database constraints:

1. **Project Prefix Rule**: Every project-specific table, view, function, or trigger MUST start with the prefix: `bookclub_`. You are strictly prohibited from reading, modifying, dropping, or querying any table with another project's prefix.
2. **Shared Global Tables Rule**: Since user accounts are shared across multiple projects, authentication is handled by the global Supabase `auth.users` table. Additionally, any shared data tables (like user profiles) will use the `shared_` prefix (e.g., `shared_profiles`). 
    - You MAY read from, insert into, and create foreign keys to `auth.users` and `shared_` tables.
    - You MAY NOT alter the database schema, drop, or truncate `shared_` tables unless explicitly instructed by the user.
3. **Migrations & Code**: When generating SQL migrations or writing database queries, double-check that you are only affecting `bookclub_` tables, or safely interacting with `shared_` tables.

By acknowledging this file, you agree that maintaining the integrity of the shared database is your highest priority.
