import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toaster } from "@/components/ui/sonner";

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
    <>
      <DashboardNav
        papel={colaborador?.papel ?? null}
        nome={colaborador?.nome ?? null}
      />
      {children}
      <Toaster />
    </>
  );
}
