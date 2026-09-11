# SPEC 01 — MVP visual: las cinco pantallas de Arcade Vault

> **Estado:** aprovado
> **Depende de:** —
> **Fecha:** 2026-09-10
> **Objetivo:** Portar las cinco pantallas de `references/templates/` al App Router de Next 16 como rutas reales, con datos mock y sesión en localStorage, sin implementar ningún juego.

---

## Por qué existe esta spec

El repo es todavía el scaffold de `create-next-app`. El diseño ya está resuelto y validado en `references/templates/`: ocho archivos JSX que corren con React 18 desde CDN, Babel en el navegador y un router por hash. Ese prototipo no es la arquitectura final, pero sus estilos sí lo son.

Dos cosas ya se portaron en commits anteriores y **no se rehacen aquí**:

- `app/globals.css` (999 líneas) contiene el tema completo de `styles.css`. Se verificó clase por clase: no falta ninguna de las que usan las pantallas.
- `app/layout.tsx` ya carga `Press_Start_2P`, `JetBrains_Mono` y `Courier_Prime` vía `next/font`, y ya renderiza `.av-bg`, `.av-noise` y `#root`.

Lo que falta es la capa de componentes. Esta spec la construye entera y deja el MVP navegable de punta a punta.

---

## Alcance

**Dentro:**

- Cinco rutas del App Router: `/` (Biblioteca), `/juegos/[id]` (Detalle), `/jugar/[id]` (Reproductor), `/auth` (Acceso), `/salon` (Salón de la Fama).
- `Nav` compartido en `app/layout.tsx`, con enlaces activos, contador de créditos y panel móvil (`≡`, backdrop, breakpoint 840px).
- Footer compartido en `app/layout.tsx`, portado del `<footer>` inline de `app.jsx`.
- Datos mock tipados: los 8 juegos, las 5 categorías y el generador determinista de puntajes.
- Sesión de usuario en `localStorage` (`av_user`) y puntajes guardados (`av_scores`), expuestos por un Context de cliente.
- Simulación visual del reproductor: arena CSS animada, HUD, pausa, fin de partida y modal de guardado.
- `notFound()` para ids inexistentes y un `app/not-found.tsx` con estética arcade.
- `generateMetadata` por ruta.
- Un `loading.tsx` por ruta dinámica.
- Reemplazo de la página provisional `app/page.tsx`.

**Fuera de alcance (para specs futuras):**

- Cualquier juego jugable. El CRT muestra una simulación decorativa, nada más.
- Autenticación real, backend, base de datos o API routes. El formulario de `/auth` acepta cualquier entrada.
- Leaderboards reales o compartidos. Todos los puntajes que se muestran salen de `seededScores()`.
- Persistencia de puntajes más allá de escribir en `av_scores`; nada los lee todavía.
- Migración de los estilos a utilidades de Tailwind.
- Activar `cacheComponents` en `next.config.ts`.
- Imágenes reales de portada. Las carátulas son los degradados y pseudo-elementos CSS `.cover-*`.
- Tests. No hay framework configurado en el repo.

---

## Modelo de datos

No hay base de datos. Dos módulos de datos mock y dos claves de `localStorage`.

### `lib/games.ts`

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;        // slug de la URL: "bloque-buster"
  title: string;     // "BLOQUE BUSTER"
  short: string;     // una línea, para la tarjeta
  long: string;      // párrafo, para el detalle
  cat: GameCategory;
  cover: string;     // clase CSS: "cover-bricks"
  color: GameColor;  // variante del botón JUGAR
  best: number;
  plays: string;     // ya formateado: "12.4K"
};

export const GAMES: Game[];                      // los 8 de data.jsx, mismo orden
export const CATS: readonly ["TODOS", ...];      // 5 chips
export function getGame(id: string): Game | undefined;
```

Los ocho juegos, sus textos y sus valores se copian **literalmente** de `references/templates/data.jsx`. No se inventan juegos nuevos ni se reescriben descripciones.

### `lib/scores.ts`

```ts
export type ScoreRow = {
  rank: number;
  name: string;   // "PX_KAI"
  score: number;
  date: string;   // "14/03/2026"
};

