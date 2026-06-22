"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarSenhaTemporaria } from "@/lib/auth/senha-temporaria";

type Papel = "admin" | "gerente" | "colaborador";

type ColaboradorCriarInput = {
  nome: string;
  email: string;
  cpf: string | null;
  papel: Papel;
  galpao_id: string;
};

type ColaboradorAtualizarInput = {
  nome: string;
  cpf: string | null;
  papel: Papel;
  galpao_id: string;
  ativo: boolean;
};

function mensagemErroAuth(message: string | undefined) {
  if (message?.toLowerCase().includes("already")) {
    return "Já existe um usuário com esse e-mail.";
  }
  return "Não foi possível criar o usuário de login.";
}

export async function criarColaborador(input: ColaboradorCriarInput) {
  const supabase = await requireAdmin();
  const admin = createAdminClient();

  const senhaTemporaria = gerarSenhaTemporaria();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: senhaTemporaria,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: mensagemErroAuth(authError?.message), senhaTemporaria: null };
  }

  const { error: insertError } = await supabase.from("colaboradores").insert({
    user_id: authData.user.id,
    galpao_id: input.galpao_id,
    nome: input.nome,
    email: input.email,
    cpf: input.cpf,
    papel: input.papel,
    ativo: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Não foi possível salvar o colaborador.", senhaTemporaria: null };
  }

  revalidatePath("/cadastros/colaboradores");
  return { error: null, senhaTemporaria };
}

export async function atualizarColaborador(
  id: string,
  input: ColaboradorAtualizarInput
) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("colaboradores")
    .update(input)
    .eq("id", id);

  if (error) return { error: "Não foi possível salvar o colaborador." };

  revalidatePath("/cadastros/colaboradores");
  return { error: null };
}

export async function gerarNovaSenha(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const senhaTemporaria = gerarSenhaTemporaria();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: senhaTemporaria,
  });

  if (error) {
    return { error: "Não foi possível gerar a nova senha.", senhaTemporaria: null };
  }

  return { error: null, senhaTemporaria };
}
