-- RotaScan — Fase 7: ciclo Entrega <-> Retorno + motivo de retorno
-- Idempotente: pode ser executado múltiplas vezes sem erro.

ALTER TABLE bipagens ADD COLUMN IF NOT EXISTS ciclo_fechado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bipagens ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Substitui o UNIQUE simples por um índice único parcial: uma bipagem
-- ENTREGA/RETORNO com ciclo_fechado = true para de contar para a
-- duplicidade, permitindo que o mesmo código alterne Entrega -> Retorno ->
-- Entrega indefinidamente. RECEBIMENTO/DEVOLUCAO_ORIGEM nunca têm
-- ciclo_fechado = true, então o comportamento para esses tipos é idêntico
-- ao UNIQUE anterior.
ALTER TABLE bipagens DROP CONSTRAINT IF EXISTS bipagens_transportadora_id_codigo_tipo_evento_key;
CREATE UNIQUE INDEX IF NOT EXISTS bipagens_codigo_ciclo_ativo_key
  ON bipagens(transportadora_id, codigo, tipo_evento) WHERE NOT ciclo_fechado;

-- Trigger: ao bipar RETORNO, exige uma ENTREGA ativa (ciclo_fechado = false)
-- para o mesmo código e a marca como fechada; ao bipar ENTREGA, fecha um
-- RETORNO ativo anterior do mesmo código (se existir), liberando o próximo
-- ciclo. SECURITY DEFINER porque a linha atualizada pode pertencer a outro
-- colaborador (a policy de UPDATE de bipagens exige colaborador_id próprio).
CREATE OR REPLACE FUNCTION gerenciar_ciclo_entrega_retorno()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_entrega_id UUID;
BEGIN
  IF NEW.tipo_evento = 'RETORNO' THEN
    SELECT id INTO v_entrega_id FROM bipagens
    WHERE transportadora_id = NEW.transportadora_id
      AND codigo = NEW.codigo AND tipo_evento = 'ENTREGA' AND NOT ciclo_fechado
    LIMIT 1;

    IF v_entrega_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma entrega ativa encontrada para o código %.', NEW.codigo;
    END IF;

    UPDATE bipagens SET ciclo_fechado = true WHERE id = v_entrega_id;

  ELSIF NEW.tipo_evento = 'ENTREGA' THEN
    UPDATE bipagens SET ciclo_fechado = true
    WHERE transportadora_id = NEW.transportadora_id
      AND codigo = NEW.codigo AND tipo_evento = 'RETORNO' AND NOT ciclo_fechado;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ciclo_entrega_retorno ON bipagens;
CREATE TRIGGER trg_ciclo_entrega_retorno
BEFORE INSERT ON bipagens
FOR EACH ROW EXECUTE FUNCTION gerenciar_ciclo_entrega_retorno();
