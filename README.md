# Congreso Tecnología Digital 2026 — Frontend

Aplicación web del congreso: sitio público (agenda, ponentes, verificación de constancias), webapp del asistente con **check-in por QR**, perfil de ponentes, panel del organizador y panel de administración.

Construida con **Astro 7 (SSR)** + **React 19** (islas) + **Tailwind CSS 4**. No tiene base de datos propia: todo el dato vive en la [API REST del backend](backend/README.md) y se consume **en el servidor** en cada request.

---

## Roles y funcionalidades

| Rol | Rutas | Qué puede hacer |
| --- | ----- | --------------- |
| Público | `/`, `/agenda`, `/ponentes`, `/verificar` | Información del evento, agenda por día, ponentes y verificación pública de constancias por folio |
| **Asistente** | `/app/*` | Panel personal, inscribirse/cancelar ponencias, **check-in con QR** (URL abierta con la cámara del teléfono), descargar constancia en PDF, editar perfil y contraseña |
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
- Una instancia del **backend** accesible (ver [`backend/README.md`](backend/README.md)); en desarrollo local: `http://localhost:3000`

## Inicio rápido

```bash
npm install
cp .env.example .env        # o crea .env a mano (ver abajo)
npm run dev                 # http://localhost:4321
```

## Variables de entorno (`.env`)

| Variable | Default | Descripción |
| -------- | ------- | ----------- |
| `API_BASE_URL` | `http://localhost:3000` | URL base del backend. Se le agregan `/api/...` en cada petición. Se lee en **runtime** vía `astro:env/server` (no se hornea en el build) |
| `PUBLIC_SITE_URL` | `http://localhost:4321` | URL pública del frontend. Origina la canónica, `og:url`, `robots.txt`, `sitemap.xml` y el JSON-LD del evento. En el QR, el origen lo toma el navegador (`window.location.origin`), que en producción coincide con esta URL |
| `SESSION_SECRET` | — | Secreto para firmar las cookies de sesión; genera uno aleatorio en producción |

> **Importante:** `PUBLIC_SITE_URL` se hornea **en el momento del build**: cámbiala y ejecuta `npm run build`. `API_BASE_URL`, en cambio, se resuelve en **runtime**, así que basta con definirla en el entorno del servidor (en Netlify: Site → Environment variables). Para desarrollo, reinicia `npm run dev` tras editar el `.env`.

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

Solo se hidrata lo interactivo: formularios, generador de QR, toggles y botones con confirmación. Tablas, tarjetas y paginación son HTML de Astro (cero JS).

> **Regla importante:** al pasar props de un `.astro` a un componente React, solo strings y objetos planos — nunca elementos JSX (ver [`backend/PLAN.md`](backend/PLAN.md) → «Props hacia React»).

### Proxies a la API (`src/pages/api/*`)

Las islas no hablan directo con el backend: llaman a los endpoints propios del frontend, que reenvían la petición con `authProxy()` (`src/lib/api/http.ts`) añadiendo el token de la cookie httpOnly, con reintento automático vía refresh en 401. Soportan cualquier método y body (JSON y `FormData` multipart con PDF).

### Autenticación

- `POST /api/session` → el backend devuelve los tokens; el frontend los guarda en **cookies httpOnly** (access ~5 min, refresh 30 días rotativa) más una cookie legible `congreso_user` para la UI.
- `src/middleware/auth.ts` refresca el access token automáticamente y protege rutas por rol: `/app` (asistente), `/ponente`, `/organizador` (solo organizador), `/admin` (solo admin).

### Check-in por QR

El asistente hace check-in escaneando con la **cámara nativa de su teléfono**, sin escáner en el navegador (por eso funciona en Chrome, Firefox, Safari, Edge, iOS y Android).

