"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import type { Database } from "@/lib/types/database.types";

type Papel = Database["public"]["Tables"]["colaboradores"]["Row"]["papel"];

const CADASTROS_LINKS = [
  { href: "/cadastros/cidades", label: "Cidades" },
  { href: "/cadastros/bairros", label: "Bairros" },
  { href: "/cadastros/galpoes", label: "Galpões" },
  { href: "/cadastros/transportadoras", label: "Transportadoras" },
];

export function DashboardNav({
  papel,
  nome,
}: {
  papel: Papel | null;
  nome: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <nav className="flex items-center gap-4 px-6 py-3">
        <Link href="/" className="font-heading text-sm font-semibold">
          RotaScan
        </Link>

        {papel === "admin" && (
          <div className="flex items-center gap-3 text-sm">
            {CADASTROS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground",
                  pathname.startsWith(link.href) && "font-medium text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {nome && (
            <span className="text-sm text-muted-foreground">{nome}</span>
          )}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </nav>
    </header>
  );
}
