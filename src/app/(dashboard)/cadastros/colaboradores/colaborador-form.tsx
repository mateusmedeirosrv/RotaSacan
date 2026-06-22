"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarColaborador, atualizarColaborador, gerarNovaSenha } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Colaborador = Database["public"]["Tables"]["colaboradores"]["Row"];
type Galpao = Database["public"]["Tables"]["galpoes"]["Row"];

const PAPEIS: { value: Colaborador["papel"]; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "gerente", label: "Gerente" },
  { value: "colaborador", label: "Colaborador" },
];

function SenhaRevelada({ senha }: { senha: string }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
      <p className="text-sm font-medium">Senha temporária gerada</p>
      <p className="text-xs text-muted-foreground">
        Compartilhe com o colaborador agora — ela não será exibida novamente.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-background px-2 py-1 text-sm">
          {senha}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(senha);
            toast.success("Senha copiada.");
          }}
        >
          Copiar
        </Button>
      </div>
    </div>
  );
}

const schemaCriar = z.object({
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().optional(),
  papel: z.enum(["admin", "gerente", "colaborador"]),
  galpao_id: z.string().min(1, "Selecione o galpão"),
});

type FormCriarData = z.infer<typeof schemaCriar>;

function CriarColaboradorForm({
  galpoes,
  onClose,
}: {
  galpoes: Galpao[];
  onClose: () => void;
}) {
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormCriarData>({
    resolver: zodResolver(schemaCriar),
    defaultValues: { nome: "", email: "", cpf: "", papel: "colaborador", galpao_id: "" },
  });

  async function onSubmit(data: FormCriarData) {
    const result = await criarColaborador({
      ...data,
      cpf: data.cpf || null,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Colaborador criado.");
    setSenhaGerada(result.senhaTemporaria);
  }

  if (senhaGerada) {
    return (
      <div className="space-y-4">
        <SenhaRevelada senha={senhaGerada} />
        <DialogFooter>
          <Button onClick={onClose}>Concluir</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" autoFocus {...register("nome")} />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="cpf">CPF (opcional)</Label>
        <Input id="cpf" {...register("cpf")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="papel">Papel</Label>
        <Controller
          name="papel"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="papel" className="w-full">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {PAPEIS.map((papel) => (
                  <SelectItem key={papel.value} value={papel.value}>
                    {papel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="galpao_id">Galpão</Label>
        <Controller
          name="galpao_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="galpao_id" className="w-full">
                <SelectValue placeholder="Selecione o galpão" />
              </SelectTrigger>
              <SelectContent>
                {galpoes.map((galpao) => (
                  <SelectItem key={galpao.id} value={galpao.id}>
                    {galpao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.galpao_id && (
          <p className="text-sm text-destructive">{errors.galpao_id.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

const schemaEditar = z.object({
  nome: z.string().min(1, "Informe o nome"),
  cpf: z.string().optional(),
  papel: z.enum(["admin", "gerente", "colaborador"]),
  galpao_id: z.string().min(1, "Selecione o galpão"),
  ativo: z.boolean(),
});

type FormEditarData = z.infer<typeof schemaEditar>;

function EditarColaboradorForm({
  colaborador,
  galpoes,
  onClose,
}: {
  colaborador: Colaborador;
  galpoes: Galpao[];
  onClose: () => void;
}) {
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);
  const [gerandoSenha, setGerandoSenha] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormEditarData>({
    resolver: zodResolver(schemaEditar),
    defaultValues: {
      nome: colaborador.nome,
      cpf: colaborador.cpf ?? "",
      papel: colaborador.papel,
      galpao_id: colaborador.galpao_id,
      ativo: colaborador.ativo,
    },
  });

  async function onSubmit(data: FormEditarData) {
    const result = await atualizarColaborador(colaborador.id, {
      ...data,
      cpf: data.cpf || null,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Colaborador atualizado.");
    onClose();
  }

  async function handleGerarNovaSenha() {
    setGerandoSenha(true);
    const result = await gerarNovaSenha(colaborador.user_id);
    setGerandoSenha(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSenhaGerada(result.senhaTemporaria);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label>E-mail</Label>
        <Input value={colaborador.email} disabled />
      </div>

      <div className="space-y-1">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" autoFocus {...register("nome")} />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="cpf">CPF (opcional)</Label>
        <Input id="cpf" {...register("cpf")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="papel">Papel</Label>
        <Controller
          name="papel"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="papel" className="w-full">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {PAPEIS.map((papel) => (
                  <SelectItem key={papel.value} value={papel.value}>
                    {papel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="galpao_id">Galpão</Label>
        <Controller
          name="galpao_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="galpao_id" className="w-full">
                <SelectValue placeholder="Selecione o galpão" />
              </SelectTrigger>
              <SelectContent>
                {galpoes.map((galpao) => (
                  <SelectItem key={galpao.id} value={galpao.id}>
                    {galpao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.galpao_id && (
          <p className="text-sm text-destructive">{errors.galpao_id.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ativo">Ativo</Label>
        <Controller
          name="ativo"
          control={control}
          render={({ field }) => (
            <Switch
              id="ativo"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGerarNovaSenha}
          disabled={gerandoSenha}
        >
          {gerandoSenha ? "Gerando..." : "Gerar nova senha"}
        </Button>
        {senhaGerada && <SenhaRevelada senha={senhaGerada} />}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ColaboradorFormDialog({
  colaborador,
  galpoes,
  trigger,
}: {
  colaborador?: Colaborador;
  galpoes: Galpao[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {colaborador ? "Editar colaborador" : "Novo colaborador"}
          </DialogTitle>
        </DialogHeader>

        {colaborador ? (
          <EditarColaboradorForm
            colaborador={colaborador}
            galpoes={galpoes}
            onClose={() => setOpen(false)}
          />
        ) : (
          <CriarColaboradorForm galpoes={galpoes} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
