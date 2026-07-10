-- Track who registered each player. Populated from the Clerk session when the
-- creator is a signed-in user; null for admin-only altas or existing rows.
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "created_by_name" varchar(60);
