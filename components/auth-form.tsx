"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { USERNAME_INVALID, USERNAME_PATTERN } from "@/lib/auth-errors";

type Tab = "in" | "up";

const INITIAL_STATE: AuthState = { error: null };

export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("in");

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => setTab("in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => setTab("up")}
          >
            CREAR CUENTA
          </button>
        </div>

        {/* key={tab}: cambiar de pestaña remonta el formulario y limpia el error. */}
        <AuthFields key={tab} tab={tab} />

        <button
          className="btn ghost"
          type="button"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() => router.push("/")}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

function AuthFields({ tab }: { tab: Tab }) {
  const [state, formAction, isPending] = useActionState(
    tab === "in" ? signIn : signUp,
    INITIAL_STATE,
  );

  // Inputs controlados: React resetea los no controlados al terminar la
  // action, y tras un error el jugador perdería lo que escribió.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    if (tab === "up" && !USERNAME_PATTERN.test(username.trim())) {
      e.preventDefault();
      setClientError(USERNAME_INVALID);
      return;
    }
    setClientError(null);
  };

  const error = clientError ?? state.error;

  return (
    <form action={formAction} onSubmit={submit}>
      {tab === "up" && (
        <div className="field slide-in">
          <label>Usuario</label>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="px_kai"
            maxLength={10}
            autoComplete="username"
            required
          />
        </div>
      )}
      <div className="field">
        <label>Correo electrónico</label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jugador@vault.gg"
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <label>Contraseña</label>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          autoComplete={tab === "in" ? "current-password" : "new-password"}
          required
        />
      </div>

      <button
        className="btn lg"
        type="submit"
        disabled={isPending}
        style={{ width: "100%", marginTop: 8 }}
      >
        {isPending
          ? "CARGANDO..."
          : tab === "in"
            ? "ENTRAR AL VAULT"
            : "CREAR Y JUGAR"}
      </button>

      {error && (
        <p
          className="mono"
          aria-live="polite"
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "var(--magenta)",
            letterSpacing: "0.1em",
          }}
        >
          ▸ ERROR: {error}
        </p>
      )}
    </form>
  );
}
