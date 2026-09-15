"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/auth/actions";
import { useSession } from "@/components/session-provider";

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();

  // El detalle y el reproductor cuelgan de la Biblioteca.
  const isLibrary =
    pathname === "/" ||
    pathname.startsWith("/juegos") ||
    pathname.startsWith("/jugar");
  const isHall = pathname.startsWith("/salon");
  const isAuth = pathname.startsWith("/auth");

  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isLibrary ? "active" : ""} onClick={close}>
            Biblioteca
          </Link>
          <Link
            href="/salon"
            className={isHall ? "active" : ""}
            onClick={close}
          >
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          // display: contents deja al botón como hijo directo del flex del nav.
          <form action={signOut} style={{ display: "contents" }}>
            <button className="btn ghost auth-btn" type="submit">
              {user.name} ▾
            </button>
          </form>
        ) : (
          <Link href="/auth" className="btn auth-btn" onClick={close}>
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link href="/" className={isLibrary ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isHall ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        {user ? (
          <form
            action={signOut}
            onSubmit={close}
            style={{ display: "contents" }}
          >
            {/* Replica .av-mobile-panel a, que solo estiliza enlaces. */}
            <button
              type="submit"
              style={{
                padding: "14px 12px",
                fontFamily: "var(--pixel)",
                fontSize: 11,
                color: "var(--ink-dim)",
                background: "none",
                border: "none",
                borderBottom: "1px dashed var(--line-2)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Cerrar Sesión
            </button>
          </form>
        ) : (
          <Link href="/auth" className={isAuth ? "active" : ""} onClick={close}>
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
