"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";

type TransportadoraInput = {
  nome: string;
  regex_validacao: string | null;
  ativo: boolean;
};

function mensagemErro(error: { code?: string }) {
  if (error.code === "23505") {
    return "Já existe uma transportadora com esse nome.";
  }
  return "Não foi possível salvar a transportadora.";
}

export async function criarTransportadora(input: TransportadoraInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("transportadoras").insert(input);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/transportadoras");
  return { error: null };
}

export async function atualizarTransportadora(
  id: string,
  input: TransportadoraInput
) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("transportadoras")
    .update(input)
    .eq("id", id);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/transportadoras");
  return { error: null };
}