export const PLAYERS: readonly string[];                    // los 18 de data.jsx
export function seededScores(seed: number, count = 12): ScoreRow[];
```

`seededScores` se porta sin cambios: LCG con `(s * 9301 + 49297) % 233280`. Es determinista a propósito — el mismo `seed` da las mismas filas en servidor y en cliente, así que puede llamarse desde un Server Component sin desajuste de hidratación. Las semillas del template se conservan: `id.length * 17 + 3` en el detalle, `id.length * 23 + 7` en el salón.

### `localStorage`

```ts
// clave "av_user"
type StoredUser = { name: string };          // { name: "PX_KAI" }

// clave "av_scores"
type StoredScore = {
  game: string;    // Game["id"]
  score: number;
  name: string;
  at: number;      // Date.now()
};                 // se guarda un StoredScore[]
```

Sin prefijo de versión: son las mismas claves que usa el prototipo y los datos son desechables.

---

## Plan de implementación

Cada paso deja el proyecto compilando y navegable.

1. **`lib/games.ts`** — tipos, `GAMES`, `CATS` y `getGame`, copiados de `data.jsx`. Verificación: `npx tsc --noEmit` pasa.

2. **`lib/scores.ts`** — `ScoreRow`, `PLAYERS` y `seededScores`. Verificación: `seededScores(10, 12)` devuelve 12 filas con `rank` de 1 a 12 y `score` descendente.

3. **`components/session-provider.tsx`** (`"use client"`) — Context con `user`, `signIn(name)`, `signOut()` y `saveScore(entry)`. El estado arranca en `null` y se hidrata desde `localStorage` dentro de un `useEffect`, nunca en el inicializador de `useState`: así el HTML del servidor y el primer render del cliente coinciden. Se envuelve `{children}` en `app/layout.tsx`. Verificación: la app sigue renderizando la página actual sin errores de hidratación en consola.

4. **`components/nav.tsx`** (`"use client"`) — portado de `nav.jsx`. Los `<a>` con `onClick` pasan a `<Link>`; el estado activo sale de `usePathname()` (`/juegos/...` y `/jugar/...` marcan Biblioteca como activa). Consume el Context para alternar entre `Iniciar Sesión` y `{user.name} ▾`. Incluye el panel móvil y el backdrop. Verificación: en <840px aparece `≡`, el panel abre y cierra.

5. **`app/layout.tsx`** — envolver con el provider, montar `<Nav />` sobre `<main className="av-main">{children}</main>` y añadir el footer. Verificación: nav y footer se ven en todas las rutas.

6. **`components/game-card.tsx`** (`"use client"`) — la tarjeta con el tilt 3D de `biblioteca.jsx` (`useRef` + `onMouseMove`). Envuelta en `<Link href={\`/juegos/${game.id}\`}>`. Verificación: al pasar el cursor la tarjeta se inclina; al salir vuelve a su sitio.

7. **`app/page.tsx`** — reemplaza la página provisional por la Biblioteca. Server Component que renderiza el hero y delega en `components/library-grid.tsx` (`"use client"`), dueño del buscador, los chips de categoría y el estado vacío. Verificación: buscar "caí" deja una tarjeta; el chip `VERSUS` deja una; una búsqueda sin resultados muestra `NO HAY RESULTADOS`.

8. **`app/juegos/[id]/page.tsx`** — Server Component. `const { id } = await params`; si `getGame(id)` es `undefined`, `notFound()`. Renderiza carátula, tags, `.stat-strip`, acciones y el `.leaderboard` con `seededScores(id.length * 17 + 3, 10)`. `JUGAR AHORA` enlaza a `/jugar/[id]`. Incluye `generateMetadata`. Verificación: `/juegos/caida` muestra CAÍDA; `/juegos/zzz` da 404.

9. **`app/jugar/[id]/page.tsx` + `components/game-player.tsx`** — la página es Server Component (valida el id, `generateMetadata`) y pasa el `Game` al componente cliente. `game-player.tsx` porta `reproductor.jsx`: HUD, arena CSS, `setInterval` de puntaje cada 220ms, pausa, `FIN`, modal con input de iniciales y `saveScore` del Context. El nombre por defecto es `user?.name ?? "INVITADO"`. Verificación: el puntaje sube solo, `PAUSA` congela y muestra el overlay, `FIN` abre el modal y `GUARDAR PUNTUACIÓN` deja el toast.

10. **`app/auth/page.tsx` + `components/auth-form.tsx`** — página con `metadata` estática; el formulario es cliente. Pestañas `INICIAR SESIÓN` / `CREAR CUENTA` (la de registro añade el campo de correo con `.slide-in`), botones sociales inertes, y `JUGAR COMO INVITADO` que solo hace `router.push("/")` sin tocar la sesión. El submit llama `signIn(usuario || "PLAYER1")` — mayúsculas, máximo 10 caracteres — y navega a `/`. Verificación: tras enviar, el Nav muestra el nombre; tras recargar, sigue mostrándolo.

11. **`app/salon/page.tsx` + `components/hall-of-fame.tsx`** — página con `metadata` estática; el componente cliente maneja las pestañas por juego, el podio y la tabla. La fila `▸ TU MEJOR MARCA EN ...` solo aparece si hay `user` en el Context. Verificación: cambiar de pestaña cambia podio y tabla; sin sesión no hay fila propia.

12. **`app/not-found.tsx`** — pantalla `GAME OVER · ERROR 404` con `VOLVER AL VAULT`, usando las clases del tema. Verificación: `/ruta-inventada` la muestra.

13. **`app/juegos/[id]/loading.tsx` y `app/jugar/[id]/loading.tsx`** — esqueleto arcade breve reutilizando `.crt` y `.card`. Verificación: `npm run build` compila sin avisos.

14. **Repaso responsive** — comprobar los tres breakpoints del tema (840px nav, 900px detalle, 720px podio) y ajustar únicamente si algo se desborda. Si hace falta CSS nuevo, se añade al final de `app/globals.css` en un bloque comentado como añadido de esta spec.

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de ESLint.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] Las cinco rutas responden: `/`, `/juegos/caida`, `/jugar/caida`, `/auth`, `/salon`.
- [ ] La consola del navegador no muestra errores de hidratación en ninguna de las cinco rutas.
- [ ] La Biblioteca lista 8 tarjetas; escribir `caí` en el buscador deja exactamente 1.
- [ ] Pulsar el chip `PUZZLE` deja exactamente 1 tarjeta; `TODOS` devuelve las 8.
- [ ] Una búsqueda sin coincidencias muestra el bloque `NO HAY RESULTADOS`.
- [ ] Hacer clic en una tarjeta lleva a `/juegos/<id>` con el título de ese juego.
- [ ] `/juegos/zzz` y `/jugar/zzz` muestran la pantalla `GAME OVER · ERROR 404`.
- [ ] En el detalle, el leaderboard muestra 10 filas y las tres primeras llevan colores oro, plata y bronce.
- [ ] `JUGAR AHORA` navega a `/jugar/<id>`.
- [ ] En el reproductor el puntaje aumenta solo mientras no está en pausa.
- [ ] `PAUSA` detiene el contador y muestra el overlay `EN PAUSA`; `REANUDAR` lo reactiva.
- [ ] `FIN` abre el modal con la puntuación final; `GUARDAR PUNTUACIÓN` muestra `▸ PUNTUACIÓN GUARDADA_` y añade una entrada a `av_scores` en localStorage.
- [ ] `JUGAR DE NUEVO` reinicia puntaje a 0, vidas a 3 y nivel a 01.
- [ ] Enviar el formulario de `/auth` con usuario `px_kai` deja el Nav mostrando `PX_KAI ▾` y persiste tras recargar.
- [ ] `JUGAR COMO INVITADO` navega a `/` sin escribir en `av_user`; el Nav sigue mostrando `Iniciar Sesión`.
- [ ] Pulsar el nombre de usuario en el Nav cierra la sesión y borra `av_user`.
- [ ] En `/salon`, cambiar de pestaña de juego cambia el podio y las 12 filas de la tabla.
- [ ] Con sesión iniciada, `/salon` muestra la fila `▸ TU MEJOR MARCA EN <JUEGO>`; sin sesión, no aparece.
- [ ] A 375px de ancho el nav muestra `≡`, el panel lateral abre y sus enlaces navegan.
- [ ] Ninguna ruta produce scroll horizontal a 375px.
- [ ] El título del navegador incluye el nombre del juego en `/juegos/<id>` y `/jugar/<id>`.
- [ ] `app/page.tsx` ya no contiene los arrays `GAMES` ni `TOP` provisionales.

