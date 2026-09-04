-- Optional match photo (group shot, etc.) stored in Vercel Blob. Nullable so
-- existing matches stay valid.
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "photo_url" varchar(500);
