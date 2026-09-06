# CLAUDE.md

Contexto del proyecto para Claude Code. Léelo antes de tocar código.

## Qué es Tarelli

Aplicación web de **gestión personal de tareas**: React (SPA) + Node/Express
(Modular Monolith) + PostgreSQL, contenerizada con Docker y pensada para AWS
(ECS + Fargate, RDS, Secrets Manager, WAF).

**No hay roles ni administradores.** Todo usuario autenticado solo puede ver y
modificar sus propios recursos: la autorización es **ownership puro**,
verificada en cada consulta contra el `usuario_id` del token.

El repositorio implementa dos documentos de especificación que están en `docs/`
y son la **fuente de verdad**: `reto-tecnico-fullstack-arquitectura.md` y
`reto-tecnico-fullstack-especificacion-implementacion.md`. Si algo en el código
contradice esos documentos, gana el documento.

Idioma: **todo en español** — UI, nombres de tablas y columnas, mensajes de
error, comentarios y mensajes de commit. No traducir al inglés.

## Comandos

```bash
# --- Stack completo (recomendado) ---
cp .env.example .env          # y reemplazar los secretos change_me_*
docker compose up --build      # frontend :5173, API :4000, postgres :5432
                               # el entrypoint del backend aplica migraciones solo

# --- Backend ---
cd backend
npm install
npm run dev                    # tsx watch, http://localhost:4000
npm run build                  # tsc -> dist/
npm test                       # Jest + Supertest (requiere PostgreSQL, ver abajo)

# --- Frontend ---
cd frontend
npm install
npm run dev                    # Vite, http://localhost:5173
npm run build                  # tsc -b && vite build  <- debe pasar limpio
npm run lint                   # oxlint

# --- Base de datos ---
cd database
npm install
DATABASE_URL=postgres://tarelli_app:devpass@localhost:5432/tarelli node migrate.js
DATABASE_URL=... node seeds/seed.js          # ~850 tareas, 12 usuarios demo
DATABASE_URL=... node run-analytics.js        # ejecuta las 10 queries de BI
```

Usuarios sembrados: `usuarioN@tarelli.dev` / `Password123!` (N = 1..12).

## Estructura

```text
backend/src/
├── modules/          auth, usuarios, tareas, categorias, etiquetas
│   └── <modulo>/     routes → controller → service → repository (+ validation)
├── shared/           config, database, errors, middleware, validation, logging, utils
├── app.ts            factory de la app Express (usada por server y por los tests)
└── server.ts         arranque HTTP + apagado ordenado

backend/tests/        unit/ (pura lógica), integration/ (transacciones), api/ (supertest)

database/
├── migrations/       SQL versionado 0001..0009 (runner propio en migrate.js)
├── seeds/seed.js     datos deterministas (RNG con semilla) repartidos en ~13 meses
└── queries/          10 scripts SQL de analítica, cada uno autodocumentado

frontend/src/
├── api/              cliente HTTP centralizado + tokenStore (token en memoria)
├── context/          AuthContext
├── hooks/            useTareas, useCategorias, useEtiquetas, useDebouncedValue
├── components/       UI
├── pages/            LoginPage, RegisterPage, TasksPage
└── types/            tipos compartidos del dominio

docs/                 openapi.yaml, frontend-redesign.md, los 2 docs de especificación
```

**Flujo de una petición en el backend:** `routes` (auth + validación Zod) →
`controller` (HTTP, sin lógica) → `service` (reglas de negocio, transacciones,
ownership) → `repository` (SQL parametrizado). No saltarse capas: un controller
nunca consulta la base directamente.

## Modelo de datos

```text
usuarios ──┬── tareas ──┬── tarea_etiquetas ── etiquetas
           │             └── activity_logs
           ├── categorias
           └── refresh_tokens
```

- **PKs UUID** (`gen_random_uuid()`), timestamps `TIMESTAMPTZ` en UTC.
- `usuarios`: **soft delete** (`eliminado_en`); email único entre activos.
- `tareas`: **hard delete**. `prioridad` ∈ `baja|media|alta` (CHECK).
  `fecha_vencimiento` es `DATE` (sin timezone). Constraint de coherencia:
  `completada = true` ⟺ `completado_en IS NOT NULL`.
- `categorias`: `UNIQUE(usuario_id, nombre)`. Al borrarla, sus tareas quedan con
  `categoria_id = NULL` (`ON DELETE SET NULL`) — **no se borran las tareas**.
- `etiquetas`: privadas por usuario, `UNIQUE(usuario_id, nombre)`. Solo se
  asocian a tareas del mismo usuario (se valida en la capa de aplicación).
- `activity_logs`: historial funcional de la tarea (`TASK_CREATED`,
  `TASK_UPDATED` con los campos realmente modificados en JSONB,
  `TASK_COMPLETED`, `TASK_UNCOMPLETED`). Cae en cascada con la tarea.
