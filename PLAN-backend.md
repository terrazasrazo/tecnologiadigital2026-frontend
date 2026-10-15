# PLAN.md — API REST de Eventos (Ponencias, Asistentes y Constancias)

Plan de acción por milestones para la construcción de la API REST.

## 1. Objetivo del proyecto

API REST que da soporte al ciclo completo de un evento académico: alta y administración
de usuarios, registro de ponencias y ponentes, control de asistencia mediante QR con
ventana de tiempo por ponencia, generación y envío de constancias en PDF, y estadísticas
de usuarios y asistencia. Será consumida por un Frontend en Astro alojado en otro servidor.

## 2. Decisiones de base (cerradas)

| Tema | Decisión |
|---|---|
| Lenguaje | JavaScript con ES Modules (`"type": "module"`) |
| Runtime | Node 24.13 / npm 11.21 |
| Framework HTTP | Express 5 |
| ORM | Sequelize + `sequelize-cli` (migraciones y seeders) |
| Driver de BD | `mysql2`, dialecto conmutable por entorno |
| Motores | MySQL en desarrollo → MariaDB en producción (cambio de `DB_DIALECT`) |
| Autenticación | JWT (access + refresh con rotación persistida en BD) + bcrypt |
| Roles | `admin`, `organizador`, `ponente`, `asistente` |
| PDF | wkhtmltopdf (por defecto) / Gotenberg (adaptador alterno) mediante `PDF_PROVIDER` |
| Correo | Nodemailer + plantillas EJS sobre SMTP |
| Fotografías | Disco local (`storage/uploads`) tras una capa de storage |
| QR | Token firmado (HMAC) por ponencia + ventana de asistencia por ponencia |
| Constancias | PDF de 2 páginas: anverso (horas) + reverso (ponencias asistidas) |
| Configuración admin | Tabla `settings` |
| Validación | Zod |
| Logs | Pino |
| Tests | Vitest + Supertest |
| Infraestructura | Sin Docker; el equipo provee MySQL, MariaDB y SMTP |

## 3. Estrategia de portabilidad MySQL ↔ MariaDB (transversal)

Requisito de alto riesgo; se ataca desde el día 0.

- `DB_DIALECT` (`mysql` | `mariadb`) más `DB_HOST/PORT/USER/PASS/NAME`, leídos por
  `src/config/database.js`.
- Reglas de código **dialect-neutral**: nada de SQL crudo específico de un motor; todo
  vía modelos y `queryInterface` de Sequelize.
- Evitar features de un solo motor: collation `utf8mb4_0900_ai_ci` (solo MySQL 8),
  `RETURNING`, columnas generadas, funciones nativas sobre `JSON`, `FULLTEXT`.
- Convenciones fijas: `charset: utf8mb4`, `collation: utf8mb4_general_ci` (compatible con
  ambos), timestamps en UTC, `ENUM` vía `DataTypes.ENUM` o tablas catálogo.
- Migraciones reversibles (`up` / `down`) y agnósticas.
- Script `npm run check:portability` que corre migraciones + seed + suite de tests contra
  MariaDB; se ejecuta antes del despliegue a producción una vez exista un MariaDB
  accesible. En desarrollo se trabaja con MySQL.

## 4. Estructura de carpetas

```
backend/
├─ src/
│  ├─ app.js                 # app Express (sin listen)
│  ├─ server.js              # bootstrap / listen
│  ├─ config/
│  │  ├─ index.js            # parseo de variables de entorno
│  │  └─ database.js         # instancia Sequelize + switch de dialecto
│  ├─ db/
│  │  ├─ migrations/
│  │  ├─ seeders/
│  │  └─ models/             # user, role, token, settings, speaker, talk,
│  │                         # talk_speaker, location, attendance,
│  │                         # certificate + index.js (asociaciones)
│  ├─ modules/               # organizado por dominio
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ speakers/
│  │  ├─ talks/
│  │  ├─ locations/
│  │  ├─ attendance/
│  │  ├─ certificates/
│  │  └─ statistics/
│  │     └─ cada uno: routes.js, controller.js, service.js, validators.js
│  ├─ middlewares/           # auth, rbac, validate, error, rateLimit, upload
│  ├─ services/              # mailer, pdf, qr, storage, certificateBuilder
│  ├─ emails/templates/      # plantillas EJS
│  ├─ utils/
│  ├─ constants/
│  └─ routes/index.js
├─ storage/uploads/
├─ tests/
├─ .env.example
├─ .sequelizerc
├─ package.json
└─ README.md
```

## 5. Modelo de datos (resumen)

- **roles**: `name`, `description`.
- **users**: `name`, `lastName`, `email` (unique), `passwordHash`, `entity` (texto libre),
  `educationLevel` (texto libre), `phone`, `roleId`, `status`
  (`pending` | `active` | `inactive`), `emailVerifiedAt`, `lastLoginAt`.
