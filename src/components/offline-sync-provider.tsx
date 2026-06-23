"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { sincronizarFila } from "@/lib/bipagem/fila-sync";

const INTERVALO_MS = 20000;

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    sincronizarFila(supabase);

    function aoReconectar() {
      sincronizarFila(supabase);
    }

    window.addEventListener("online", aoReconectar);
    const id = setInterval(() => sincronizarFila(supabase), INTERVALO_MS);

    return () => {
      window.removeEventListener("online", aoReconectar);
      clearInterval(id);
    };
  }, [supabase]);

  return children;
}
