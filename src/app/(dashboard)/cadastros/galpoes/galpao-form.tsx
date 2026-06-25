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
import { criarGalpao, atualizarGalpao } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Galpao = Database["public"]["Tables"]["galpoes"]["Row"];
type Cidade = Database["public"]["Tables"]["cidades"]["Row"];

const schema = z.object({
  cidade_id: z.string().min(1, "Selecione a cidade"),
  nome: z.string().min(1, "Informe o nome do galpão"),
  endereco: z.string().optional(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function GalpaoFormDialog({
  galpao,
  cidades,
  trigger,
}: {
  galpao?: Galpao;
  cidades: Cidade[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const defaultValues = {
    cidade_id: galpao?.cidade_id ?? "",
    nome: galpao?.nome ?? "",
    endereco: galpao?.endereco ?? "",
    ativo: galpao?.ativo ?? true,
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
    const input = { ...data, endereco: data.endereco || null };
    const result = galpao
      ? await atualizarGalpao(galpao.id, input)
      : await criarGalpao(input);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(galpao ? "Galpão atualizado." : "Galpão criado.");
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
          <DialogTitle>{galpao ? "Editar galpão" : "Novo galpão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cidade_id">Cidade</Label>
            <Controller
              name="cidade_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="cidade_id" className="w-full">
                    <SelectValue placeholder="Selecione a cidade">
                      {(value: string) => {
                        const cidade = cidades.find((c) => c.id === value);
                        return cidade
                          ? `${cidade.nome} - ${cidade.uf}`
                          : "Selecione a cidade";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map((cidade) => (
                      <SelectItem key={cidade.id} value={cidade.id}>
                        {cidade.nome} - {cidade.uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cidade_id && (
              <p className="text-sm text-destructive">
                {errors.cidade_id.message}
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
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
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