- **tokens**: `userId`, `tokenHash`, `type` (`email_verification` | `password_reset`),
  `expiresAt`, `usedAt`.
- **settings**: configuración administrable por el admin (clave/valor o singleton).
  Incluye el umbral de elegibilidad de constancia (mínimo de ponencias y mínimo de horas;
  el admin activa cuál aplicar; por defecto mínimo de ponencias = 1).
- **speakers**: `userId?`, `name`, `academicDegree`, `institution`, `bio`, `photoPath`.
- **locations**: `name`, `building`, `capacity`, `address`.
- **talks**: `title`, `description`, `date`, `startTime`, `endTime`, `locationId`,
  `attendanceOpensAt`, `attendanceClosesAt` (ventana de asistencia), `qrSecret`, `status`,
  `createdBy`.
- **talk_speakers**: N:M `talkId` + `speakerId`.
- **attendances**: `talkId`, `userId`, `registeredAt`, `method`, `ip`; único
  `(talkId, userId)`.
- **certificates**: `userId`, `code`, `issuedAt`, `filePath`, `talksCount`,
  `hoursTotal`, `thresholdSnapshot`.

## 6. Diseño de seguridad

- Helmet, CORS con allowlist del origen de Astro, `hpp`, sanitización de input.
- `express-rate-limit` reforzado en `/auth/*` y límite general.
- JWT access (vida corta) + refresh con rotación persistida en BD (endpoint, sin cookies,
  por ser dominios distintos).
- RBAC mediante middleware `authorize(...roles)` y validación de propiedad
  (p. ej. un ponente edita solo su perfil).
- Contraseñas con bcrypt; tokens de correo/reset hasheados, de un solo uso y con expiración.
- Firma HMAC en el token QR para impedir forjar asistencias; ventana validada en servidor.
- Uploads: validación de tipo/tamaño y nombres aleatorios.

## 7. Módulos y procesos

### 7.1 Ventana de asistencia por QR (M5)

- Cada ponencia guarda `attendanceOpensAt` y `attendanceClosesAt` (timestamps absolutos).
- Ejemplo: ponencia 10:00–11:00 → ventana 10:40–11:10 (20 min antes del fin, 10 min
  después). Se configura por ponencia; la UI puede ofrecer esos offsets como valor por
  defecto, pero se persisten los tiempos absolutos.
- El QR (token firmado por ponencia) solo registra asistencia dentro de la ventana; fuera
  de ella el endpoint responde **bloqueado**.
- Anti-duplicado por `(talkId, userId)`.
- El QR se muestra en pantalla durante la sesión.
- *Mejora opcional futura*: QR rotativo (cambia cada N segundos) para mitigar que un QR
  estático sea fotografiado y compartido.

### 7.2 Constancias (M7)

- PDF de **dos páginas**:
  - **Anverso**: datos del asistente y **total de horas** sumadas.
  - **Reverso**: tabla de ponencias asistidas (título, duración, fecha).
- Duración por ponencia calculada de `startTime` / `endTime`; suma en horas para el
  anverso.
- Plantilla HTML con **CSS simple** (compatible con el WebKit antiguo de wkhtmltopdf: sin
  flex/grid ni variables CSS modernas).
- `PDF_PROVIDER=wkhtmltopdf` por defecto; Gotenberg como adaptador alterno.
- Elegibilidad leída de `settings`; solo el `admin` la administra. Si el asistente no
  alcanza el umbral, la emisión se bloquea.

## 8. Milestones

### M0 — Fundación y tooling
- **Objetivo**: esqueleto ejecutable y portable.
- **Entregables**: `package.json` ESM, ESLint/Prettier, `.env.example`, `.sequelizerc`,
  config Sequelize con dialecto conmutable, conexión a BD, app Express + `/health`,
  middleware de errores, logger Pino, `sequelize-cli` operativo.
- **Aceptación**: `npm run dev` levanta; `db:migrate` corre en MySQL y MariaDB.

### M1 — Núcleo de datos y autenticación
- **Objetivo**: identidad y acceso.
- **Entregables**: modelos/migraciones/seeders de `roles`, `users`, `tokens`, `settings`;
  hash de contraseña; emisión/validación de JWT access + refresh; middlewares `auth` y
  `rbac`; validación Zod.
- **Aceptación**: seed de los 4 roles; login devuelve par de tokens; rutas protegidas
  rechazan sin rol.

### M2 — Gestión de usuarios
- **Objetivo**: ciclo de vida del usuario.
- **Entregables**: registro, confirmación de correo (token + reenvío), login/logout/refresh,
  recuperación de contraseña (forgot/reset), edición de perfil y cambio de contraseña,
  CRUD y estado de usuarios para `admin`.
