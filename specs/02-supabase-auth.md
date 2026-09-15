# SPEC 02 — Supabase: base de integración y autenticación real

> **Estado:** aprovado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-14
> **Objetivo:** Conectar la app al proyecto Supabase y reemplazar la sesión falsa de `localStorage` por autenticación real con correo y contraseña, con un perfil público por jugador.

---

## Por qué existe esta spec

La SPEC 01 dejó las cinco pantallas navegables. Pero la sesión es de juguete: `/auth` acepta cualquier entrada y guarda `{ name }` en `av_user`. Sin identidad real no puede haber leaderboards compartidos, que son el corazón del producto.

El proyecto Supabase `muhxtnxcolnbplegwuau` ya existe y está conectado por MCP en `.mcp.json`. Está vacío: no hay tablas en `public` ni migraciones aplicadas.

"Implementar Supabase" se partió en piezas. Esta spec construye solo la base (dependencias, clientes, `proxy.ts`, migraciones versionadas, tipos) y la autenticación. Los puntajes persistentes van en la SPEC 03. El catálogo de juegos se queda en `lib/games.ts`.

---

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`. Se versiona `.env.example` sin valores.
- Cliente de servidor en `lib/supabase/server.ts`.
- Refresco de sesión en `lib/supabase/proxy.ts`, invocado desde `proxy.ts` en la raíz.
- Migraciones SQL versionadas en `supabase/migrations/`, aplicadas al proyecto remoto con el MCP (`apply_migration`).
- Tabla `public.profiles` con RLS, más un trigger que crea el perfil al registrarse.
- Tipos generados en `lib/supabase/database.types.ts`.
- Registro (usuario + correo + contraseña) e inicio de sesión (correo + contraseña) como Server Actions en `app/auth/actions.ts`.
- Cierre de sesión como Server Action, disparado desde el Nav.
- Hidratación de la sesión desde el servidor: `app/layout.tsx` lee el usuario y lo pasa al `SessionProvider`.
- Redirección de `/auth` a `/` cuando ya hay sesión.
- Errores de auth en una línea inline en español, con estado de carga en el botón.
- Borrado único de la clave antigua `av_user` al montar el provider.
- Actualizar `CLAUDE.md`: ya existe capa de auth, y se documentan las variables de entorno y el flujo de migraciones.

**Fuera de alcance (para specs futuras):**

- Puntajes en base de datos y leaderboards reales. `saveScore` sigue escribiendo en `av_scores` y `seededScores()` sigue alimentando detalle y salón. Esto va en la SPEC 03.
- Catálogo de juegos en base de datos.
- OAuth. Los botones `◆ GOOGLE` y `▣ GITHUB` siguen inertes.
- Magic link, confirmación de correo, recuperación y cambio de contraseña.
- Pantalla de cuenta o edición del nombre de usuario.
- Cliente de navegador (`createBrowserClient`) y `onAuthStateChange`. Nada del cliente habla con Supabase en esta spec.
- Proteger rutas de juego. `/jugar/[id]` sigue abierto a invitados.
- Stack local de Supabase con Docker.
- SMTP propio.
- Tests automatizados.

---

## Modelo de datos

### Base de datos — `public.profiles`

```sql
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null unique check (username ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);
```

Políticas RLS (RLS activado):

| Operación | Rol                     | Condición                                            |
| --------- | ----------------------- | ---------------------------------------------------- |
| `select`  | `anon`, `authenticated` | `true` (solo expone `id` y `username`)               |
| `update`  | `authenticated`         | `(select auth.uid()) = id` en `using` y `with check` |
| `insert`  | —                       | Sin política. Solo inserta el trigger.               |
| `delete`  | —                       | Sin política. Se borra en cascada con `auth.users`.  |

Trigger `on_auth_user_created` (`after insert on auth.users`) → función `public.handle_new_user()`:

- `security definer` con `set search_path = ''`.
- Inserta `(new.id, upper(new.raw_user_meta_data ->> 'username'))`.
- Si el username viola el `check` o el `unique`, el `insert` en `auth.users` falla entero. No quedan usuarios sin perfil.

### Archivos de migración

- `supabase/migrations/20260914000000_create_profiles.sql` — tabla, RLS, políticas, función y trigger en un solo archivo.
- Convención: `YYYYMMDDHHMMSS_descripcion.sql`. El mismo `name` (`create_profiles`) se pasa a `apply_migration`, así que el historial remoto y el del repo coinciden.

### Tipo de sesión en la app

```ts
// components/session-provider.tsx
export type SessionUser = {
  id: string; // auth.users.id
  name: string; // profiles.username, ej. "PX_KAI"
};
```

Mantiene la propiedad `name` de `StoredUser`, así que `game-player.tsx` y `hall-of-fame.tsx` no cambian. `StoredUser` desaparece. `StoredScore` y la clave `av_scores` se quedan tal cual.

### Estado de las Server Actions

```ts
// app/auth/actions.ts
export type AuthState = { error: string | null };
```

### Errores traducidos — `lib/auth-errors.ts`

Mapa de `AuthError.code` a texto fijo. Cualquier código no listado usa el mensaje por defecto.

| Código                                              | Mensaje                                     |
| --------------------------------------------------- | ------------------------------------------- |
| `invalid_credentials`                               | `CORREO O CONTRASEÑA INCORRECTOS`           |
| `user_already_exists`, `email_exists`               | `ESE CORREO YA TIENE CUENTA`                |
| `weak_password`                                     | `CONTRASEÑA DEMASIADO DÉBIL (MÍN. 6)`       |
| `over_request_rate_limit`                           | `DEMASIADOS INTENTOS · ESPERA UNOS MINUTOS` |
| `validation_failed`, `email_address_invalid`        | `CORREO NO VÁLIDO`                          |
| _(username ya en uso, detectado antes de `signUp`)_ | `ESE USUARIO YA ESTÁ EN USO`                |
| _(username no cumple la regex)_                     | `USUARIO: 3–10 CARACTERES, A-Z 0-9 _`       |
| _(por defecto)_                                     | `NO SE PUDO CONECTAR CON EL VAULT`          |

En pantalla se muestra con el prefijo `▸ ERROR: `.

### Entorno

```bash
# .env.example (versionado)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`.env.local` lleva los valores reales: URL `https://muhxtnxcolnbplegwuau.supabase.co` y la clave obtenida con `get_publishable_keys`. `.gitignore` ignora `.env*`, así que se añade la excepción `!.env.example`.

