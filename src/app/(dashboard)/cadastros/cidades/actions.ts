"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";

type CidadeInput = { nome: string; uf: string };

function mensagemErro(error: { code?: string }) {
  if (error.code === "23505") {
    return "Já existe uma cidade com esse nome e UF.";
  }
  return "Não foi possível salvar a cidade.";
}

export async function criarCidade(input: CidadeInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("cidades").insert(input);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/cidades");
  return { error: null };
}

export async function atualizarCidade(id: string, input: CidadeInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("cidades").update(input).eq("id", id);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/cidades");
  return { error: null };
}
