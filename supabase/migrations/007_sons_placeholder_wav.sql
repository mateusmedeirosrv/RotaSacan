-- ============================================================
-- SONS — placeholders sintéticos (.wav) até a equipe trazer os sons
-- definitivos. Gerados por scripts/gerar-sons-placeholder.mjs.
-- ============================================================

UPDATE configuracoes SET valor = '/sounds/confirmado.wav' WHERE chave = 'som_confirmado_arquivo';
UPDATE configuracoes SET valor = '/sounds/duplicado.wav'  WHERE chave = 'som_duplicado_arquivo';
UPDATE configuracoes SET valor = '/sounds/erro.wav'       WHERE chave = 'som_erro_arquivo';
