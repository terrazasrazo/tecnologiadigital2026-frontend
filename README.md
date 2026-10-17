# Congreso Tecnología Digital 2026 — Frontend

Aplicación web del congreso: sitio público (agenda, ponentes, verificación de constancias), webapp del asistente con **check-in por QR**, perfil de ponentes, panel del organizador y panel de administración.

Construida con **Astro 7 (SSR)** + **React 19** (islas) + **Tailwind CSS 4**. No tiene base de datos propia: todo el dato vive en la [API REST del backend](README-backend.md) y se consume **en el servidor** en cada request.

---

## Roles y funcionalidades

| Rol | Rutas | Qué puede hacer |
| --- | ----- | --------------- |
| Público | `/`, `/agenda`, `/ponentes`, `/verificar` | Información del evento, agenda por día, ponentes y verificación pública de constancias por folio |
| **Asistente** | `/app/*` | Panel personal, inscribirse/cancelar ponencias, **check-in con QR** (`BarcodeDetector` nativo), descargar constancia en PDF, editar perfil y contraseña |
| **Ponente** | `/ponente/*` | Editar semblanza y foto, ver sus ponencias |
| **Organizador** | `/organizador/*` | CRUD de ponencias, ponentes y ubicaciones; asistencia por ponencia (QR en pantalla + check-in manual); emisión de constancias |
| **Admin** | `/admin/*` | Estadísticas del evento, gestión de usuarios (alta, edición, estado, baja) y configuración de umbrales de constancias |

---

## Stack

