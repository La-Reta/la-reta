-- Marcador de N equipos en un mismo partido (retas de 3+). Aditivo y nullable:
-- los partidos de 2 lados siguen leyéndose con team_a_* / team_b_*.
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "teams" jsonb;
