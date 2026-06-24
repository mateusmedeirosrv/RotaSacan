import { requireAuth } from "@/lib/auth/guards";
import { QrCodeGenerator } from "./qrcode-generator";

export default async function QrCodePage() {
  const { supabase } = await requireAuth();

  const { data } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .in("chave", [
      "qrcode_etiqueta_largura_mm",
      "qrcode_etiqueta_altura_mm",
      "qrcode_etiqueta_margem_mm",
      "qrcode_etiqueta_espacamento_coluna_mm",
      "qrcode_etiqueta_espacamento_linha_mm",
    ]);

  const valores = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));
  const larguraMm = Number(valores.qrcode_etiqueta_largura_mm) || 38.2;
  const alturaMm = Number(valores.qrcode_etiqueta_altura_mm) || 21.2;
  const margemMm = Number(valores.qrcode_etiqueta_margem_mm) || 0.4;
  const espacamentoColunaMm = Number(valores.qrcode_etiqueta_espacamento_coluna_mm) || 2.0;
  const espacamentoLinhaMm = Number(valores.qrcode_etiqueta_espacamento_linha_mm) || 0;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Gerar etiquetas QR Code</h1>
      <p className="text-sm text-muted-foreground">
        Cole ou digite os códigos (um por linha) para gerar um PDF A4 com etiquetas de{" "}
        {larguraMm.toFixed(1)} × {alturaMm.toFixed(1)} mm — útil para re-etiquetar encomendas
        com etiqueta original danificada.
      </p>
      <QrCodeGenerator
        larguraMm={larguraMm}
        alturaMm={alturaMm}
        margemMm={margemMm}
        espacamentoColunaMm={espacamentoColunaMm}
        espacamentoLinhaMm={espacamentoLinhaMm}
      />
    </main>
  );
}
