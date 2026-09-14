// Decorativo: con datos mock síncronos este esqueleto no llega a verse.
export default function Loading() {
  return (
    <div className="av-player fade-in" aria-busy="true">
      <div className="crt">
        <div className="crt-screen">
          <div className="crt-content">
            <div>
              <div className="pixel neon-cyan" style={{ fontSize: 18 }}>
                CARGANDO
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  marginTop: 10,
                  letterSpacing: "0.16em",
                }}
              >
                INICIANDO CRT-83 <span className="blink">_</span>
              </div>
            </div>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
    </div>
  );
}
