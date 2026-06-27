import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/page-header";
import { ConfiguracoesForm } from "./configuracoes-form";
import { SenhaOverrideForm } from "./senha-override-form";

export default async function ConfiguracoesPage() {
  const supabase = await requireAdmin();

  const { data } = await supabase.from("configuracoes").select("chave, valor");
  const valores = Object.fromEntries(
    (data ?? [])
      .filter((c) => c.chave !== "senha_override")
      .map((c) => [c.chave, c.valor])
  );

  return (
    <main className="space-y-6 p-6">
      <PageHeader title="Configurações" />

      <div className="flex flex-wrap items-start gap-6">
        <ConfiguracoesForm valores={valores} />
        <SenhaOverrideForm />
      </div>
    </main>
  );
}
