import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Cliente com service role key — bypassa RLS via Admin API do Supabase Auth.
 * Nunca importar de um Client Component; só de código "use server".
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
