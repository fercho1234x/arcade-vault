import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Acceso · Arcade Vault",
  description: "Inicia sesión o crea tu cuenta para guardar tus puntuaciones.",
};

export default async function AuthPage() {
  // Con sesión activa no hay nada que hacer aquí.
  if (await getCurrentUser()) redirect("/");

  return <AuthForm />;
}