- **Generación** (panel del organizador): `GET /api/attendance/talks/:id/qr` emite un token firmado por ponencia (válido 30 días); el componente `QRGenerator` construye con la librería `qrcode` una **URL completa** al frontend — `<origen> + /app/checkin?talk=<id>&token=<jwt>`, donde el origen es el del navegador (`window.location.origin`).
- **Lectura**: al escanear, el teléfono abre `/app/checkin`. La página muestra una **confirmación** ("Confirmar asistencia") y solo entonces hace `POST /api/attendance/talks/:id/checkin` con el usuario de su sesión. **Nada se registra por abrir el enlace**, lo que evita altas por reenvíos, recargas o capturas.
- **Sesión**: si el enlace se abre sin sesión, el `middleware/auth.ts` redirige a `/auth/login?redirect=…` y, tras iniciar sesión, vuelve a la confirmación del QR.
- **Ingreso manual**: si alguien no puede escanear con la cámara, puede pegar la URL (o el token) del QR en `/app/checkin`.
- El backend valida que la ponencia esté dentro de su **ventana de asistencia**; la URL del QR apunta siempre al frontend (que tiene la sesión), nunca directo al backend.

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
│   └── utils.ts       # Fechas, duración, parseQrContent, ApiError…
├── middleware/auth.ts # Refresh + guardas por rol
├── pages/
│   ├── agenda/ ponentes/ verificar/   # público (SSR + paginación por filtros)
│   ├── auth/ app/ ponente/ organizador/ admin/
│   ├── api/           # proxies de las islas al backend
│   ├── robots.txt.ts  sitemap.xml.ts  404.astro  500.astro
└── styles/
tests/                 # E2E Playwright (public, roles, edit-flows, speaker-photo)
```

---

## Testing

```bash
npm test          # 28 unitarias: utils (fechas, duración, QR), errorMessages
npm run test:e2e  # 10 e2E: flujos por rol, hidratación de islas, SEO, 404
```

- Los e2e necesitan el **backend corriendo en `http://localhost:3000`** con sus datos de prueba (ver credenciales en [`backend/PLAN.md`](backend/PLAN.md)); Playwright lo reutiliza si ya corre o lo arranca con `npm run dev` en `../backend`.
- Por eso, para correr la suite usa `API_BASE_URL=http://localhost:3000` — no apuntes los tests a producción.
- Las pruebas e2e verifican además que **no haya errores de hidratación** (`pageerror`) en ninguna página visitada.

---

## Despliegue

### Netlify (producción recomendada)

El sitio es SSR de Astro y se despliega como **funciones serverless** vía
`@astrojs/netlify`: el adaptador se activa solo cuando `NETLIFY=true` (Netlify lo
define en su build); en local siempre se usa el servidor Node. Configuración en
`netlify.toml` (build `npm run build`, publish `dist`).

Variables a definir en el dashboard de Netlify (Site → Environment variables):

| Variable | Valor |
| -------- | ----- |
| `API_BASE_URL` | URL base del backend de producción (no se versiona; ver dashboard) |
| `PUBLIC_SITE_URL` | URL pública del sitio (p. ej. `https://<sitio>.netlify.app`) |
| `SESSION_SECRET` | Aleatorio y fuerte; distinto del de desarrollo |

El navegador sigue llamando a su propio origen (`/api/…` → función → backend),
por lo que no hay CORS ni cambios en el modelo de cookies. El QR se genera con el
origen del navegador, de modo que el sitio debe servirse en su dominio público (HTTPS)
para que la URL escaneada sea la correcta.

### Servidor Node manual

```bash
npm run build
HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs   # servidor standalone
```

Puntos a considerar:

1. **Variables**: `PUBLIC_SITE_URL` debe existir al momento de compilar; `API_BASE_URL` se lee en runtime (debe estar definida en el entorno del servidor).
2. El enlace del QR debe apuntar a la URL pública del sitio (**HTTPS**), que es el origen que el frontend usa para construir el QR.
3. Detrás de nginx: `proxy_pass` al puerto del server con soporte de streaming; el frontend no sirve archivos estáticos sensibles (los de `dist/client` los sirve el mismo Node).
