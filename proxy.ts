import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Solo refresca la sesión de Supabase. Las redirecciones viven en cada página.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
