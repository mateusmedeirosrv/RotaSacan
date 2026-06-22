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
import { BairroFormDialog } from "./bairro-form";

export default async function BairrosPage() {
  const supabase = await requireAdmin();

  const [{ data: bairros }, { data: cidades }] = await Promise.all([
    supabase.from("bairros").select("*").order("nome"),
    supabase.from("cidades").select("*").order("nome"),
  ]);

  const cidadesPorId = new Map((cidades ?? []).map((c) => [c.id, c]));

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bairros</h1>
        <BairroFormDialog
          cidades={cidades ?? []}
          trigger={<Button disabled={!cidades?.length}>Novo bairro</Button>}
        />
      </div>

      {!cidades?.length && (
        <p className="text-sm text-muted-foreground">
          Cadastre uma cidade antes de criar bairros.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bairros?.length ? (
            bairros.map((bairro) => {
              const cidade = cidadesPorId.get(bairro.cidade_id);
              return (
                <TableRow key={bairro.id}>
                  <TableCell>{bairro.nome}</TableCell>
                  <TableCell>
                    {cidade ? `${cidade.nome} - ${cidade.uf}` : "—"}
                  </TableCell>
                  <TableCell>
                    <BairroFormDialog
                      bairro={bairro}
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
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Nenhum bairro cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
