-- Soporte para retas de 3+ equipos (default sigue siendo 2). Todo aditivo y
-- nullable: las filas existentes siguen leyéndose con team_a_* / team_b_*.
ALTER TABLE "generated_retas" ADD COLUMN IF NOT EXISTS "teams" jsonb;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "team_a_key" varchar(1);
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "team_b_key" varchar(1);
