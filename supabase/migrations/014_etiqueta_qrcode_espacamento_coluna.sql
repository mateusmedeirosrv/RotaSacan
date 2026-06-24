-- RotaScan — Aumenta o espaçamento entre colunas da etiqueta QR para dar
-- mais folga em relação à linha de corte física da folha. A coluna central
-- não se desloca (a centralização do PDF é simétrica em torno do meio),
-- só o espaço entre as colunas aumenta.
-- Idempotente: pode ser executado múltiplas vezes sem erro.

UPDATE configuracoes SET valor = '2.0' WHERE chave = 'qrcode_etiqueta_espacamento_coluna_mm';
