"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Algo deu errado</CardTitle>
          <CardDescription>
            Não foi possível carregar a tela de login. Tente novamente.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={reset} className="w-full">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
