-- ============================================================
-- CONFIGURACOES — o hash seed de senha_override (001_initial_schema.sql)
-- não corresponde de fato à senha default documentada ("8038"). Achado
-- durante a verificação manual do fluxo de override na Fase 5: a senha
-- correta era rejeitada por verificar_senha_override/tentar_override.
-- Regenera o hash corretamente a partir da senha real.
-- ============================================================

UPDATE configuracoes
SET valor = crypt('8038', gen_salt('bf', 12))
WHERE chave = 'senha_override';
