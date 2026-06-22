import { requireAdmin } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Galpões</h1>
        <GalpaoFormDialog
          cidades={cidades ?? []}
          trigger={<Button disabled={!cidades?.length}>Novo galpão</Button>}
        />
      </div>

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
                colSpan={4}
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