---

## Plan de implementación

Cada paso deja el proyecto compilando y navegable.

1. **Dependencias y entorno.** `npm install @supabase/supabase-js @supabase/ssr`. Crear `.env.local` con URL y clave publicable (vía MCP), crear `.env.example` y añadir `!.env.example` a `.gitignore`. Verificación: `git status` muestra `.env.example` y no muestra `.env.local`, y `npm run build` pasa.

2. **Migración `create_profiles`.** Escribir `supabase/migrations/20260914000000_create_profiles.sql` con la tabla, RLS, las dos políticas, `handle_new_user()` y el trigger. Aplicarla con `apply_migration` usando el nombre `create_profiles`. Verificación: `list_tables` muestra `public.profiles` con `rls_enabled: true`, y `get_advisors` (security) no reporta avisos sobre `profiles` ni `handle_new_user`.

3. **Configuración de Auth en el dashboard.** Desactivar `Confirm email` en Authentication → Sign In / Providers → Email. Es un paso manual del usuario, porque el MCP no lo expone. Verificación: el usuario confirma el cambio antes de seguir.

4. **Tipos.** Generar `lib/supabase/database.types.ts` con `generate_typescript_types`. Verificación: el archivo contiene `profiles` y `npx tsc --noEmit` pasa.

5. **Cliente de servidor.** `lib/supabase/server.ts` exporta `async function createClient()`, que usa `createServerClient<Database>` con `await cookies()` y `getAll`/`setAll`. `setAll` va en `try/catch`, porque desde un Server Component no se pueden escribir cookies. Verificación: `npx tsc --noEmit` pasa.

6. **Proxy.** Crear `lib/supabase/proxy.ts` con `updateSession(request)`, que crea el cliente sobre `request.cookies`/`response.cookies` y llama a `supabase.auth.getClaims()` sin código intermedio. Crear `proxy.ts` en la raíz con `export async function proxy(request)` y un `matcher` que excluya `_next/static`, `_next/image`, `favicon.ico` e imágenes. No redirige nada. Verificación: `npm run dev`, las cinco rutas cargan con estilos y la consola del servidor no muestra errores.

7. **Lectura de sesión.** `lib/supabase/session.ts` exporta `getCurrentUser(): Promise<SessionUser | null>`. Llama a `getClaims()`. Si hay `claims.sub`, lee `username` de `profiles` y devuelve `{ id, name }`. Si no hay sesión o falla la consulta, devuelve `null`. Verificación: `npx tsc --noEmit` pasa.

