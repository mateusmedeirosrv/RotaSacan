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
import { CidadeFormDialog } from "./cidade-form";

export default async function CidadesPage() {
  const supabase = await requireAdmin();

  const { data: cidades } = await supabase
    .from("cidades")
    .select("*")
    .order("nome");

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Cidades"
        action={<CidadeFormDialog trigger={<Button>Nova cidade</Button>} />}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>UF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cidades?.length ? (
            cidades.map((cidade) => (
              <TableRow key={cidade.id}>
                <TableCell>{cidade.nome}</TableCell>
                <TableCell>{cidade.uf}</TableCell>
                <TableCell>{cidade.ativo ? "Ativa" : "Inativa"}</TableCell>
                <TableCell>
                  <CidadeFormDialog
                    cidade={cidade}
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
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Nenhuma cidade cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
