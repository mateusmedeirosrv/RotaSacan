"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";

type GalpaoInput = { cidade_id: string; nome: string; endereco: string | null };

function mensagemErro(error: { code?: string }) {
  if (error.code === "23505") {
    return "Já existe um galpão com esse nome nessa cidade.";
  }
  return "Não foi possível salvar o galpão.";
}

export async function criarGalpao(input: GalpaoInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("galpoes").insert(input);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/galpoes");
  return { error: null };
}

export async function atualizarGalpao(id: string, input: GalpaoInput) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("galpoes").update(input).eq("id", id);

  if (error) return { error: mensagemErro(error) };

  revalidatePath("/cadastros/galpoes");
  return { error: null };
}
