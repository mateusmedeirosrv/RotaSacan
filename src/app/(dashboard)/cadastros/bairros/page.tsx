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
      <PageHeader
        title="Bairros"
        action={
          <BairroFormDialog
            cidades={cidades ?? []}
            trigger={<Button disabled={!cidades?.length}>Novo bairro</Button>}
          />
        }
      />

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
            <TableHead>Status</TableHead>
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
                  <TableCell>{bairro.ativo ? "Ativo" : "Inativo"}</TableCell>
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
                colSpan={4}
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
