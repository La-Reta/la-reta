DO $$ BEGIN
  CREATE TYPE "report_category" AS ENUM (
    'ayuda',
    'bug',
    'privacidad',
    'conducta',
    'datos',
    'otro'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "report_status" AS ENUM (
    'nuevo',
    'revisando',
    'resuelto',
    'descartado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(140) NOT NULL,
  "description" text NOT NULL,
  "category" "report_category" DEFAULT 'ayuda' NOT NULL,
  "reporter_name" varchar(80),
  "contact" varchar(160),
  "related_path" varchar(240),
  "status" "report_status" DEFAULT 'nuevo' NOT NULL,
  "admin_notes" text,
  "language" varchar(24),
  "languages" varchar(240),
  "timezone" varchar(64),
  "timezone_offset" smallint,
  "screen" varchar(32),
  "viewport" varchar(32),
  "pixel_ratio" varchar(16),
  "platform" varchar(80),
  "user_agent" text,
  "ip_address" varchar(64),
  "forwarded_for" varchar(500),
  "country" varchar(8),
  "region" varchar(120),
  "city" varchar(120),
  "latitude" varchar(40),
  "longitude" varchar(40),
  "accept_language" varchar(240),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