---

## Decisiones

- **Sí:** rutas reales del App Router, una por pantalla. Da URLs compartibles y aprovecha Server Components para el detalle y el salón.
- **No:** replicar el router por hash de `app.jsx`. Era una muleta del prototipo en un solo HTML.
- **Sí:** `app/globals.css` se mantiene como está y los componentes usan sus clases (`.card`, `.crt`, `.podium`…). Fidelidad 1:1 con el diseño aprobado y cero riesgo de romper scanlines, tilt o keyframes.
- **No:** migrar a utilidades de Tailwind. Habría que reimplementar a mano pseudo-elementos, animaciones y el efecto CRT, con mucho trabajo y riesgo visual a cambio de nada.
- **Sí:** `localStorage` para la sesión, igual que el prototipo. Sin backend es la única forma de ver los estados de UI con usuario.
- **No:** leer `localStorage` en el inicializador de `useState`. El servidor no lo tiene y provocaría desajuste de hidratación; se lee en `useEffect`.
- **Sí:** `seededScores` se queda determinista. Permite renderizar leaderboards desde el servidor sin desajuste.
- **Sí:** `notFound()` más `app/not-found.tsx` temático. Un 404 genérico de Next rompería la estética en la única pantalla de error del MVP.
- **No:** `redirect("/")` para ids inválidos. Oculta el error y deja al usuario sin entender qué pasó.
- **Sí:** `JUGAR COMO INVITADO` navega sin crear sesión. Es lo que el template intentaba hacer: `onLogin(null)` era un bug, guardaba `null` en `av_user`.
- **Sí:** datos repartidos en `lib/games.ts` y `lib/scores.ts`. El catálogo y el generador de puntajes cambian por motivos distintos.
- **No:** `window.GAMES` y compañía. Eran necesarios porque el prototipo no tenía módulos.
- **Sí:** se incluyen los `loading.tsx`, a petición explícita del usuario. Quedan registrados como decorativos: con datos mock síncronos no llegarán a verse.
- **Sí:** la simulación del reproductor se porta tal cual. Es la forma de demostrar los estados de pausa, fin de partida y guardado sin escribir un juego.
- **No:** activar `cacheComponents`. No es un rename, obliga a adoptar el modelo completo de `<Suspense>` y aquí no hay datos remotos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Desajuste de hidratación al leer `localStorage` en el primer render | El provider arranca en `null` y se hidrata en `useEffect`. El primer paint siempre es el estado sin sesión. |
| `localStorage` bloqueado (modo privado, cookies desactivadas) | Todo acceso va dentro de `try/catch`, igual que en `app.jsx`. Sin persistencia la app sigue funcionando. |
| `references/templates/` y `app/globals.css` se desincronizan | Ya hay un comentario al inicio de `globals.css` advirtiéndolo. Cualquier CSS nuevo de esta spec se añade al final en un bloque marcado. |
| El `setInterval` del reproductor sigue vivo al salir de la ruta | El `useEffect` devuelve su `clearInterval`; cubierto por las dependencias `[over, paused]`. |
| Traducir `onClick` a `<Link>` rompe el estilado del nav | `.av-nav .links a` estiliza por etiqueta `<a>`, y `<Link>` renderiza un `<a>`. Las clases `.active` se conservan. |

---

## Lo que **no** entra en esta spec

- Ningún juego jugable. Ni uno.
- Autenticación real, backend, base de datos o API routes.
- Leaderboards reales: todos los puntajes visibles son generados.
- Lectura de `av_scores` para mostrar historial propio.
- Migración de estilos a Tailwind.
- Tests automatizados.

Cada una de esas, si llega, va en su propia spec.
