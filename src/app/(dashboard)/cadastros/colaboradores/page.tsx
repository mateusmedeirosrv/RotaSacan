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
import { ColaboradorFormDialog } from "./colaborador-form";

const PAPEL_LABEL: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente",
  colaborador: "Colaborador",
};

export default async function ColaboradoresPage() {
  const supabase = await requireAdmin();

  const [{ data: colaboradores }, { data: galpoes }] = await Promise.all([
    supabase.from("colaboradores").select("*").order("nome"),
    supabase.from("galpoes").select("*").order("nome"),
  ]);

  const galpoesPorId = new Map((galpoes ?? []).map((g) => [g.id, g]));

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Colaboradores"
        action={
          <ColaboradorFormDialog
            galpoes={galpoes ?? []}
            trigger={
              <Button disabled={!galpoes?.length}>Novo colaborador</Button>
            }
          />
        }
      />

      {!galpoes?.length && (
        <p className="text-sm text-muted-foreground">
          Cadastre um galpão antes de criar colaboradores.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Galpão</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {colaboradores?.length ? (
            colaboradores.map((colaborador) => (
              <TableRow key={colaborador.id}>
                <TableCell>{colaborador.nome}</TableCell>
                <TableCell>{colaborador.email}</TableCell>
                <TableCell>
                  {galpoesPorId.get(colaborador.galpao_id)?.nome ?? "—"}
                </TableCell>
                <TableCell>{PAPEL_LABEL[colaborador.papel]}</TableCell>
                <TableCell>{colaborador.ativo ? "Ativo" : "Inativo"}</TableCell>
                <TableCell>
                  <ColaboradorFormDialog
                    colaborador={colaborador}
                    galpoes={galpoes ?? []}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhum colaborador cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
