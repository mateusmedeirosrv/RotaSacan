import Dexie, { type EntityTable } from "dexie";
import type { Database } from "@/lib/types/database.types";

export type BipagemPendentePayload = Omit<
  Database["public"]["Tables"]["bipagens"]["Insert"],
  "sincronizado_em"
> & { bipado_em: string };

export type ItemFila = {
  id?: number;
  payload: BipagemPendentePayload;
  status: "pendente" | "conflito";
  erro?: string;
  exigeOverride?: boolean;
  criadoEm: string;
};

export const dbOffline = new Dexie("rotascan") as Dexie & {
  fila: EntityTable<ItemFila, "id">;
};

dbOffline.version(1).stores({
  fila: "++id, status, [payload.operacao_id+payload.rota_id]",
});
