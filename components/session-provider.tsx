"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

export type SessionUser = {
  id: string;
  name: string;
};

export type StoredScore = {
  game: string;
  score: number;
  name: string;
  at: number;
};

type SessionValue = {
  user: SessionUser | null;
  saveScore: (entry: Omit<StoredScore, "at">) => void;
};

const LEGACY_USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: React.ReactNode;
}) {
  // El usuario sale directamente de la prop: el layout lo vuelve a leer tras
  // cada revalidatePath, y un useState(initialUser) no vería ese cambio.
  const user = initialUser;

  useEffect(() => {
    try {
      // Sesión falsa de la SPEC 01: ya no se lee, solo se limpia.
      localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // localStorage bloqueado: nada que limpiar.
    }
  }, []);

  const saveScore = useCallback((entry: Omit<StoredScore, "at">) => {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      const all: StoredScore[] = raw ? JSON.parse(raw) : [];
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {
      // El puntaje se pierde, pero la UI sigue confirmando el guardado.
    }
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ user, saveScore }),
    [user, saveScore],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
