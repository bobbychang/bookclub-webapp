-- ==============================================================================
-- Supabase Migration: Table Prefixing (Bookclub to Monolith)
-- Description: Renames the bookclub tables to use the `bookclub_` prefix.
-- ==============================================================================

-- 1. Rename Tables
ALTER TABLE "Profile" RENAME TO "bookclub_profiles";
ALTER TABLE "SchedulingPoll" RENAME TO "bookclub_scheduling_polls";
ALTER TABLE "ProposedDate" RENAME TO "bookclub_proposed_dates";
ALTER TABLE "Availability" RENAME TO "bookclub_availabilities";
ALTER TABLE "Recommendation" RENAME TO "bookclub_recommendations";
ALTER TABLE "Settings" RENAME TO "bookclub_settings";

-- 2. Rename Primary Key Constraints
ALTER INDEX "Profile_pkey" RENAME TO "bookclub_profiles_pkey";
ALTER INDEX "SchedulingPoll_pkey" RENAME TO "bookclub_scheduling_polls_pkey";
ALTER INDEX "ProposedDate_pkey" RENAME TO "bookclub_proposed_dates_pkey";
ALTER INDEX "Availability_pkey" RENAME TO "bookclub_availabilities_pkey";
ALTER INDEX "Recommendation_pkey" RENAME TO "bookclub_recommendations_pkey";
ALTER INDEX "Settings_pkey" RENAME TO "bookclub_settings_pkey";

-- 3. Rename Foreign Keys (if they follow standard naming)
-- Note: You might need to manually verify these constraint names in your Supabase DB.
-- ALTER TABLE "bookclub_proposed_dates" RENAME CONSTRAINT "ProposedDate_pollId_fkey" TO "bookclub_proposed_dates_pollId_fkey";
-- ALTER TABLE "bookclub_availabilities" RENAME CONSTRAINT "Availability_dateId_fkey" TO "bookclub_availabilities_dateId_fkey";
-- ALTER TABLE "bookclub_availabilities" RENAME CONSTRAINT "Availability_userId_fkey" TO "bookclub_availabilities_userId_fkey";
-- ALTER TABLE "bookclub_recommendations" RENAME CONSTRAINT "Recommendation_recommenderId_fkey" TO "bookclub_recommendations_recommenderId_fkey";

-- 4. Update RLS Policies
-- Note: Depending on how RLS policies were written, they may automatically map to the renamed table, 
-- but if they reference table names in string logic or function queries, they must be updated.

-- Example: 
-- ALTER POLICY "Users can update own profile" ON "bookclub_profiles" ...
