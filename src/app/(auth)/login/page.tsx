"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--brand-navy)" }}
    >
      {/* Card */}
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Speed stripe no topo */}
        <div className="h-1 brand-stripe" />

        <div className="px-8 py-9">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--brand-navy)" }}
            >
              Rota<span style={{ color: "var(--brand-orange)" }}>Scan</span>
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Gestão logística last-mile
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full mt-1 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>

      {/* Rodapé */}
      <p className="mt-6 text-xs text-white/25">
        Jataí · GO — Amazon · Magalu
      </p>
    </main>
  );
}
