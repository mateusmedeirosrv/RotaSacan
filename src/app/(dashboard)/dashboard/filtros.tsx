"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/types/database.types";

type TipoEvento = Database["public"]["Tables"]["operacoes"]["Row"]["tipo_evento"];

const TODOS = "todos";

const TIPOS_EVENTO: { value: TipoEvento; label: string }[] = [
  { value: "RECEBIMENTO", label: "Recebimento" },
  { value: "ENTREGA", label: "Entrega" },
  { value: "DEVOLUCAO_ORIGEM", label: "Devolução à Origem" },
  { value: "RETORNO", label: "Retorno" },
];

type Opcao = { id: string; nome: string };

export function DashboardFiltros({
  dataInicio,
  dataFim,
  galpaoId,
  transportadoraId,
  tipoEvento,
  operacaoId,
  rotaId,
  colaboradorId,
  motoristaId,
  galpoes,
  transportadoras,
  operacoes,
  rotas,
  colaboradores,
  motoristas,
}: {
  dataInicio: string;
  dataFim: string;
  galpaoId?: string;
  transportadoraId?: string;
  tipoEvento?: string;
  operacaoId?: string;
  rotaId?: string;
  colaboradorId?: string;
  motoristaId?: string;
  galpoes: Opcao[] | null;
  transportadoras: Opcao[];
  operacoes: Opcao[];
  rotas: Opcao[];
  colaboradores: Opcao[];
  motoristas: Opcao[];
}) {
  const router = useRouter();

  const [valores, setValores] = useState({
    data_inicio: dataInicio,
    data_fim: dataFim,
    galpao_id: galpaoId ?? TODOS,
    transportadora_id: transportadoraId ?? TODOS,
    tipo_evento: tipoEvento ?? TODOS,
    operacao_id: operacaoId ?? TODOS,
    rota_id: rotaId ?? TODOS,
    colaborador_id: colaboradorId ?? TODOS,
    motorista_id: motoristaId ?? TODOS,
  });

  function set<K extends keyof typeof valores>(chave: K, valor: string) {
    setValores((v) => ({ ...v, [chave]: valor }));
  }

  function aplicar() {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(valores)) {
      if (valor && valor !== TODOS) params.set(chave, valor);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function limpar() {
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor="data_inicio">De</Label>
        <Input
          id="data_inicio"
          type="date"
          value={valores.data_inicio}
          onChange={(e) => set("data_inicio", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="data_fim">Até</Label>
        <Input
          id="data_fim"
          type="date"
          value={valores.data_fim}
          onChange={(e) => set("data_fim", e.target.value)}
        />
      </div>

      {galpoes && (
        <SeletorFiltro
          id="galpao_id"
          label="Galpão"
          valor={valores.galpao_id}
          onChange={(v) => set("galpao_id", v)}
          opcoes={galpoes}
        />
      )}

      <SeletorFiltro
        id="transportadora_id"
        label="Transportadora"
        valor={valores.transportadora_id}
        onChange={(v) => set("transportadora_id", v)}
        opcoes={transportadoras}
      />

      <div className="space-y-1">
        <Label htmlFor="tipo_evento">Tipo de evento</Label>
        <Select value={valores.tipo_evento} onValueChange={(v) => set("tipo_evento", v ?? TODOS)}>
          <SelectTrigger id="tipo_evento" className="w-44">
            <SelectValue placeholder="Todos">
              {(value: string) =>
                value === TODOS
                  ? "Todos"
                  : TIPOS_EVENTO.find((t) => t.value === value)?.label ?? "Todos"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            {TIPOS_EVENTO.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SeletorFiltro
        id="operacao_id"
        label="Operação"
        valor={valores.operacao_id}
        onChange={(v) => set("operacao_id", v)}
        opcoes={operacoes}
      />

      <SeletorFiltro
        id="rota_id"
        label="Rota"
        valor={valores.rota_id}
        onChange={(v) => set("rota_id", v)}
        opcoes={rotas}
      />

      <SeletorFiltro
        id="colaborador_id"
        label="Colaborador"
        valor={valores.colaborador_id}
        onChange={(v) => set("colaborador_id", v)}
        opcoes={colaboradores}
      />

      <SeletorFiltro
        id="motorista_id"
        label="Motorista"
        valor={valores.motorista_id}
        onChange={(v) => set("motorista_id", v)}
        opcoes={motoristas}
      />

      <div className="flex gap-2">
        <Button type="button" onClick={aplicar}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" onClick={limpar}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

function SeletorFiltro({
  id,
  label,
  valor,
  onChange,
  opcoes,
}: {
  id: string;
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: Opcao[];
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={valor} onValueChange={(v) => onChange(v ?? TODOS)}>
        <SelectTrigger id={id} className="w-44">
          <SelectValue placeholder="Todos">
            {(value: string) =>
              value === TODOS ? "Todos" : opcoes.find((o) => o.id === value)?.nome ?? "Todos"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.id} value={opcao.id}>
              {opcao.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
