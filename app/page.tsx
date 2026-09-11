// Página provisional: verifica que el tema global quede aplicado.
// Se reemplazará por la biblioteca real cuando exista su spec.

const GAMES = [
  {
    id: "bloque-buster",
    title: "BLOQUE BUSTER",
    short: "Rebota la pelota y destruye muros de neón.",
    cat: "ARCADE",
    cover: "cover-bricks",
    best: 28450,
  },
  {
    id: "caida",
    title: "CAÍDA",
    short: "Encaja las piezas antes de que el techo te aplaste.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    best: 184220,
  },
  {
    id: "serpentina",
    title: "SERPENTINA",
    short: "Crece sin morder tu propia cola.",
    cat: "ARCADE",
    cover: "cover-snake",
    best: 7820,
  },
  {
    id: "invasores",
    title: "INVASORES",
    short: "Defiende el planeta de filas alienígenas.",
    cat: "SHOOTER",
    cover: "cover-invaders",
    best: 54190,
  },
];

const TOP = [
  { rank: 1, name: "PX_KAI", score: 184220 },
  { rank: 2, name: "NEONFOX", score: 176980 },
  { rank: 3, name: "Z3R0COOL", score: 168140 },
  { rank: 4, name: "MAGENTA88", score: 151600 },
];

const formatScore = (n: number) => n.toLocaleString("es-MX");

export default function Home() {
  return (
    <>
      <main className="av-main">
        <section className="av-hero">
          <h1>ARCADE VAULT</h1>
          <p className="sub">
            INSERTA MONEDA PARA JUGAR<span className="blink">_</span>
          </p>
        </section>

        <div className="av-grid">
          {GAMES.map((game) => (
            <article key={game.id} className="card">
              <div className="cover">
                <div className={`cover-bg ${game.cover}`} />
                <span className="label">{game.cat}</span>
              </div>
              <div className="meta">
                <h2 className="title">{game.title}</h2>
                <p className="desc">{game.short}</p>
              </div>
              <div className="row">
                <span className="score-badge">
                  Récord
                  <b>{formatScore(game.best)}</b>
                </span>
                <button type="button" className="btn">
                  Jugar
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="av-hall">
          <div className="leaderboard">
            <h3>MEJORES PUNTAJES</h3>
            {TOP.map((row) => (
              <div key={row.name} className={`lb-row${row.rank <= 3 ? ` top${row.rank}` : ""}`}>
                <span className="rk">{row.rank}</span>
                <span className="pl">{row.name}</span>
                <span className="sc">{formatScore(row.score)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "20px 32px",
          textAlign: "center",
          color: "var(--ink-faint)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
        }}
      >
        © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN
      </footer>
    </>
  );
}
