-- Reseñas de un partido: cómo estuvo la reta, no cómo jugó alguien.
--
-- Tabla propia y no una columna "target" en `player_comments`: esa tabla ya
-- lleva reseñas de gente real, y aquí el esquema se amplía en vez de
-- reescribirse. Las reacciones también van aparte porque
-- `comment_reactions.comment_id` apunta a `player_comments` por clave ajena, y
-- aflojarla para que sirviera a dos tablas dejaría a la base sin poder
-- garantizar que la reacción cuelga de un comentario que existe.
--
-- Todo `IF NOT EXISTS` y las claves ajenas **dentro** del CREATE TABLE, no en
-- un ALTER posterior: el driver HTTP de Neon manda una sentencia por viaje y no
-- admite bloques `DO $$ … $$`, que es como se haría un ALTER idempotente.

CREATE TABLE IF NOT EXISTS "match_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL REFERENCES "public"."matches"("id") ON DELETE cascade,
	"author" varchar(60),
	"author_image_url" text,
	"author_id" text,
	"body" varchar(500) NOT NULL,
	"rating" smallint,
	"deleted" boolean DEFAULT false NOT NULL,
	"language" varchar(24),
	"timezone" varchar(64),
	"screen" varchar(24),
	"platform" varchar(80),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_comment_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL REFERENCES "public"."match_comments"("id") ON DELETE cascade,
	"emoji" varchar(16) NOT NULL,
	"reactor_key" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Lo que impide reaccionar dos veces con el mismo emoji al mismo comentario.
CREATE UNIQUE INDEX IF NOT EXISTS "match_comment_reactions_unique" ON "match_comment_reactions" USING btree ("comment_id", "emoji", "reactor_key");

-- La lista de un partido se lee por match_id y ordenada por fecha.
CREATE INDEX IF NOT EXISTS "match_comments_match_idx" ON "match_comments" USING btree ("match_id", "created_at");
