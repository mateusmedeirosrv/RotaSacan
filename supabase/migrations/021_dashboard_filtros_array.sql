-- RotaScan — Converte filtros do Dashboard para arrays (multi-seleção)
-- dashboard_kpis e dashboard_bipagens_export passam a aceitar UUID[] e
-- tipo_evento[] em vez de valores únicos, alinhando com o filtro checklist.
--
-- É necessário DROP + CREATE porque o nome dos parâmetros mudou; não basta
-- CREATE OR REPLACE quando os tipos de argumento também mudam.

DROP FUNCTION IF EXISTS dashboard_kpis(DATE, DATE, UUID, UUID, tipo_evento, UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS dashboard_bipagens_export(DATE, DATE, UUID, UUID, tipo_evento, UUID, UUID, UUID, UUID);

-- ============================================================
-- dashboard_kpis
-- ============================================================

CREATE OR REPLACE FUNCTION dashboard_kpis(
  p_data_inicio       DATE,
  p_data_fim          DATE,
  p_galpao_ids        UUID[]        DEFAULT NULL,
  p_transportadora_ids UUID[]       DEFAULT NULL,
  p_tipos_evento      tipo_evento[] DEFAULT NULL,
  p_operacao_ids      UUID[]        DEFAULT NULL,
  p_rota_ids          UUID[]        DEFAULT NULL,
  p_colaborador_ids   UUID[]        DEFAULT NULL,
  p_motorista_ids     UUID[]        DEFAULT NULL
)
RETURNS JSON LANGUAGE sql STABLE AS $$
  WITH base AS MATERIALIZED (
    SELECT b.*
    FROM bipagens b
    JOIN operacoes o ON o.id = b.operacao_id
    WHERE b.bipado_em::date BETWEEN p_data_inicio AND p_data_fim
      AND (p_galpao_ids        IS NULL OR o.galpao_id         = ANY(p_galpao_ids))
      AND (p_transportadora_ids IS NULL OR b.transportadora_id = ANY(p_transportadora_ids))
      AND (p_tipos_evento      IS NULL OR b.tipo_evento        = ANY(p_tipos_evento))
      AND (p_operacao_ids      IS NULL OR b.operacao_id        = ANY(p_operacao_ids))
      AND (p_rota_ids          IS NULL OR b.rota_id            = ANY(p_rota_ids))
      AND (p_colaborador_ids   IS NULL OR b.colaborador_id     = ANY(p_colaborador_ids))
      AND (p_motorista_ids     IS NULL OR b.motorista_id       = ANY(p_motorista_ids))
  ),
  -- Comparação Recebimento x Entrega ignora o filtro de tipo (precisa dos
  -- dois tipos para comparar), mas respeita todos os demais filtros.
  base_comparacao AS MATERIALIZED (
    SELECT b.tipo_evento
    FROM bipagens b
    JOIN operacoes o ON o.id = b.operacao_id
    WHERE b.bipado_em::date BETWEEN p_data_inicio AND p_data_fim
      AND (p_galpao_ids        IS NULL OR o.galpao_id         = ANY(p_galpao_ids))
      AND (p_transportadora_ids IS NULL OR b.transportadora_id = ANY(p_transportadora_ids))
      AND (p_operacao_ids      IS NULL OR b.operacao_id        = ANY(p_operacao_ids))
      AND (p_rota_ids          IS NULL OR b.rota_id            = ANY(p_rota_ids))
      AND (p_colaborador_ids   IS NULL OR b.colaborador_id     = ANY(p_colaborador_ids))
      AND (p_motorista_ids     IS NULL OR b.motorista_id       = ANY(p_motorista_ids))
      AND b.tipo_evento IN ('RECEBIMENTO', 'ENTREGA')
  )
  SELECT json_build_object(
    'total', (SELECT count(*) FROM base),
    'por_dia', (
      SELECT coalesce(json_agg(json_build_object('dia', dia, 'total', total) ORDER BY dia), '[]')
      FROM (SELECT bipado_em::date AS dia, count(*) AS total FROM base GROUP BY 1) x
    ),
    'por_transportadora', (
      SELECT coalesce(json_agg(json_build_object('transportadora', t.nome, 'total', x.total) ORDER BY x.total DESC), '[]')
      FROM (SELECT transportadora_id, count(*) AS total FROM base GROUP BY 1) x
      JOIN transportadoras t ON t.id = x.transportadora_id
    ),
    'por_motorista', (
      SELECT coalesce(json_agg(json_build_object('motorista', m.nome, 'total', x.total) ORDER BY x.total DESC), '[]')
      FROM (
        SELECT motorista_id, count(*) AS total FROM base
        WHERE motorista_id IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 15
      ) x
      JOIN motoristas m ON m.id = x.motorista_id
    ),
    'por_tipo_evento', (
      SELECT coalesce(json_agg(json_build_object('tipo_evento', tipo_evento, 'total', total)), '[]')
      FROM (SELECT tipo_evento, count(*) AS total FROM base GROUP BY 1) x
    ),
    'recebimento_total', (SELECT count(*) FROM base_comparacao WHERE tipo_evento = 'RECEBIMENTO'),
    'entrega_total',     (SELECT count(*) FROM base_comparacao WHERE tipo_evento = 'ENTREGA'),
    'overrides_aplicados', (SELECT count(*) FROM base WHERE override_aplicado)
  );
$$;

REVOKE ALL ON FUNCTION dashboard_kpis(DATE, DATE, UUID[], UUID[], tipo_evento[], UUID[], UUID[], UUID[], UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dashboard_kpis(DATE, DATE, UUID[], UUID[], tipo_evento[], UUID[], UUID[], UUID[], UUID[]) TO authenticated;

-- ============================================================
-- dashboard_bipagens_export
-- ============================================================

CREATE OR REPLACE FUNCTION dashboard_bipagens_export(
  p_data_inicio       DATE,
  p_data_fim          DATE,
  p_galpao_ids        UUID[]        DEFAULT NULL,
  p_transportadora_ids UUID[]       DEFAULT NULL,
  p_tipos_evento      tipo_evento[] DEFAULT NULL,
  p_operacao_ids      UUID[]        DEFAULT NULL,
  p_rota_ids          UUID[]        DEFAULT NULL,
  p_colaborador_ids   UUID[]        DEFAULT NULL,
  p_motorista_ids     UUID[]        DEFAULT NULL
)
RETURNS JSON LANGUAGE sql STABLE AS $$
  WITH base AS MATERIALIZED (
    SELECT b.*
    FROM bipagens b
    JOIN operacoes o ON o.id = b.operacao_id
    WHERE b.bipado_em::date BETWEEN p_data_inicio AND p_data_fim
      AND (p_galpao_ids        IS NULL OR o.galpao_id         = ANY(p_galpao_ids))
      AND (p_transportadora_ids IS NULL OR b.transportadora_id = ANY(p_transportadora_ids))
      AND (p_tipos_evento      IS NULL OR b.tipo_evento        = ANY(p_tipos_evento))
      AND (p_operacao_ids      IS NULL OR b.operacao_id        = ANY(p_operacao_ids))
      AND (p_rota_ids          IS NULL OR b.rota_id            = ANY(p_rota_ids))
      AND (p_colaborador_ids   IS NULL OR b.colaborador_id     = ANY(p_colaborador_ids))
      AND (p_motorista_ids     IS NULL OR b.motorista_id       = ANY(p_motorista_ids))
  ),
  limitado AS (
    SELECT * FROM base ORDER BY bipado_em DESC LIMIT 20000
  )
  SELECT json_build_object(
    'total',   (SELECT count(*) FROM base),
    'truncado', (SELECT count(*) FROM base) > 20000,
    'linhas', (
      SELECT coalesce(json_agg(json_build_object(
        'tipo_encomenda', t.nome,
        'tipo_evento', CASE l.tipo_evento
          WHEN 'RECEBIMENTO'    THEN 'Recebimento'
          WHEN 'ENTREGA'        THEN 'Entrega'
          WHEN 'DEVOLUCAO_ORIGEM' THEN 'Devolução à Origem'
          WHEN 'RETORNO'        THEN 'Retorno'
        END,
        'operacao', t.nome || ' · ' || (CASE l.tipo_evento
          WHEN 'RECEBIMENTO'    THEN 'Recebimento'
          WHEN 'ENTREGA'        THEN 'Entrega'
          WHEN 'DEVOLUCAO_ORIGEM' THEN 'Devolução à Origem'
          WHEN 'RETORNO'        THEN 'Retorno'
        END) || ' · ' || o.data,
        'rota',        r.nome,
        'colaborador', c.nome,
        'data_hora',   l.bipado_em,
        'motorista',   m.nome,
        'codigo',      l.codigo,
        'status',      CASE WHEN l.override_aplicado THEN 'Override aplicado' ELSE 'OK' END,
        'motivo',      l.motivo
      ) ORDER BY l.bipado_em DESC), '[]')
      FROM limitado l
      JOIN operacoes    o ON o.id = l.operacao_id
      JOIN transportadoras t ON t.id = l.transportadora_id
      JOIN rotas        r ON r.id = l.rota_id
      JOIN colaboradores c ON c.id = l.colaborador_id
      LEFT JOIN motoristas m ON m.id = l.motorista_id
    )
  );
$$;

REVOKE ALL ON FUNCTION dashboard_bipagens_export(DATE, DATE, UUID[], UUID[], tipo_evento[], UUID[], UUID[], UUID[], UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dashboard_bipagens_export(DATE, DATE, UUID[], UUID[], tipo_evento[], UUID[], UUID[], UUID[], UUID[]) TO authenticated;
