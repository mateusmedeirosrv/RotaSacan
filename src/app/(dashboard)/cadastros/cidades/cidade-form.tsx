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
import { criarCidade, atualizarCidade } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Cidade = Database["public"]["Tables"]["cidades"]["Row"];

const schema = z.object({
  nome: z.string().min(1, "Informe o nome da cidade"),
  uf: z
    .string()
    .length(2, "UF deve ter 2 letras")
    .transform((v) => v.toUpperCase()),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function CidadeFormDialog({
  cidade,
  trigger,
}: {
  cidade?: Cidade;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const defaultValues = {
    nome: cidade?.nome ?? "",
    uf: cidade?.uf ?? "",
    ativo: cidade?.ativo ?? true,
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
    const result = cidade
      ? await atualizarCidade(cidade.id, data)
      : await criarCidade(data);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(cidade ? "Cidade atualizada." : "Cidade criada.");
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
          <DialogTitle>{cidade ? "Editar cidade" : "Nova cidade"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" autoFocus {...register("nome")} />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" maxLength={2} {...register("uf")} />
            {errors.uf && (
              <p className="text-sm text-destructive">{errors.uf.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Ativa</Label>
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
