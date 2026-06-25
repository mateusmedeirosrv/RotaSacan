-- RotaScan — Adiciona Ativo/Inativo às telas de cadastro que ainda não tinham
-- (cidades, galpões, bairros). transportadoras/colaboradores/motoristas/rotas
-- já tinham essa coluna desde 001_initial_schema.sql.
-- Idempotente: pode ser executado múltiplas vezes sem erro.

ALTER TABLE cidades ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE galpoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE bairros ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
