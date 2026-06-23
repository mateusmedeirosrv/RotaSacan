-- ============================================================
-- BIPAGEM — funções que tornam escrita + auditoria atômicas (mesma
-- transação), usadas pela tela de bipagem (Fase 5):
--
-- 1. tentar_override: verifica a senha de override (mesma lógica de
--    verificar_senha_override) e já registra a tentativa (sucesso ou
--    falha) em auditoria antes de retornar — evita perder o log se o
--    client cair entre "verificar" e "registrar".
-- 2. desfazer_bipagem: remove a bipagem (sujeito à policy de DELETE de
--    005_bipagens_delete_policy.sql) e registra em auditoria, também
--    atomicamente. SECURITY INVOKER (padrão) para que o DELETE em si
--    continue respeitando a RLS de quem está chamando.
-- ============================================================

CREATE OR REPLACE FUNCTION tentar_override(
  senha_tentativa TEXT,
  p_codigo TEXT,
  p_operacao_id UUID,
  p_rota_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT valor = crypt(senha_tentativa, valor) INTO v_ok
  FROM configuracoes WHERE chave = 'senha_override';

  INSERT INTO auditoria (tipo, descricao, usuario_id, dados)
  VALUES (
    CASE WHEN v_ok THEN 'override_aplicado' ELSE 'override_senha_incorreta' END,
    CASE WHEN v_ok
      THEN 'Override de entrega sem recebimento aplicado.'
      ELSE 'Tentativa de override com senha incorreta.'
    END,
    auth.uid(),
    jsonb_build_object('codigo', p_codigo, 'operacao_id', p_operacao_id, 'rota_id', p_rota_id)
  );

  RETURN coalesce(v_ok, false);
END;
$$;

REVOKE ALL ON FUNCTION tentar_override(TEXT, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tentar_override(TEXT, TEXT, UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION desfazer_bipagem(p_bipagem_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $$
DECLARE
  v_removidas INT;
  v_codigo TEXT;
  v_rota_id UUID;
BEGIN
  SELECT codigo, rota_id INTO v_codigo, v_rota_id FROM bipagens WHERE id = p_bipagem_id;

  DELETE FROM bipagens WHERE id = p_bipagem_id;
  GET DIAGNOSTICS v_removidas = ROW_COUNT;

  IF v_removidas = 0 THEN
    RAISE EXCEPTION 'Bipagem não encontrada ou sem permissão para desfazer.';
  END IF;

  INSERT INTO auditoria (tipo, descricao, usuario_id, dados)
  VALUES (
    'bipagem_desfeita',
    'Bipagem desfeita pelo colaborador.',
    auth.uid(),
    jsonb_build_object('bipagem_id', p_bipagem_id, 'codigo', v_codigo, 'rota_id', v_rota_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION desfazer_bipagem(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION desfazer_bipagem(UUID) TO authenticated;