- **Aceptación**: flujos completos probados end-to-end con correo en SMTP.

### M3 — Ponentes y almacenamiento de fotos
- **Objetivo**: catálogo de ponentes.
- **Entregables**: modelo/migración `speakers`, CRUD con RBAC, subida de fotografía
  (multer + `storage/uploads`), servicio de storage abstraído, listado público.
- **Aceptación**: crear/editar ponente con foto; archivo servido correctamente.

### M4 — Ubicaciones y Ponencias
- **Objetivo**: agenda del evento.
- **Entregables**: modelo/migración `locations` + CRUD; modelo/migración `talks` + N:M con
  ponentes; CRUD; validaciones (horarios, solape, ubicación); filtros/listado.
- **Aceptación**: crear ponencia con varios ponentes y ubicación; validaciones de tiempo
  funcionan.

### M5 — QR y asistencia
- **Objetivo**: registro de asistencia verificable.
- **Entregables**: generación de QR por ponencia (token firmado), configuración de ventana
  por ponencia, endpoint de registro de asistencia (autenticado), anti-duplicados, listado
  de asistencias.
- **Aceptación**: solo dentro de la ventana registra; QR falsificado se rechaza; sin
  duplicados por usuario/ponencia.

### M6 — Infraestructura de correo
- **Objetivo**: canal de notificaciones reutilizable.
- **Entregables**: servicio `mailer` (Nodemailer/SMTP), plantillas EJS (verificación, reset,
  constancia), helper de envío con manejo de errores y reintentos.
- **Aceptación**: M2 y M7 usan el mismo servicio con plantillas.

### M7 — Constancias (PDF + notificación)
- **Objetivo**: emisión de constancias.
- **Entregables**: plantilla HTML de 2 páginas; adaptador PDF
  (`PDF_PROVIDER=wkhtmltopdf|gotenberg`); cálculo de ponencias asistidas y horas;
  umbral configurable desde `settings`; endpoint de emisión/descarga; email con constancia
  adjunta; detalle imprimible (título, duración, fecha).
- **Aceptación**: PDF correcto desde plantilla; umbral respetado; correo con adjunto;
  recuento de horas y ponencias coincide con las asistencias.

### M8 — Estadísticas
- **Objetivo**: reportería.
- **Entregables**: endpoints de usuarios (total, activos, por entidad, por nivel educativo,
  asistencia a ponencias) y de asistencia (por ponencia, tasas, ranking); agregaciones
  portables MySQL/MariaDB; posible caché.
- **Aceptación**: cifras coinciden con los datos sembrados.
- **Nota**: entidad y nivel educativo son texto libre; se agrupan por valores normalizados
  (trim / colapsar espacios) para evitar duplicados por errores de captura. Mejora futura:
  autocompletado alimentado por valores existentes.

### M9 — Endurecimiento, tests y documentación
- **Objetivo**: calidad y entrega.
- **Entregables**: Helmet/CORS/rate-limit finales, suites Vitest + Supertest por módulo,
  OpenAPI/Swagger, README con setup, variables y pasos de despliegue, checklist de
  portabilidad ejecutado contra MariaDB.
- **Aceptación**: `npm test` verde; documentación reproducible.

### M10 — Despliegue y CI (opcional/configurable)
- **Objetivo**: puesta en producción.
- **Entregables**: pipeline CI (lint + test), estrategia de migraciones en prod,
  configuración `NODE_ENV=production`, HTTPS y gestión de secretos, PM2/systemd.
- **Aceptación**: despliegue limpio migrando desde desarrollo.

## 9. Prerrequisitos del entorno

1. Instalar **wkhtmltopdf** en la máquina (desarrollo y producción).
2. Verificación de portabilidad: se trabaja con MySQL en desarrollo y se cambia a MariaDB
   en producción; `npm run check:portability` se ejecuta antes del deploy cuando exista un
   MariaDB accesible.
3. Servidor SMTP para correo (o uno de pruebas en desarrollo).

## 10. Riesgos y decisiones abiertas

- **Refresh token cross-server**: refresh por endpoint con rotación persistida (sin
  cookies), por simplicidad entre dominios distintos.
- **wkhtmltopdf**: motor WebKit antiguo; la plantilla de constancia debe usar CSS simple.
- **Texto libre en entidad/nivel educativo**: estadísticas agrupadas por valores
  normalizados; considerar catálogo/autocompletado más adelante.
- **QR estático**: mitigado por la ventana y la validación en servidor; considerar QR
  rotativo como mejora.
- **Sin Docker**: la verificación MySQL ↔ MariaDB depende de un MariaDB accesible antes
  del despliegue.
