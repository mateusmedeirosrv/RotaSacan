"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";

type BairroInput = { cidade_id: string; nome: string };

function mensagemErro(error: { code?: string }) {
  if (error.code === "23505") {
    return "Já existe um bairro com esse nome nessa cidade.";
  }
  return "Não foi possível salvar o bairro.";
}

export async function criarBairro(input: BairroInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("bairros").insert(input);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/bairros");
  return { error: null };
}

export async function atualizarBairro(id: string, input: BairroInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("bairros").update(input).eq("id", id);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/bairros");
  return { error: null };
}
