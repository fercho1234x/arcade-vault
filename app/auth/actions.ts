"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  authErrorMessage,
  DEFAULT_AUTH_ERROR,
  USERNAME_INVALID,
  USERNAME_PATTERN,
  USERNAME_TAKEN,
} from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: formData.get("password")?.toString() ?? "",
  });
  if (error) return { error: authErrorMessage(error.code) };

  // redirect() lanza una excepción de control: debe quedar fuera de cualquier try.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = field(formData, "username");
  if (!USERNAME_PATTERN.test(username)) return { error: USERNAME_INVALID };
  const upper = username.toUpperCase();

  const supabase = await createClient();

  // Mensaje claro para el caso normal; el unique en SQL cubre la carrera.
  const { data: taken, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", upper)
    .maybeSingle();
  if (lookupError) return { error: DEFAULT_AUTH_ERROR };
  if (taken) return { error: USERNAME_TAKEN };

  const { data, error } = await supabase.auth.signUp({
    email: field(formData, "email"),
    password: formData.get("password")?.toString() ?? "",
    options: { data: { username: upper } },
  });
  if (error) return { error: authErrorMessage(error.code) };
  // Sin sesión significa que "Confirm email" sigue activo en el dashboard.
  if (!data.session) return { error: DEFAULT_AUTH_ERROR };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
