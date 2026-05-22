-- ==============================================================================
-- Supabase Migration: Unified Book Table
-- Description: Moves current, suggested, and completed book records into one table.
-- ==============================================================================

DO $$
BEGIN
  CREATE TYPE "BookStatus" AS ENUM ('FUTURE_SUGGESTION', 'NEXT', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "bookclub_books" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "coverUrl" TEXT,
  "status" "BookStatus" NOT NULL DEFAULT 'FUTURE_SUGGESTION',
  "recommenderId" TEXT,
  "completedAt" TIMESTAMP(3),
  "selectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bookclub_books_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bookclub_books_status_createdAt_idx"
  ON "bookclub_books" ("status", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "bookclub_books_single_next_idx"
  ON "bookclub_books" ("status")
  WHERE "status" = 'NEXT';

DO $$
BEGIN
  ALTER TABLE "bookclub_books"
    ADD CONSTRAINT "bookclub_books_recommenderId_fkey"
    FOREIGN KEY ("recommenderId") REFERENCES "shared_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "bookclub_books" ("id", "title", "author", "status", "recommenderId", "createdAt", "updatedAt")
SELECT "id", "title", "author", 'FUTURE_SUGGESTION'::"BookStatus", "recommenderId", "createdAt", CURRENT_TIMESTAMP
FROM "bookclub_recommendations"
WHERE NOT EXISTS (
  SELECT 1 FROM "bookclub_books"
  WHERE lower("bookclub_books"."title") = lower("bookclub_recommendations"."title")
);

INSERT INTO "bookclub_books" ("title", "author", "coverUrl", "status", "selectedAt", "createdAt", "updatedAt")
SELECT "currentBookTitle", "currentBookAuthor", "currentBookCoverUrl", 'NEXT'::"BookStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "bookclub_settings"
WHERE NOT EXISTS (
  SELECT 1 FROM "bookclub_books" WHERE "status" = 'NEXT'
);
