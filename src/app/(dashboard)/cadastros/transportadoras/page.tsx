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
import { TransportadoraFormDialog } from "./transportadora-form";

export default async function TransportadorasPage() {
  const supabase = await requireAdmin();

  const { data: transportadoras } = await supabase
    .from("transportadoras")
    .select("*")
    .order("nome");

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transportadoras</h1>
        <TransportadoraFormDialog
          trigger={<Button>Nova transportadora</Button>}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Regex de validação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transportadoras?.length ? (
            transportadoras.map((transportadora) => (
              <TableRow key={transportadora.id}>
                <TableCell>{transportadora.nome}</TableCell>
                <TableCell className="font-mono text-xs">
                  {transportadora.regex_validacao ?? "—"}
                </TableCell>
                <TableCell>
                  {transportadora.ativo ? "Ativa" : "Inativa"}
                </TableCell>
                <TableCell>
                  <TransportadoraFormDialog
                    transportadora={transportadora}
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
                Nenhuma transportadora cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
