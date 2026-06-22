import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">RotaScan</h1>
      <p className="text-muted-foreground mt-1">
        Bem-vindo, {user?.email}
      </p>
    </main>
  );
}
