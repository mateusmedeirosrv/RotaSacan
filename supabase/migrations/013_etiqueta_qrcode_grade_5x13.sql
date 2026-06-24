-- RotaScan — Corrige medidas da etiqueta QR para a folha física real
-- (5 colunas x 13 linhas = 65 etiquetas por A4) e adiciona margens/
-- espaçamentos configuráveis para alinhar o PDF aos cortes da folha.
-- Idempotente: pode ser executado múltiplas vezes sem erro.

UPDATE configuracoes SET valor = '38.2' WHERE chave = 'qrcode_etiqueta_largura_mm';
UPDATE configuracoes SET valor = '21.2' WHERE chave = 'qrcode_etiqueta_altura_mm';

INSERT INTO configuracoes (chave, valor) VALUES
  ('qrcode_etiqueta_margem_mm',              '0.4'),
  ('qrcode_etiqueta_espacamento_coluna_mm',  '0.2'),
  ('qrcode_etiqueta_espacamento_linha_mm',   '0.0')
ON CONFLICT (chave) DO NOTHING;
