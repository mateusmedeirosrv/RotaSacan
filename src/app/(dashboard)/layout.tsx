import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("papel, nome")
    .eq("user_id", user.id)
    .single();

  return (
    <QueryProvider>
      <DashboardNav
        papel={colaborador?.papel ?? null}
        nome={colaborador?.nome ?? null}
      />
      {children}
      <Toaster />
    </QueryProvider>
  );
}
