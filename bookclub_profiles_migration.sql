-- ==============================================================================
-- Supabase Migration: Dedicated Bookclub Profiles
-- Description: Renames the former shared profile table for bookclub-only use.
-- ==============================================================================

DO $$
BEGIN
  IF to_regclass('public.bookclub_profiles') IS NULL
     AND to_regclass('public.shared_profiles') IS NOT NULL THEN
    ALTER TABLE "shared_profiles" RENAME TO "bookclub_profiles";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.bookclub_profiles_pkey') IS NULL
     AND to_regclass('public.shared_profiles_pkey') IS NOT NULL THEN
    ALTER INDEX "shared_profiles_pkey" RENAME TO "bookclub_profiles_pkey";
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE "bookclub_profiles" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Bookclub profiles are readable by authenticated users" ON "bookclub_profiles";
  DROP POLICY IF EXISTS "Users can upsert their own bookclub profile" ON "bookclub_profiles";
  DROP POLICY IF EXISTS "Users can update their own bookclub profile" ON "bookclub_profiles";
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Bookclub profiles are readable by authenticated users"
    ON "bookclub_profiles"
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can upsert their own bookclub profile"
    ON "bookclub_profiles"
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = id::uuid
      AND email = (auth.jwt() ->> 'email')
      AND "isAdmin" = ((auth.jwt() ->> 'email') = 'rchang915@gmail.com')
    );

  CREATE POLICY "Users can update their own bookclub profile"
    ON "bookclub_profiles"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id::uuid)
    WITH CHECK (
      auth.uid() = id::uuid
      AND email = (auth.jwt() ->> 'email')
      AND "isAdmin" = ((auth.jwt() ->> 'email') = 'rchang915@gmail.com')
    );
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
