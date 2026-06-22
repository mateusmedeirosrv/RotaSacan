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
import { criarTransportadora, atualizarTransportadora } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Transportadora = Database["public"]["Tables"]["transportadoras"]["Row"];

const schema = z.object({
  nome: z.string().min(1, "Informe o nome da transportadora"),
  regex_validacao: z.string().optional().refine((value) => {
    if (!value) return true;
    try {
      new RegExp(value);
      return true;
    } catch {
      return false;
    }
  }, "Regex inválida"),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function TransportadoraFormDialog({
  transportadora,
  trigger,
}: {
  transportadora?: Transportadora;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const defaultValues = {
    nome: transportadora?.nome ?? "",
    regex_validacao: transportadora?.regex_validacao ?? "",
    ativo: transportadora?.ativo ?? true,
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
      ...data,
      regex_validacao: data.regex_validacao || null,
    };
    const result = transportadora
      ? await atualizarTransportadora(transportadora.id, input)
      : await criarTransportadora(input);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      transportadora ? "Transportadora atualizada." : "Transportadora criada."
    );
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
            {transportadora ? "Editar transportadora" : "Nova transportadora"}
          </DialogTitle>
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
            <Label htmlFor="regex_validacao">
              Regex de validação (opcional)
            </Label>
            <Input
              id="regex_validacao"
              placeholder="^TBR\d{9}$"
              {...register("regex_validacao")}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para aceitar qualquer código não vazio.
            </p>
            {errors.regex_validacao && (
              <p className="text-sm text-destructive">
                {errors.regex_validacao.message}
              </p>
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
