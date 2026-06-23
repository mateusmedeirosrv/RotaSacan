import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Supabase = SupabaseClient<Database>;
type BipagemRow = Database["public"]["Tables"]["bipagens"]["Row"];
type BipagemInsert = Database["public"]["Tables"]["bipagens"]["Insert"];

export type ResultadoBipagem =
  | { status: "confirmado"; bipagem: BipagemRow }
  | { status: "duplicado" }
  | { status: "erro"; mensagem: string };

function isUniqueViolation(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("duplicate key") === true;
}

export async function registrarBipagem(
  supabase: Supabase,
  input: Omit<BipagemInsert, "sincronizado_em">
): Promise<ResultadoBipagem> {
  const { data, error } = await supabase
    .from("bipagens")
    .insert({ ...input, sincronizado_em: null })
    .select()
    .single();

  if (error) {
    if (isUniqueViolation(error)) return { status: "duplicado" };
    return { status: "erro", mensagem: error.message };
  }

  return { status: "confirmado", bipagem: data };
}

export async function buscarUltimasBipagens(
  supabase: Supabase,
  operacaoId: string,
  rotaId: string,
  limite = 10
): Promise<BipagemRow[]> {
  const { data, error } = await supabase
    .from("bipagens")
    .select("*")
    .eq("operacao_id", operacaoId)
    .eq("rota_id", rotaId)
    .order("bipado_em", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data ?? [];
}

export async function buscarContagemPorRota(
  supabase: Supabase,
  operacaoId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("bipagens")
    .select("rota_id")
    .eq("operacao_id", operacaoId);

  if (error) throw error;

  const contagens: Record<string, number> = {};
  for (const linha of data ?? []) {
    contagens[linha.rota_id] = (contagens[linha.rota_id] ?? 0) + 1;
  }
  return contagens;
}

export async function desfazerBipagem(supabase: Supabase, bipagemId: string): Promise<void> {
  const { error } = await supabase.rpc("desfazer_bipagem", { p_bipagem_id: bipagemId });
  if (error) throw error;
}

export async function existeRecebimentoPrevio(
  supabase: Supabase,
  transportadoraId: string,
  codigo: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("bipagens")
    .select("id", { count: "exact", head: true })
    .eq("transportadora_id", transportadoraId)
    .eq("codigo", codigo)
    .eq("tipo_evento", "RECEBIMENTO");

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function tentarOverride(
  supabase: Supabase,
  params: { senhaTentativa: string; codigo: string; operacaoId: string; rotaId: string }
): Promise<boolean> {
  const { data, error } = await supabase.rpc("tentar_override", {
    senha_tentativa: params.senhaTentativa,
    p_codigo: params.codigo,
    p_operacao_id: params.operacaoId,
    p_rota_id: params.rotaId,
  });

  if (error) throw error;
  return data === true;
}
