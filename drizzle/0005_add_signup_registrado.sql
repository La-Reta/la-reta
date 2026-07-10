-- New signup status: a request that was approved AND actually registered as a
-- player. Additive enum value so existing rows stay valid.
ALTER TYPE "signup_status" ADD VALUE IF NOT EXISTS 'registrado';
