"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { excluirOperacao } from "./actions";

export function ExcluirOperacaoButton({ operacaoId }: { operacaoId: string }) {
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function handleConfirmar() {
    setEnviando(true);
    const result = await excluirOperacao(operacaoId);
    setEnviando(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Operação excluída permanentemente.");
    setOpen(false);
    router.push("/operacoes");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm">Excluir operação</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir operação</DialogTitle>
          <DialogDescription>
            Esta ação é permanente e irá remover a operação e todas as bipagens associadas. Não pode
            ser desfeita. Tem certeza?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={enviando} onClick={handleConfirmar}>
            {enviando ? "Excluindo..." : "Excluir permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
