import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { GalpaoFormDialog } from "./galpao-form";

export default async function GalpoesPage() {
  const supabase = await requireAdmin();

  const [{ data: galpoes }, { data: cidades }] = await Promise.all([
    supabase.from("galpoes").select("*").order("nome"),
    supabase.from("cidades").select("*").order("nome"),
  ]);

  const cidadesPorId = new Map((cidades ?? []).map((c) => [c.id, c]));

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Galpões"
        action={
          <GalpaoFormDialog
            cidades={cidades ?? []}
            trigger={<Button disabled={!cidades?.length}>Novo galpão</Button>}
          />
        }
      />

      {!cidades?.length && (
        <p className="text-sm text-muted-foreground">
          Cadastre uma cidade antes de criar galpões.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {galpoes?.length ? (
            galpoes.map((galpao) => {
              const cidade = cidadesPorId.get(galpao.cidade_id);
              return (
                <TableRow key={galpao.id}>
                  <TableCell>{galpao.nome}</TableCell>
                  <TableCell>
                    {cidade ? `${cidade.nome} - ${cidade.uf}` : "—"}
                  </TableCell>
                  <TableCell>{galpao.endereco ?? "—"}</TableCell>
                  <TableCell>{galpao.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <GalpaoFormDialog
                      galpao={galpao}
                      cidades={cidades ?? []}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Nenhum galpão cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
