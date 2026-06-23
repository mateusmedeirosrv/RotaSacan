"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { dbOffline, type ItemFila } from "@/lib/bipagem/db-offline";
import { descartarConflito, resolverConflitoComOverride } from "@/lib/bipagem/fila-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConflitosSection({ operacaoId }: { operacaoId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [itemOverride, setItemOverride] = useState<ItemFila | null>(null);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const conflitos = useLiveQuery(
    () =>
      dbOffline.fila
        .filter((item) => item.payload.operacao_id === operacaoId && item.status === "conflito")
        .toArray(),
    [operacaoId],
    []
  );

  async function handleDescartar(itemId?: number) {
    if (itemId === undefined) return;
    await descartarConflito(itemId);
    toast.success("Conflito descartado.");
  }

  async function handleConfirmarOverride() {
    if (!itemOverride) return;
    setEnviando(true);
    try {
      const resultado = await resolverConflitoComOverride(supabase, itemOverride, senha);
      if (resultado.ok) {
        toast.success("Bipagem liberada com override.");
        setItemOverride(null);
        setSenha("");
      } else {
        toast.error("Senha de override incorreta.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (!conflitos || conflitos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Conflitos de sincronização</h2>
      <ul className="divide-y rounded-lg border text-sm">
        {conflitos.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-3">
            <div>
              <p className="font-medium">{item.payload.codigo}</p>
              <p className="text-xs text-muted-foreground">{item.erro}</p>
            </div>
            {item.exigeOverride ? (
              <Button variant="outline" size="sm" onClick={() => setItemOverride(item)}>
                Aplicar override
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleDescartar(item.id)}>
                Descartar
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog
        open={!!itemOverride}
        onOpenChange={(open) => {
          if (!open) {
            setItemOverride(null);
            setSenha("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrega sem recebimento prévio</DialogTitle>
            <DialogDescription>
              O código <strong>{itemOverride?.payload.codigo}</strong> não tinha recebimento
              registrado no momento da sincronização. Informe a senha de override para liberar.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmarOverride()}
            placeholder="Senha de override"
            autoFocus
          />
          <DialogFooter>
            <Button disabled={enviando || !senha} onClick={handleConfirmarOverride}>
              {enviando ? "Verificando..." : "Liberar bipagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