- Búsqueda: columna generada `busqueda_tsv` (`to_tsvector('spanish', ...)`) con
  índice GIN. No usar `ILIKE` para buscar.

## API

**La lista de rutas está cerrada.** La especificación permite las 14 rutas del
reto más `/api/auth/refresh` y `/api/auth/logout`, y nada más. No inventar
endpoints (ni `GET /api/tareas/:id`, ni uno para el historial, ni `/v1`).

```text
POST   /api/auth/registro        POST   /api/auth/refresh
POST   /api/auth/login           POST   /api/auth/logout
GET    /api/auth/perfil

GET    /api/tareas               GET    /api/categorias
POST   /api/tareas               POST   /api/categorias
PUT    /api/tareas/:id           PUT    /api/categorias/:id
DELETE /api/tareas/:id           DELETE /api/categorias/:id
PATCH  /api/tareas/:id/completar

GET    /api/etiquetas            POST   /api/etiquetas
```

Formato de respuesta: `{"data": ..., "meta": ...}`.
Formato de error: `{"error": {"code", "message", "details"}}` — el frontend
enruta por `error.code`, no por el texto del mensaje.

Códigos usados: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.
Las validaciones fallan con **422 / `VALIDATION_ERROR`**; los recursos ajenos
devuelven **404** (no 403) para no filtrar su existencia.

`GET /api/tareas` acepta: `completada`, `categoria`, `prioridad`,
`fecha_vencimiento`, `fecha_vencimiento_desde`, `fecha_vencimiento_hasta`,
`busqueda`, `etiquetas` (IDs separados por coma, semántica **AND**), `ordenar`,
`direccion`, `page`, `limit` (máx. 100, por defecto 20).

Detalle completo con request/response/errores: `docs/openapi.yaml`.

## Seguridad e invariantes (no romper)

1. **Contraseñas con Argon2id.** Nunca almacenar ni loguear la contraseña.
2. **Access token JWT de corta duración, solo en memoria del frontend.** Jamás
   `localStorage`, `sessionStorage` ni cookie legible. Payload mínimo:
   `sub`, `iat`, `exp`.
3. **Refresh token opaco** con formato `<uuid>.<secreto>`: en la base solo vive
   `HMAC-SHA256(secreto)`. Cookie `HttpOnly`, `Secure` en producción,
   `SameSite=Strict`, `path=/api/auth`.
4. **Rotación + detección de reutilización**: cada refresh revoca el token
   anterior y crea uno nuevo (en una sola transacción, enlazados por
   `reemplazado_por`). Si llega un refresh token **ya revocado**, se asume robo
   y se revoca **toda la sesión del usuario**.
5. **Ownership en todas partes**: cada consulta y mutación filtra por el
   `usuario_id` del token. **Nunca confiar en un `usuario_id` del cliente.**
6. **SQL siempre parametrizado.** El ordenamiento dinámico pasa por la whitelist
   de `shared/utils/sort.ts`; jamás interpolar `ordenar`/`direccion` en el SQL.
7. **Transacciones** (`withTransaction`) en toda operación multi-tabla: crear y
   actualizar tarea (tarea + etiquetas + log), borrar tarea, rotar refresh token.
8. **Logs sin secretos**: Pino redacta `authorization`, `cookie`, passwords,
   hashes y tokens. Los errores técnicos van al log; al cliente solo mensajes
   genéricos.
9. **Secretos fuera de Git.** Todo va por variables de entorno; `.env.example`
   documenta las necesarias.

## Frontend

- **React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + react-router-dom 7.**
- `AuthContext` mantiene la sesión; al montar la app intenta un **refresh
  silencioso** con la cookie para recuperar sesión tras recargar.
- `api/client.ts` es el único punto de salida HTTP: adjunta el `Authorization`,
  manda `credentials: 'include'`, añade `X-CSRF-Token` en `refresh`/`logout` y
  ante un 401 dispara **un único refresh concurrente** (`refreshPromise`
  compartida) y reintenta la petición una vez. Los componentes **no** llaman a
  `fetch` directamente.
- Los hooks (`useTareas`, etc.) encapsulan estado + llamadas; `completar` hace
  **update optimista con rollback** si el servidor falla.
- Rediseño visual: la especificación completa (tokens, primitivas, pantalla por
  pantalla, criterios de aceptación) está en **`docs/frontend-redesign.md`**.
  Si trabajas en la capa visual, ese documento manda.
- Funcionalidades añadidas sobre el reto (tema claro/oscuro, dashboard de
  estadísticas y exportación CSV/JSON) están especificadas en
  **`docs/frontend-features.md`**, que presupone el rediseño ya aplicado.

Jerarquía si dos documentos se contradicen: `CLAUDE.md` →
`docs/frontend-features.md` → `docs/frontend-redesign.md`.

## Trampas conocidas (leer antes de depurar)