8. **Provider y layout.**
   - `SessionProvider` recibe la prop `initialUser: SessionUser | null` y expone `user` directamente de esa prop, sin `useState`.
   - Mantiene `saveScore` sin cambios.
   - Elimina `signIn` y los accesos a `av_user`.
   - Añade un `useEffect` único que hace `localStorage.removeItem("av_user")` dentro de `try/catch`.
   - `app/layout.tsx` pasa a ser `async`, hace `await getCurrentUser()` y lo pasa como `initialUser`.

   Verificación: sin sesión, el Nav muestra `Iniciar Sesión` en todas las rutas y no hay errores de hidratación.

9. **Mensajes de error.** `lib/auth-errors.ts` exporta `authErrorMessage(code?: string): string` con la tabla del modelo de datos. Verificación: `npx tsc --noEmit` pasa.

10. **Server Actions.** `app/auth/actions.ts` (`"use server"`):
    - `signIn(prev: AuthState, formData)` — `signInWithPassword({ email, password })`. Si falla, devuelve `{ error }`. Si tiene éxito, llama a `revalidatePath("/", "layout")` y a `redirect("/")`.
    - `signUp(prev: AuthState, formData)` — pasa el username a mayúsculas y valida la regex. Consulta `profiles` por `username`; si existe, devuelve `ESE USUARIO YA ESTÁ EN USO`. Si no, llama a `signUp({ email, password, options: { data: { username } } })`, luego a `revalidatePath` y a `redirect("/")`.
    - `signOut()` — `auth.signOut()` y `revalidatePath("/", "layout")`, sin redirección.

    Verificación: `npx tsc --noEmit` pasa.

11. **Formulario de auth.**
    - `components/auth-form.tsx` usa `useActionState` con `signIn` o `signUp` según la pestaña.
    - Los inputs llevan `name` (`email`, `password`, `username`).
    - Pestaña `INICIAR SESIÓN`: campos `Correo electrónico` y `Contraseña`.
    - Pestaña `CREAR CUENTA`: `Usuario` (con `.slide-in`), `Correo electrónico` y `Contraseña`.
    - Validación en cliente antes de enviar: el username cumple `^[A-Za-z0-9_]{3,10}$`, el correo es `type="email" required` y la contraseña tiene `minLength={6}`.
    - Mientras `isPending`, el botón muestra `CARGANDO...` y queda `disabled`.
    - Bajo el botón aparece `▸ ERROR: <mensaje>` cuando `state.error` no es `null`.
    - Cambiar de pestaña limpia el error.
    - `JUGAR COMO INVITADO` y los botones sociales no cambian.

    Verificación: registrar `px_kai` lleva a `/`, con el Nav mostrando `PX_KAI ▾`.

12. **Redirección de `/auth`.** `app/auth/page.tsx` hace `await getCurrentUser()` y, si hay usuario, llama a `redirect("/")`. Verificación: con sesión, visitar `/auth` termina en `/`.

13. **Nav.** El botón `{user.name} ▾` va dentro de un `<form action={signOut}>`. En el panel móvil, con sesión, el enlace `Cuenta` se sustituye por un botón `Cerrar Sesión` con el mismo `form`. Sin sesión se mantiene `Iniciar Sesión` → `/auth`. Verificación: cerrar sesión desde escritorio y desde el panel a 375px deja el Nav en `Iniciar Sesión`.

