-- Birth date as the source of truth for age; the existing `age` column is kept
-- as a derived snapshot. Nullable so existing players remain valid.
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "birth_date" date;