- **Astro 7** con `output: 'server'` y adaptador `@astrojs/node` (standalone)
- **React 19** solo en islas interactivas (`client:load` / `client:visible` / `client:media`)
- **Tailwind CSS 4** (plugin Vite)
- **Vitest** (unitarias) y **Playwright** (e2e) — ver [Testing](#testing)
- Sin dependencias de UI: componentes propios (`src/components/ui`)

---

## Requisitos previos

- Node.js 20+ (probado con 24)
- Un corriente del **backend** accesible (ver [`README-backend.md`](README-backend.md)); en desarrollo local: `http://localhost:3000`

## Inicio rápido

```bash
npm install
cp .env.example .env        # o crea .env a mano (ver abajo)
npm run dev                 # http://localhost:4321
```

## Variables de entorno (`.env`)

| Variable | Default | Descripción |
| -------- | ------- | ----------- |
| `API_BASE_URL` | `http://localhost:3000` | URL base del backend. Se le agregan `/api/...` en cada petición |
| `PUBLIC_SITE_URL` | `http://localhost:4321` | URL pública del frontend. Origina la canónica, `og:url`, `robots.txt`, `sitemap.xml` y el JSON-LD del evento |
| `SESSION_SECRET` | — | Secreto para firmar las cookies de sesión; genera uno aleatorio en producción |

> **Importante:** Astro hornea `import.meta.env.*` **en el momento del build**. Si cambias estas variables, ejecuta `npm run build` (o reinicia `npm run dev`) para que tomen efecto. En despliegues, defínelas en CI/Docker **antes** de construir.

## Scripts

| Comando | Qué hace |
| ------- | -------- |
| `npm run dev` | Servidor de desarrollo en :4321 |
| `npm run build` | Compila a `dist/` (server + client) |
| `npm run preview` | Sirve el build en :4321 (se daemoniza: `astro preview stop`) |
| `npm test` | Unitarias (Vitest) |
| `npm run test:e2e` | Reconstruye, levanta preview y corre Playwright |
| `npm run test:all` | Unitarias + e2e |

---

## Arquitectura

### El dato nunca toca el browser sin pasar por el servidor

Las páginas Astro hacen `fetch` al backend **en el servidor** (lib `src/lib/api/client.ts`) y pasan datos planos como props a las islas React. Ventajas: sin CORS, sin flash de contenido y sin exponer tokens al cliente.

### Islas React mínimas

Solo se hidrata lo interactivo: formularios, escáner y generador de QR, toggles y botones con confirmación. Tablas, tarjetas y paginación son HTML de Astro (cero JS).

> **Regla importante:** al pasar props de un `.astro` a un componente React, solo strings y objetos planos — nunca elementos JSX (ver `PLAN.md` → «Props hacia React»).

### Proxies a la API (`src/pages/api/*`)

Las islas no hablan directo con el backend: llaman a los endpoints propios del frontend, que reenvían la petición con `authProxy()` (`src/lib/api/http.ts`) añadiendo el token de la cookie httpOnly, con reintento automático vía refresh en 401. Soportan cualquier método y body (JSON y `FormData` multipart con PDF).

### Autenticación

- `POST /api/session` → el backend devuelve los tokens; el frontend los guarda en **cookies httpOnly** (access ~5 min, refresh 30 días rotativa) más una cookie legible `congreso_user` para la UI.
- `src/middleware/auth.ts` refresca el access token automáticamente y protege rutas por rol: `/app` (asistente), `/ponente`, `/organizador` (solo organizador), `/admin` (solo admin).

### Check-in por QR

- **Lectura**: API nativa `BarcodeDetector` (Chrome/Edge/Android; requiere **HTTPS** para acceder a la cámara). El payload es un JWT que firma el backend.
- **Generación** (panel del organizador): librería `qrcode` sobre el token emitido por `GET /api/attendance/talks/:id/qr`.

### SEO

`SeoHead.astro` compartido por los layouts: título con marca, descripción, canonical, Open Graph/Twitter y `noindex` para zonas privadas. `robots.txt` y `sitemap.xml` se generan en SSR (incluyen el detalle de ponencias/ponentes si el backend está disponible). La landing incluye JSON-LD `Event` con el rango real de fechas de la agenda.

---

## Estructura

```
src/
├── components/        # Islas React (.tsx) y componentes presentacionales (.astro)
│   ├── admin/ attendance/ auth/ certificates/ layout/
│   ├── locations/ speakers/ talks/ users/ ui/
├── layouts/           # PublicLayout, AuthLayout, DashboardLayout, SimpleLayout (+ SeoHead)
├── lib/
│   ├── api/           # Cliente server-side + módulos por recurso + proxies del browser
│   ├── constants.ts   # ROUTES, HOME_BY_ROLE, etiquetas de roles/estados
│   ├── types.ts       # Tipos del API
│   ├── errorMessages.ts  # Código de error → mensaje amigable
│   └── utils.ts       # Fechas, duración, parseQrToken, ApiError…
├── middleware/auth.ts # Refresh + guardas por rol
├── pages/
│   ├── agenda/ ponentes/ verificar/   # público (SSR + paginación por filtros)
│   ├── auth/ app/ ponente/ organizador/ admin/
│   ├── api/           # proxies de las islas al backend
│   ├── robots.txt.ts  sitemap.xml.ts  404.astro  500.astro
└── styles/
tests/                 # E2E Playwright (public.spec.ts, roles.spec.ts)
```

---

## Testing

```bash
npm test          # 24 unitarias: utils, errorMessages
npm run test:e2e  # 10 e2E: flujos por rol, hidratación de islas, SEO, 404
```

- Los e2e necesitan el **backend corriendo en `http://localhost:3000`** con sus datos de prueba (ver credenciales en `PLAN.md`); Playwright lo reutiliza si ya corre o lo arranca con `npm run dev` en `../backend`.
- Por eso, para correr la suite usa `API_BASE_URL=http://localhost:3000` — no apuntes los tests a producción.
- Las pruebas e2e verifican además que **no haya errores de hidratación** (`pageerror`) en ninguna página visitada.

---

## Despliegue

```bash
npm run build
HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs   # servidor standalone
```

Puntos a considerar:

1. **Variables en build time**: `API_BASE_URL` y `PUBLIC_SITE_URL` deben existir al momento de compilar.
2. El check-in por QR necesita **HTTPS** (la cámara solo se expone en contextos seguros).
3. Detrás de nginx: `proxy_pass` al puerto del server con soporte de streaming; el frontend no sirve archivos estáticos sensibles (los de `dist/client` los sirve el mismo Node).

---

## Documentación relacionada

- **[README-backend.md](README-backend.md)** — especificación completa del API REST (endpoints, códigos de error, payloads).
- **`PLAN.md`** (local, no versionado) — plan de milestones M1–M8, decisiones de implementación y credenciales de prueba.