- **Tailwind v4 no usa `tailwind.config.js`.** El tema se define con `@theme`
  dentro de `src/index.css`. Crear un config file no hace nada.
- **`tsconfig.app.json` del frontend es estricto**: `verbatimModuleSyntax`
  (obliga a `import type`), `noUnusedLocals`, `noUnusedParameters` y
  `erasableSyntaxOnly` (nada de `enum` ni parámetros-propiedad). Un import de
  tipo sin `type` rompe el build.
- **La cookie CSRF necesita `path: '/'`.** El navegador solo expone una cookie a
  `document.cookie` si la ruta del **documento actual** está bajo el `path` de
  la cookie. La SPA vive en `/`, así que con `path=/api/auth` el frontend no
  podía leer el token CSRF y el refresh silencioso devolvía 403. El refresh
  token sí puede quedarse en `/api/auth` porque es `HttpOnly` y solo viaja en
  peticiones HTTP hacia esa ruta.
- **Un access token puede repetirse byte a byte** si se firman dos en el mismo
  segundo (payload mínimo + HMAC determinista). No es un bug; no escribas tests
  que asuman que siempre cambia. Lo que sí rota siempre es el refresh token.
- **El build de Docker del backend tiene como contexto la raíz del repo**
  (necesita `database/` para migraciones y seeds): `docker build -f
  backend/Dockerfile .`. Por eso **el único `.dockerignore` que Docker lee es el
  de la raíz** — uno dentro de `backend/` o `frontend/` se ignora, y sin la
  regla `**/node_modules` los `node_modules` del host se cuelan en la imagen y
  pisan los binarios nativos de `argon2` compilados para Alpine.
- **Los tests necesitan PostgreSQL de verdad** (no hay mocks de la base). Usan
  `tarelli_test` (configurable con `TEST_DATABASE_URL`); un `globalSetup` de
  Jest aplica las migraciones y cada test trunca las tablas. Corren en serie
  (`--runInBand`).
- **`verifyOriginForMutations` solo valida cuando llega cabecera `Origin`**, para
  no romper curl, health checks ni los tests. Si añades un cliente de navegador
  con otro origen, agrégalo a `CORS_ALLOWED_ORIGINS`.
- **Migraciones**: añadir un archivo nuevo con el siguiente número
  (`0010_*.sql`). El runner las aplica en orden alfabético, una transacción por
  archivo, y registra lo aplicado en `schema_migrations`. Nunca editar una
  migración ya aplicada.

## Tests

`cd backend && npm test` — 54 tests en 8 suites. Cubren autenticación,
ownership y acceso cruzado entre usuarios, rotación y reutilización de refresh
tokens, validaciones, CRUD, filtro AND de etiquetas, ordenamiento inválido,
paginación, completar/descompletar idempotente, borrado de categoría
(`SET NULL`), borrado de tarea con limpieza en cascada, atomicidad
transaccional y búsqueda FTS.

Al añadir funcionalidad, añade el test en la capa que corresponda: lógica pura
en `tests/unit`, comportamiento transaccional en `tests/integration`, contrato
HTTP en `tests/api`. Un cambio en reglas de ownership **siempre** necesita un
test con dos usuarios.

## Convenciones

- Commits pequeños con prefijo de tipo y ámbito, en español:
  `feat(tareas): ...`, `fix(auth): ...`, `test(tareas): ...`, `docs(api): ...`.
- Nombres del dominio en español (`tareas`, `etiquetas`, `completada`); no
  mezclar con inglés en columnas, campos de la API ni tipos del dominio.
- Comentarios: explican **por qué**, no qué. Los que documentan una decisión de
  seguridad o una regla de la especificación no se borran al refactorizar.
- Errores: usar los helpers de `AppError` (`AppError.validation`,
  `AppError.notFound`, ...) en vez de lanzar `Error` genéricos o construir
  respuestas de error a mano.

## Alcance: reto vs. extras

**Fuera de alcance (definido por la especificación del reto).** No implementarlos
aunque parezcan mejoras obvias: roles/admin, drag & drop, atajos de teclado,
WebSockets, operaciones masivas, microservicios, Elasticsearch, data warehouse,
notificaciones, app móvil nativa y observabilidad avanzada (esta última queda
documentada como recomendación futura).

**Extras añadidos deliberadamente por encima del reto.** La especificación los
listaba como fuera de alcance; se implementan igualmente, **solo en el frontend
y sin tocar la API**, y así deben presentarse en la entrega — como extras, no
como parte del reto:

- Toggle de tema claro / oscuro / sistema.
- Dashboard de estadísticas personales (calculado en el cliente).
- Exportación de tareas a CSV / JSON (generada en el cliente).

Detalle completo en `docs/frontend-features.md`. **Lo que no cambia**: la lista
de rutas sigue cerrada, el backend no se toca y estos extras no añaden
dependencias nuevas al frontend.
