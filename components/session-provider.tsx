"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StoredUser = { name: string };

export type StoredScore = {
  game: string;
  score: number;
  name: string;
  at: number;
};

type SessionValue = {
  user: StoredUser | null;
  signIn: (name: string) => void;
  signOut: () => void;
  saveScore: (entry: Omit<StoredScore, "at">) => void;
};

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Arranca en null a propósito: el servidor no tiene localStorage, así que el
  // primer paint del cliente debe coincidir con el HTML sin sesión.
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "name" in parsed) {
        // La spec fija este patrón: el servidor no tiene localStorage, así que
        // la sesión solo puede entrar después del primer paint. Es una única
        // pasada al montar, no un ciclo de renders en cascada.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser({ name: String((parsed as StoredUser).name) });
      }
    } catch {
      // localStorage bloqueado (modo privado, cookies desactivadas): sin sesión.
    }
  }, []);

  const signIn = useCallback((name: string) => {
    const next = { name: name.toUpperCase().slice(0, 10) };
    setUser(next);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      // Sin persistencia la sesión vive solo en memoria.
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Nada que limpiar.
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
    () => ({ user, signIn, signOut, saveScore }),
    [user, signIn, signOut, saveScore],
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
