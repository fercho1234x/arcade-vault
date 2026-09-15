# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

No hay framework de tests configurado todavía. Si se agrega uno, documentar aquí el comando para ejecutar un test individual.

Para verificar un cambio en caliente: `npm run dev` y revisar el indicador de dev de Next + logs de navegador y servidor. El flujo recomendado está en `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`.

## Qué es este proyecto

`arcade-vault` es una plataforma para jugar online y competir por puntaje (ver `README.md`). Hoy el repo es el scaffold de `create-next-app` sin lógica de dominio: `app/layout.tsx` (fuentes Geist + `globals.css`) y `app/page.tsx` (landing por defecto, con la metadata todavía en "Create Next App"). La autenticación ya es real (SPEC 02, Supabase); el catálogo de juegos y los puntajes siguen siendo mock (`lib/games.ts`, `lib/scores.ts`, `av_scores` en localStorage).

## Supabase

- **Variables de entorno** (en `.env.local`, plantilla en `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Solo se usa la clave publicable; nunca versionar `service_role` ni claves secretas.
- **Clientes**: `lib/supabase/server.ts` (Server Components y Server Actions). `proxy.ts` → `lib/supabase/proxy.ts` solo refresca la sesión con `getClaims()`. Todavía no hay cliente de navegador.
- **Sesión**: `lib/supabase/session.ts` → `getCurrentUser()`; `app/layout.tsx` lo pasa a `SessionProvider` como `initialUser`. Login/registro/logout son Server Actions en `app/auth/actions.ts`.
- **Migraciones**: SQL versionado en `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`, aplicado al proyecto remoto con el MCP (`apply_migration`, mismo `name` que el archivo).
- **Tipos**: regenerar `lib/supabase/database.types.ts` con `generate_typescript_types` después de cada migración.
- **Auth**: correo + contraseña, con "Confirm email" desactivado en el dashboard (si se reactiva, `signUp` no devuelve sesión y el registro falla).

## Flujo de trabajo: Spec Driven Design

El proyecto se desarrolla con **Spec Driven Design** usando las skills `/spec` y `/spec-impl` del pack [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills):

```bash
npx skills@latest add Klerith/fernando-skills
```

Antes de implementar una feature, verificar si existe una spec asociada y trabajar a partir de ella en lugar de improvisar el diseño.

## Convenciones de esta versión de Next.js (16.3.4)

`AGENTS.md` obliga a leer `node_modules/next/dist/docs/` antes de escribir código; esta versión difiere de la mayoría de ejemplos conocidos. Puntos que ya afectan a este repo:

- **Tipos de props globales, sin import**: `PageProps<'/ruta'>`, `LayoutProps<'/ruta'>`, `RouteContext<'/ruta/[id]'>`. `app/layout.tsx` ya usa `LayoutProps<"/">`. No se declaran interfaces de props a mano.
- **Request APIs asíncronas**: `params`, `searchParams`, `cookies()`, `headers()` se esperan con `await`. Lo mismo aplica a los parámetros de `icon`, `opengraph-image` y `sitemap`.
- **`middleware.ts` → `proxy.ts`**.
- **App Router únicamente** (`app/`); no hay `pages/`.
- **Tailwind CSS v4**: se configura desde `app/globals.css` con `@import "tailwindcss"` y el bloque `@theme inline`. No existe `tailwind.config.js` y no debe crearse uno.
- **ESLint flat config** en `eslint.config.mjs` (`eslint-config-next/core-web-vitals` + `/typescript`).
- Alias de imports: `@/*` apunta a la raíz del proyecto (`tsconfig.json`).

### Al agregar datos (leaderboards, catálogo de juegos)

- **Cache Components está desactivado**: `next.config.ts` no tiene `cacheComponents: true`. Activarlo no es un rename — obliga a envolver datos no cacheados en `<Suspense>` y a adoptar el modelo completo. Mientras siga apagado, seguir `01-app/02-guides/caching-without-cache-components.md`; si se decide adoptarlo, `01-app/02-guides/migrating-to-cache-components.md`.
- Las APIs de caché cambiaron en v16 (`revalidateTag`, `updateTag`, `refresh`, `cacheLife`/`cacheTag`): confirmar firmas en los docs empaquetados, no de memoria.
- **`next/image`**: `images.domains` está deprecado (usar `images.remotePatterns`) y cambiaron los defaults de `minimumCacheTTL`, `imageSizes` y `qualities`.

Referencias útiles dentro de los docs empaquetados: `01-app/01-getting-started/` para las bases y `01-app/02-guides/upgrading/version-16.md` para el listado completo de breaking changes.

# Skills

Usa siempre /frontend-desing para diseñar la interfaz de usuario.
