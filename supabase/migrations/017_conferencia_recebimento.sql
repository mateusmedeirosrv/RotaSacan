-- RotaScan — Conferência de manifesto no Recebimento
-- - Recebimento não divide encomendas por rota: cria uma rota padrão
--   "Recebimento" por galpão (rota é escolhida manualmente só na Entrega).
-- - Import do manifesto passa a inserir a diferença (códigos do manifesto
--   ainda não bipados, válidos pelo regex da transportadora) como bipagens,
--   e grava o resultado da conferência (encontradas/faltantes/extras) no
--   próprio manifesto.

ALTER TABLE rotas ADD COLUMN IF NOT EXISTS eh_recebimento BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rotas_recebimento_unico
  ON rotas(galpao_id) WHERE eh_recebimento = true;

-- Aproveita uma rota já chamada "Recebimento", se existir, em vez de duplicar
-- (UNIQUE(galpao_id, nome) impediria criar outra com o mesmo nome).
UPDATE rotas SET eh_recebimento = true
WHERE nome = 'Recebimento'
  AND galpao_id NOT IN (SELECT galpao_id FROM rotas WHERE eh_recebimento = true);

INSERT INTO rotas (galpao_id, nome, ativa, eh_recebimento)
SELECT g.id, 'Recebimento', true, true
FROM galpoes g
WHERE NOT EXISTS (SELECT 1 FROM rotas r WHERE r.galpao_id = g.id AND r.eh_recebimento = true);

CREATE OR REPLACE FUNCTION cria_rota_recebimento_padrao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO rotas (galpao_id, nome, ativa, eh_recebimento)
  VALUES (NEW.id, 'Recebimento', true, true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cria_rota_recebimento_padrao ON galpoes;
CREATE TRIGGER trg_cria_rota_recebimento_padrao
AFTER INSERT ON galpoes
FOR EACH ROW EXECUTE FUNCTION cria_rota_recebimento_padrao();

-- Resultado da conferência, gravado uma vez na importação do manifesto
ALTER TABLE manifestos ADD COLUMN IF NOT EXISTS encontradas INT NOT NULL DEFAULT 0;
ALTER TABLE manifestos ADD COLUMN IF NOT EXISTS faltantes   INT NOT NULL DEFAULT 0;
ALTER TABLE manifestos ADD COLUMN IF NOT EXISTS extras      INT NOT NULL DEFAULT 0;
