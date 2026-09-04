-- Allow ambidextrous players ("ambos") as a preferred-foot option. Additive.
ALTER TYPE "foot" ADD VALUE IF NOT EXISTS 'both';
