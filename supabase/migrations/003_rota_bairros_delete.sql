-- RotaScan — Permite remover bairro de uma rota (admin ou gerente do próprio galpão)
-- Complementa 002_rls_write_policies.sql, que só tinha INSERT/UPDATE para rota_bairros.
-- Idempotente: pode ser executado múltiplas vezes sem erro.

DROP POLICY IF EXISTS "remocao_admin_gerente" ON rota_bairros;
CREATE POLICY "remocao_admin_gerente" ON rota_bairros FOR DELETE
  USING (
    auth_papel() = 'admin' OR
    (auth_papel() = 'gerente' AND rota_id IN (
      SELECT id FROM rotas WHERE galpao_id = auth_galpao_id()
    ))
  );