14. **Documentación.** Actualizar `CLAUDE.md`:
    - Quitar "no hay capa de datos, auth".
    - Documentar las dos variables de entorno.
    - Documentar que las migraciones viven en `supabase/migrations/` y se aplican con el MCP.
    - Indicar que los tipos se regeneran tras cada migración.

    Verificación: lectura del archivo.

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de ESLint.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `.env.local` no aparece en `git status`; `.env.example` sí está versionado y no contiene valores.
- [ ] `supabase/migrations/20260914000000_create_profiles.sql` existe, y `list_migrations` muestra `create_profiles`.
- [ ] `public.profiles` tiene RLS activado, y `get_advisors` (security) no reporta avisos sobre `profiles` ni `handle_new_user`.
- [ ] `lib/supabase/database.types.ts` existe y define la tabla `profiles`.
- [ ] Registrar usuario `px_kai`, un correo nuevo y la contraseña `arcade123` navega a `/` y el Nav muestra `PX_KAI ▾`.
- [ ] Tras ese registro existe una fila en `auth.users` y una en `public.profiles` con `username = 'PX_KAI'`.
- [ ] Recargar la página mantiene `PX_KAI ▾`, sin mostrar antes `Iniciar Sesión` en el primer paint.
- [ ] Registrar otro correo con usuario `px_kai` muestra `▸ ERROR: ESE USUARIO YA ESTÁ EN USO` y no crea filas nuevas.
- [ ] Registrar un correo ya usado muestra `▸ ERROR: ESE CORREO YA TIENE CUENTA`.
- [ ] Registrar con usuario `ab` o `px-kai` no llega a enviarse y muestra `▸ ERROR: USUARIO: 3–10 CARACTERES, A-Z 0-9 _`.
- [ ] Iniciar sesión con contraseña incorrecta muestra `▸ ERROR: CORREO O CONTRASEÑA INCORRECTOS` y el Nav sigue en `Iniciar Sesión`.
- [ ] Iniciar sesión con el correo y la contraseña correctos navega a `/` y el Nav muestra el username.
- [ ] Mientras la acción está en curso, el botón muestra `CARGANDO...` y no se puede pulsar.
- [ ] Con sesión activa, visitar `/auth` redirige a `/`.
- [ ] Pulsar `PX_KAI ▾` cierra la sesión: el Nav vuelve a `Iniciar Sesión` y las cookies `sb-*` desaparecen.
- [ ] A 375px, con sesión, el panel móvil muestra `Cerrar Sesión`, y pulsarlo cierra la sesión.
- [ ] `JUGAR COMO INVITADO` navega a `/` sin crear sesión.
- [ ] Sin sesión, `/jugar/caida` sigue funcionando y el modal propone `INVITADO`.
- [ ] Con sesión, el modal de `/jugar/caida` propone el username, y `GUARDAR PUNTUACIÓN` sigue añadiendo una entrada a `av_scores`.
- [ ] Con sesión, `/salon` muestra la fila `▸ TU MEJOR MARCA EN <JUEGO>` con el username.
- [ ] Tras cargar la app, `localStorage` no contiene la clave `av_user`.
- [ ] Ningún archivo del repo contiene la clave `service_role` ni una clave secreta de Supabase.
- [ ] La consola del navegador no muestra errores de hidratación en las cinco rutas, con y sin sesión.

---

## Decisiones

