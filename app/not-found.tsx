import Link from "next/link";

export default function NotFound() {
  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-magenta">GAME OVER</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ERROR 404 · CARTUCHO NO ENCONTRADO
          </div>
        </div>

        <p
          style={{
            color: "var(--ink-dim)",
            fontSize: 13,
            lineHeight: 1.7,
            marginBottom: 22,
          }}
        >
          La máquina se tragó la moneda pero no encontró esta pantalla.
          Vuelve al Vault y elige otro juego.
        </p>

        <Link className="btn lg" href="/" style={{ width: "100%" }}>
          VOLVER AL VAULT
        </Link>

        <div
          className="pixel"
          style={{
            marginTop: 20,
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          INSERTA OTRA MONEDA <span className="blink">_</span>
        </div>
      </div>
    </div>
  );
}
