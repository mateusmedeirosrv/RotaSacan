-- ============================================================
-- BIPAGENS — policy de DELETE (faltava; hoje é deny total). Necessária
-- para o botão "Desfazer última bipagem" da tela de bipagem (Fase 5).
-- Mesma condição já usada em INSERT/UPDATE: o próprio colaborador, na
-- operação ainda EM_ANDAMENTO do seu galpão, ou admin.
-- ============================================================

DROP POLICY IF EXISTS "remocao_bipagem" ON bipagens;
CREATE POLICY "remocao_bipagem" ON bipagens FOR DELETE
  USING (
    auth_papel() = 'admin' OR
    (
      colaborador_id = auth_colaborador_id() AND
      operacao_id IN (
        SELECT id FROM operacoes
        WHERE galpao_id = auth_galpao_id() AND status = 'EM_ANDAMENTO'
      )
    )
  );
