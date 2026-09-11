// Decorativo: con datos mock síncronos este esqueleto no llega a verse.
export default function Loading() {
  return (
    <div className="av-detail fade-in" aria-busy="true">
      <div>
        <div className="detail-cover">
          <div className="cover-bg" />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <h2 className="neon-cyan">CARGANDO…</h2>
          <p>Rebobinando el cartucho.</p>
        </div>
      </div>
      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          <div className="lb-row">
            <div className="rk">#--</div>
            <div className="pl">
              ······
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  letterSpacing: "0.1em",
                }}
              >
                --/--/----
              </div>
            </div>
            <div className="sc">—</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
