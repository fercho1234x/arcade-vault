import type { SessionUser } from "@/components/session-provider";
import { createClient } from "@/lib/supabase/server";

// getClaims() valida la firma del JWT; getSession() confiaría en cookies
// que cualquiera puede manipular.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const id = claimsData?.claims?.sub;
  if (claimsError || !id) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .maybeSingle();
  if (error || !profile) return null;

  return { id, name: profile.username };
}
