-- RotaScan — Schema inicial
-- Fase 0: estrutura base + auth + configurações
-- Idempotente: pode ser executado múltiplas vezes sem erro.

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPOS ENUMS (idempotente via bloco de exceção)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE tipo_evento AS ENUM ('RECEBIMENTO','ENTREGA','DEVOLUCAO_ORIGEM','RETORNO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_operacao AS ENUM ('EM_ANDAMENTO','FINALIZADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE papel_usuario AS ENUM ('admin','gerente','colaborador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CADASTROS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS cidades (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  uf        CHAR(2) NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nome, uf)
);

CREATE TABLE IF NOT EXISTS galpoes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  nome      TEXT NOT NULL,
  endereco  TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cidade_id, nome)
);

CREATE TABLE IF NOT EXISTS bairros (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  nome      TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cidade_id, nome)
);

CREATE TABLE IF NOT EXISTS transportadoras (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL UNIQUE,
  regex_validacao  TEXT,
  ativo            BOOLEAN NOT NULL DEFAULT true,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- USUÁRIOS (vinculados ao Supabase Auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS colaboradores (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galpao_id UUID NOT NULL REFERENCES galpoes(id),
  user_id   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  cpf       TEXT,
  email     TEXT NOT NULL,
  papel     papel_usuario NOT NULL DEFAULT 'colaborador',
  ativo     BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motoristas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galpao_id UUID NOT NULL REFERENCES galpoes(id),
  nome      TEXT NOT NULL,
  cpf       TEXT,
  cnh       TEXT,
  placa     TEXT,
  telefone  TEXT,
  ativo     BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROTAS (templates reutilizáveis)
-- ============================================================

CREATE TABLE IF NOT EXISTS rotas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galpao_id UUID NOT NULL REFERENCES galpoes(id),
  nome      TEXT NOT NULL,
  ativa     BOOLEAN NOT NULL DEFAULT true,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (galpao_id, nome)
);

CREATE TABLE IF NOT EXISTS rota_bairros (
  rota_id   UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  bairro_id UUID NOT NULL REFERENCES bairros(id),
  ordem     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (rota_id, bairro_id)
);

-- ============================================================
-- OPERAÇÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS operacoes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galpao_id         UUID NOT NULL REFERENCES galpoes(id),
  transportadora_id UUID NOT NULL REFERENCES transportadoras(id),
  tipo_evento       tipo_evento NOT NULL,
  data              DATE NOT NULL,
  colaborador_id    UUID NOT NULL REFERENCES colaboradores(id),
  status            status_operacao NOT NULL DEFAULT 'EM_ANDAMENTO',
  iniciada_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizada_em     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_operacoes_status      ON operacoes(status) WHERE status = 'EM_ANDAMENTO';
CREATE INDEX IF NOT EXISTS idx_operacoes_galpao_data ON operacoes(galpao_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_operacoes_colab        ON operacoes(colaborador_id, iniciada_em DESC);

-- ============================================================
-- BIPAGENS
-- ============================================================

CREATE TABLE IF NOT EXISTS bipagens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao_id       UUID NOT NULL REFERENCES operacoes(id),
  rota_id           UUID NOT NULL REFERENCES rotas(id),
  motorista_id      UUID REFERENCES motoristas(id),
  transportadora_id UUID NOT NULL REFERENCES transportadoras(id),
  codigo            TEXT NOT NULL,
  tipo_evento       tipo_evento NOT NULL,
  colaborador_id    UUID NOT NULL REFERENCES colaboradores(id),
  bipado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  override_aplicado BOOLEAN NOT NULL DEFAULT false,
  sincronizado_em   TIMESTAMPTZ,
  UNIQUE (transportadora_id, codigo, tipo_evento),
  CHECK (
    (tipo_evento = 'RECEBIMENTO' AND motorista_id IS NULL) OR
    (tipo_evento IN ('ENTREGA', 'DEVOLUCAO_ORIGEM', 'RETORNO') AND motorista_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bipagens_operacao   ON bipagens(operacao_id);
CREATE INDEX IF NOT EXISTS idx_bipagens_rota       ON bipagens(rota_id);
CREATE INDEX IF NOT EXISTS idx_bipagens_motorista  ON bipagens(motorista_id);
CREATE INDEX IF NOT EXISTS idx_bipagens_data       ON bipagens(bipado_em DESC);
CREATE INDEX IF NOT EXISTS idx_bipagens_codigo     ON bipagens(codigo);
CREATE INDEX IF NOT EXISTS idx_bipagens_colab_data ON bipagens(colaborador_id, bipado_em);

-- Trigger: garante que transportadora_id em bipagens == operacoes.transportadora_id
CREATE OR REPLACE FUNCTION check_bipagem_transportadora()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.transportadora_id != (
    SELECT transportadora_id FROM operacoes WHERE id = NEW.operacao_id
  ) THEN
    RAISE EXCEPTION 'bipagem.transportadora_id deve ser igual a operacoes.transportadora_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bipagem_transportadora ON bipagens;
CREATE TRIGGER trg_bipagem_transportadora
BEFORE INSERT OR UPDATE ON bipagens
FOR EACH ROW EXECUTE FUNCTION check_bipagem_transportadora();

-- ============================================================
-- MANIFESTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS manifestos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao_id   UUID NOT NULL UNIQUE REFERENCES operacoes(id),
  nome_arquivo  TEXT NOT NULL,
  total_itens   INT NOT NULL DEFAULT 0,
  importado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifesto_itens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifesto_id UUID NOT NULL REFERENCES manifestos(id) ON DELETE CASCADE,
  codigo       TEXT NOT NULL,
  descricao    TEXT,
  UNIQUE (manifesto_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_manifesto_itens_codigo ON manifesto_itens(codigo);

-- ============================================================
-- CONFIGURAÇÕES (singleton key-value)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  chave          TEXT PRIMARY KEY,
  valor          TEXT NOT NULL,
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID REFERENCES auth.users(id)
);

INSERT INTO configuracoes (chave, valor) VALUES
  ('bipagem_entrega_sem_recebimento', 'PERMITIR'),
  ('senha_override', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcan2cFfZ5AENP3y3Uqdm'),
  ('som_confirmado_arquivo', '/sounds/confirmado.mp3'),
  ('som_duplicado_arquivo',  '/sounds/duplicado.mp3'),
  ('som_erro_arquivo',       '/sounds/erro.mp3'),
  ('qrcode_etiqueta_largura_mm', '21.0'),
  ('qrcode_etiqueta_altura_mm',  '38.2')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- AUDITORIA
-- ============================================================

CREATE TABLE IF NOT EXISTS auditoria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  usuario_id  UUID REFERENCES auth.users(id),
  dados       JSONB,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tipo      ON auditoria(tipo);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario   ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria(criado_em DESC);

-- ============================================================
-- SEEDS INICIAIS
-- ============================================================

INSERT INTO transportadoras (nome, regex_validacao) VALUES
  ('Amazon',          '^TBR\d{9}$'),
  ('Magazine Luiza',  NULL)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cidades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE galpoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportadoras  ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rota_bairros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bipagens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifesto_itens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria        ENABLE ROW LEVEL SECURITY;

-- Helpers de papel/galpão do usuário autenticado
CREATE OR REPLACE FUNCTION auth_papel()
RETURNS papel_usuario LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT papel FROM colaboradores WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_galpao_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT galpao_id FROM colaboradores WHERE user_id = auth.uid()
$$;

-- ============================================================
-- POLICIES (drop + create para idempotência)
-- ============================================================

DROP POLICY IF EXISTS "leitura_por_galpao" ON galpoes;
CREATE POLICY "leitura_por_galpao" ON galpoes
  FOR SELECT USING (auth_papel() = 'admin' OR id = auth_galpao_id());

DROP POLICY IF EXISTS "leitura_por_galpao" ON colaboradores;
CREATE POLICY "leitura_por_galpao" ON colaboradores
  FOR SELECT USING (auth_papel() = 'admin' OR galpao_id = auth_galpao_id());

DROP POLICY IF EXISTS "leitura_por_galpao" ON motoristas;
CREATE POLICY "leitura_por_galpao" ON motoristas
  FOR SELECT USING (auth_papel() = 'admin' OR galpao_id = auth_galpao_id());

DROP POLICY IF EXISTS "leitura_por_galpao" ON rotas;
CREATE POLICY "leitura_por_galpao" ON rotas
  FOR SELECT USING (auth_papel() = 'admin' OR galpao_id = auth_galpao_id());

DROP POLICY IF EXISTS "leitura_por_galpao" ON operacoes;
CREATE POLICY "leitura_por_galpao" ON operacoes
  FOR SELECT USING (auth_papel() = 'admin' OR galpao_id = auth_galpao_id());

DROP POLICY IF EXISTS "leitura_por_galpao" ON bipagens;
CREATE POLICY "leitura_por_galpao" ON bipagens
  FOR SELECT USING (
    auth_papel() = 'admin'
    OR operacao_id IN (SELECT id FROM operacoes WHERE galpao_id = auth_galpao_id())
  );

DROP POLICY IF EXISTS "leitura_autenticados" ON cidades;
CREATE POLICY "leitura_autenticados" ON cidades         FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_autenticados" ON bairros;
CREATE POLICY "leitura_autenticados" ON bairros         FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_autenticados" ON transportadoras;
CREATE POLICY "leitura_autenticados" ON transportadoras FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_autenticados" ON rota_bairros;
CREATE POLICY "leitura_autenticados" ON rota_bairros    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_autenticados" ON manifesto_itens;
CREATE POLICY "leitura_autenticados" ON manifesto_itens FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_autenticados" ON configuracoes;
CREATE POLICY "leitura_autenticados" ON configuracoes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON configuracoes;
CREATE POLICY "escrita_admin" ON configuracoes FOR ALL USING (auth_papel() = 'admin');

DROP POLICY IF EXISTS "leitura_admin" ON auditoria;
CREATE POLICY "leitura_admin" ON auditoria FOR SELECT USING (auth_papel() = 'admin');

DROP POLICY IF EXISTS "insercao_system" ON auditoria;
CREATE POLICY "insercao_system" ON auditoria FOR INSERT WITH CHECK (true);
