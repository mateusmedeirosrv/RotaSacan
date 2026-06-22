"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { criarRota, atualizarRota } from "./actions";
import type { Database } from "@/lib/types/database.types";

type Rota = Database["public"]["Tables"]["rotas"]["Row"];
type Galpao = Database["public"]["Tables"]["galpoes"]["Row"];

const schema = z.object({
  galpao_id: z.string().min(1, "Selecione o galpão"),
  nome: z.string().min(1, "Informe o nome"),
  ativa: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function RotaFormDialog({
  rota,
  galpoes,
  trigger,
}: {
  rota?: Rota;
  galpoes: Galpao[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const defaultValues = {
    galpao_id: rota?.galpao_id ?? galpoes[0]?.id ?? "",
    nome: rota?.nome ?? "",
    ativa: rota?.ativa ?? true,
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
    if (rota) {
      const result = await atualizarRota(rota.id, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Rota atualizada.");
      setOpen(false);
      return;
    }

    const result = await criarRota({
      galpao_id: data.galpao_id,
      nome: data.nome,
    });

    if (result.error || !result.id) {
      toast.error(result.error ?? "Não foi possível criar a rota.");
      return;
    }

    toast.success("Rota criada.");
    setOpen(false);
    router.push(`/cadastros/rotas/${result.id}`);
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
          <DialogTitle>{rota ? "Editar rota" : "Nova rota"}</DialogTitle>
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
                    <SelectValue placeholder="Selecione o galpão">
                      {(value: string) =>
                        galpoes.find((g) => g.id === value)?.nome ??
                        "Selecione o galpão"
                      }
                    </SelectValue>
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

          {rota && (
            <div className="flex items-center justify-between">
              <Label htmlFor="ativa">Ativa</Label>
              <Controller
                name="ativa"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="ativa"
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