- **Sí:** esta spec cubre solo base + auth. "Implementar Supabase" entero tocaba auth, puntajes y catálogo; los puntajes van en la SPEC 03.
- **No:** mover `GAMES` a una tabla. El catálogo es estático y cambia con el código de cada juego.
- **Sí:** correo + contraseña. Encaja con el formulario existente y no requiere configurar proveedores externos.
- **No:** magic link ni OAuth. Obligan a una ruta de callback y a configuración externa; quedan para otra spec.
- **Sí:** confirmación de correo desactivada. El SMTP por defecto de Supabase solo envía unos pocos correos por hora y no llega a direcciones fuera de la organización.
- **Sí:** login con correo, no con username. `signInWithPassword` necesita el correo.
- **No:** traducir username → correo con una función `security definer`. Permitiría enumerar correos a partir de nombres públicos.
- **Sí:** `public.profiles` con trigger. El username debe ser único y consultable por los leaderboards de la SPEC 03; `user_metadata` no garantiza ninguna de las dos cosas.
- **Sí:** lectura pública de `profiles`. Solo contiene `id` y `username`, que igualmente aparecerán en leaderboards públicos.
- **No:** política de `insert` para `authenticated`. El trigger es la única vía de alta, así que no pueden existir perfiles sin usuario.
- **Sí:** comprobar el username antes de `signUp`, y además `unique` en SQL. La consulta previa da un mensaje claro; el `unique` cubre la carrera entre dos registros simultáneos.
- **Sí:** username 3–10 caracteres `A-Z 0-9 _`, en mayúsculas. Replica el `toUpperCase().slice(0, 10)` de la SPEC 01 y protege la estética de las tablas.
- **Sí:** Server Actions para signIn, signUp y signOut. El cliente de servidor escribe las cookies, y `revalidatePath` más `redirect` refrescan el layout sin sincronización manual.
- **No:** llamar a `supabase.auth.*` desde el navegador. Duplicaría la lógica de sesión en dos lados.
- **No:** crear `lib/supabase/client.ts` todavía. Nada del cliente lo usaría; se añade cuando una spec lo necesite.
- **Sí:** hidratar la sesión desde el servidor en `app/layout.tsx`. Elimina el parpadeo de `Iniciar Sesión`.
- **Sí, asumiendo el coste:** todas las rutas pasan a renderizarse dinámicamente porque el layout lee cookies. Es aceptable con este tráfico.
- **No:** activar `cacheComponents`. Sigue fuera, como en la SPEC 01.
- **Sí:** `getClaims()` en proxy y servidor. Valida la firma del JWT; `getSession()` confía en cookies manipulables.
- **Sí:** la redirección de `/auth` vive en la página, no en `proxy.ts`. El proxy solo refresca la sesión, y la comprobación queda junto a lo que protege.
- **No:** proteger `/jugar/[id]`. El modo invitado es parte del diseño aprobado.
- **Sí:** `SessionProvider` toma `user` directamente de la prop. Con `useState(initialUser)` no vería el cambio tras `revalidatePath`.
- **Sí:** `SessionUser` conserva `name`. `game-player.tsx` y `hall-of-fame.tsx` no se tocan.
- **Sí:** `saveScore` sigue en `localStorage` (`av_scores`). Reemplazarlo es exactamente la SPEC 03.
- **Sí:** borrar `av_user` al montar. Es basura de la SPEC 01 y confundiría al depurar.
- **Sí:** `signOut` no redirige. El jugador se queda en la pantalla donde estaba, ahora como invitado.
- **Sí:** SQL versionado en `supabase/migrations/`, aplicado con el MCP. Deja historial en git sin exigir Docker en Windows.
- **No:** Supabase CLI con stack local. Es más infraestructura de la que el proyecto necesita hoy.
- **Sí:** tipos generados y versionados en `lib/supabase/database.types.ts`. Mantiene las consultas tipadas y alineadas con el esquema.
- **Sí:** `.env.example` versionado, con la excepción `!.env.example` en `.gitignore`.
- **Sí:** errores traducidos a textos fijos en español según `AuthError.code`. Los mensajes crudos de Supabase están en inglés y cambian entre versiones.

---

## Riesgos

| Riesgo                                                                                                                              | Mitigación                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El proyecto remoto no tiene staging: una migración errónea afecta directamente a la única base                                      | La base está vacía hoy. La migración es un solo archivo revisable, y `get_advisors` se ejecuta justo después.                                                          |
| El trigger falla (username inválido o duplicado por carrera) y `signUp` devuelve un error genérico `Database error saving new user` | Validación en cliente, validación en la action y consulta previa de unicidad. Si aun así ocurre, se muestra el mensaje por defecto y no queda ningún usuario a medias. |
| Olvidar desactivar `Confirm email`: `signUp` no devuelve sesión y el jugador queda en limbo                                         | El paso 3 es explícito y bloqueante. Si `signUp` devuelve `session: null`, la action responde con el mensaje por defecto en lugar de redirigir.                        |
| Código entre `createServerClient` y `getClaims()` en el proxy provoca cierres de sesión aleatorios                                  | `updateSession` sigue la estructura de la guía oficial de Supabase, sin lógica intermedia.                                                                             |
| El `matcher` de `proxy.ts` intercepta estáticos y rompe CSS o fuentes                                                               | El `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes. El paso 6 verifica que las rutas cargan con estilos.                                     |
| Filtrar una clave secreta al repo                                                                                                   | Solo se usa la clave publicable (`NEXT_PUBLIC_…`). `.env*` sigue ignorado y un criterio de aceptación lo comprueba.                                                    |
| Los tipos generados se desincronizan tras futuras migraciones                                                                       | `CLAUDE.md` documenta que se regeneran después de cada `apply_migration`.                                                                                              |
| Rate limit de auth de Supabase durante pruebas repetidas                                                                            | Tiene su mensaje propio (`DEMASIADOS INTENTOS · ESPERA UNOS MINUTOS`).                                                                                                 |

---

## Lo que **no** entra en esta spec

- Puntajes en base de datos y leaderboards reales (SPEC 03).
- Catálogo de juegos en base de datos.
- OAuth, magic link, confirmación de correo o recuperación de contraseña.
- Pantalla de cuenta o cambio de username.
- Cliente de navegador de Supabase y suscripción a `onAuthStateChange`.
- Rutas de juego protegidas.
- Supabase CLI local con Docker.
- Tests automatizados.

Cada una de esas, si llega, va en su propia spec.
