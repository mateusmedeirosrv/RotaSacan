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
import { criarMotorista, atualizarMotorista } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Motorista = Database["public"]["Tables"]["motoristas"]["Row"];
type Galpao = Database["public"]["Tables"]["galpoes"]["Row"];

const schema = z.object({
  galpao_id: z.string().min(1, "Selecione o galpão"),
  nome: z.string().min(1, "Informe o nome"),
  cpf: z.string().optional(),
  cnh: z.string().optional(),
  placa: z.string().optional(),
  telefone: z.string().optional(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function MotoristaFormDialog({
  motorista,
  galpoes,
  trigger,
}: {
  motorista?: Motorista;
  galpoes: Galpao[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const defaultValues = {
    galpao_id: motorista?.galpao_id ?? galpoes[0]?.id ?? "",
    nome: motorista?.nome ?? "",
    cpf: motorista?.cpf ?? "",
    cnh: motorista?.cnh ?? "",
    placa: motorista?.placa ?? "",
    telefone: motorista?.telefone ?? "",
    ativo: motorista?.ativo ?? true,
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(data: FormData) {
    const input = {
      galpao_id: data.galpao_id,
      nome: data.nome,
      cpf: data.cpf || null,
      cnh: data.cnh || null,
      placa: data.placa || null,
      telefone: data.telefone || null,
    };

    const result = motorista
      ? await atualizarMotorista(motorista.id, { ...input, ativo: data.ativo })
      : await criarMotorista(input);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(motorista ? "Motorista atualizado." : "Motorista criado.");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset(defaultValues);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {motorista ? "Editar motorista" : "Novo motorista"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <p className="text-sm text-destructive">
                {errors.galpao_id.message}
              </p>
            )}
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
            <Label htmlFor="cnh">CNH (opcional)</Label>
            <Input id="cnh" {...register("cnh")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="placa">Placa (opcional)</Label>
            <Input id="placa" {...register("placa")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input id="telefone" {...register("telefone")} />
          </div>

          {motorista && (
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
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
