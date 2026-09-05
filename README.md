# Tarelli

Aplicación web de gestión personal de tareas. React (frontend) + Node.js/Express
en Modular Monolith (backend) + PostgreSQL, contenerizada con Docker y pensada
para desplegarse en AWS (ECS + Fargate, RDS, Secrets Manager, WAF).


## Stack

| Área | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + React Router |
| Backend | Node.js + Express + TypeScript (Modular Monolith) |
| Base de datos | PostgreSQL 16 (Docker en desarrollo, Amazon RDS en producción) |
| Acceso a datos | `pg` (node-postgres) + SQL parametrizado a mano — sin ORM |
| Autenticación | Argon2id + JWT de acceso (memoria) + refresh token rotable (cookie HttpOnly) |
| Tests backend | Jest + Supertest, contra una base de datos PostgreSQL real |
| Contenedores | Docker / Docker Compose |

## Estructura del repositorio

```text
.
├── frontend/           React + Vite + Tailwind (SPA)
├── backend/             Express modular monolith (TypeScript)
│   ├── src/modules/     auth, tareas, categorias, etiquetas, usuarios
│   ├── src/shared/      db, middleware, errores, validación, logging
│   └── tests/           unit, integration, api
├── database/
│   ├── migrations/      SQL versionado (0001..0009)
│   ├── seeds/            datos de desarrollo/pruebas
│   └── queries/          10 consultas SQL de analítica (BI)
├── docs/
│   ├── openapi.yaml                                  especificación completa de la API
│   ├── reto-tecnico-fullstack-arquitectura.md          documento de arquitectura (fuente)
│   └── reto-tecnico-fullstack-especificacion-implementacion.md  especificación (fuente)
├── docker-compose.yml
└── .env.example
```

## Requisitos

- Docker y Docker Compose (recomendado, no requiere instalar Node/Postgres localmente).
- Alternativamente, para desarrollo sin Docker: Node.js 22+, PostgreSQL 16.

## Puesta en marcha con Docker Compose (recomendado)

```bash
cp .env.example .env
# Editar .env y reemplazar los secretos "change_me_dev_only_*" por valores propios,
# incluso en desarrollo.

docker compose up --build
```

Esto levanta tres contenedores:

- `postgres` — PostgreSQL 16 con healthcheck (`pg_isready`).
- `backend` — al iniciar, el entrypoint aplica automáticamente las migraciones
  pendientes (`database/migrate.js`). Si se define `RUN_SEED=true` en `.env`,
  también siembra datos de ejemplo.
- `frontend` — build estático de producción servido por Nginx.

Servicios expuestos:

- Frontend: http://localhost:5173
- API backend: http://localhost:4000/api (health check en `/health`)
- PostgreSQL: `localhost:5432`

Para poblar la base con datos de ejemplo (usuarios, tareas, categorías,
etiquetas y actividad distribuidos en los últimos ~13 meses, pensados para que
las 10 consultas analíticas den resultados no triviales):

```bash
# Opción 1: definir RUN_SEED=true en .env antes de `docker compose up`
# Opción 2: ejecutarlo manualmente contra un stack ya corriendo
docker compose exec backend node /app/database/seeds/seed.js
```

Credenciales de los usuarios sembrados: `usuarioN@tarelli.dev` / `Password123!`
(N = 1..12).

## Desarrollo local sin Docker

```bash
# 1. Base de datos
createdb tarelli
createuser tarelli_app --pwprompt   # o usar tu propio rol con permisos

# 2. Variables de entorno
cp .env.example backend/.env
# Editar backend/.env: DATABASE_URL=postgres://usuario:pass@localhost:5432/tarelli

# 3. Migraciones + seed
cd database && npm install
DATABASE_URL=postgres://usuario:pass@localhost:5432/tarelli node migrate.js
DATABASE_URL=postgres://usuario:pass@localhost:5432/tarelli node seeds/seed.js

# 4. Backend
cd ../backend && npm install
npm run dev            # http://localhost:4000

# 5. Frontend (otra terminal)
cd ../frontend && npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:4000/api
npm run dev              # http://localhost:5173
```

## Tests

```bash
cd backend
npm install
npm test
```

La suite (`npm test`) crea/actualiza automáticamente el esquema en la base de
datos de pruebas (por defecto `postgres://tarelli_app:devpass@localhost:5432/tarelli_test`,
configurable con `TEST_DATABASE_URL`) mediante un `globalSetup` de Jest, y
limpia las tablas entre cada test. Cubre:

- Autenticación: registro, login, credenciales inválidas, validaciones.
- Ownership y acceso cruzado entre dos usuarios (tareas, categorías, etiquetas).
- Rotación de refresh tokens y detección de reutilización (robo de sesión).
- CRUD completo de tareas, categorías y etiquetas.
- Filtro AND de múltiples etiquetas.
- Rechazo de columnas/direcciones de ordenamiento fuera de la whitelist.
- Paginación (`page`/`limit`, `meta.total`/`totalPages`).
- Completar/descompletar tareas de forma idempotente.
- Eliminación de categoría (las tareas quedan con `categoria_id = null`).
- Eliminación de tarea (hard delete) y limpieza en cascada de `activity_logs`
  y `tarea_etiquetas`.
- Atomicidad de operaciones transaccionales (creación de tarea, rotación de
  refresh token, rollback ante fallos).
- Búsqueda Full-Text Search.

54 tests, 8 suites, todos en verde en el estado actual del repositorio.

## Consultas de analítica (Business Intelligence)

`database/queries/` contiene 10 scripts SQL independientes, cada uno
documentado en su propio encabezado con: definición, ventana temporal,
denominador, columnas de salida y un ejemplo de resultado esperado.

```bash
cd database
DATABASE_URL=postgres://tarelli_app:devpass@localhost:5432/tarelli node run-analytics.js
# o para correr solo una:
DATABASE_URL=... node run-analytics.js 05_tareas_vencidas
```

Las 10 consultas:

1. Promedio de tareas por usuario: últimos 30 días vs 30 anteriores.
2. Tasa diaria de finalización (últimos 90 días) por prioridad.
3. Tasa de finalización por categoría y tiempo medio de finalización.
4. Horas y días pico de creación y finalización de tareas.
5. Tareas vencidas por usuario/categoría y promedio de días de atraso.
6. Uso de etiquetas y tasa de finalización.
7. Retención de usuarios a cuatro semanas (cohortes semanales).
8. Distribución de prioridades entre usuarios activos en los últimos 7 días.
9. Creación y finalización mensual del último año.
10. Top 10% de usuarios por tasa de finalización y promedio de tareas simultáneas.

## API

Especificación completa (request/response/validaciones/errores) en
[`docs/openapi.yaml`](docs/openapi.yaml) — puede visualizarse pegando el
contenido en https://editor.swagger.io o sirviéndolo con cualquier visor de
OpenAPI.

Rutas del reto (sin prefijo `/v1`, tal como especifica el documento fuente):

```text
POST   /api/auth/registro
POST   /api/auth/login
GET    /api/auth/perfil
POST   /api/auth/refresh      (agregada para el modelo de sesión)
POST   /api/auth/logout       (agregada para el modelo de sesión)

GET    /api/tareas
POST   /api/tareas
PUT    /api/tareas/:id
DELETE /api/tareas/:id
PATCH  /api/tareas/:id/completar

GET    /api/categorias
POST   /api/categorias
PUT    /api/categorias/:id
DELETE /api/categorias/:id

GET    /api/etiquetas
POST   /api/etiquetas
```

Formato de respuesta exitosa: `{"data": ..., "meta": ...}`.
Formato de error: `{"error": {"code", "message", "details"}}`.

### Nota sobre `activity_logs`

La tabla `activity_logs` (historial de actividad de una tarea) se implementa
y se llena tal como describe la especificación (`TASK_CREATED`,
`TASK_UPDATED` con los campos realmente modificados, `TASK_COMPLETED`,
`TASK_UNCOMPLETED`; se elimina en cascada junto con la tarea). No se expone
como endpoint HTTP porque la lista de rutas del reto es cerrada ("se
mantienen las rutas originales... y se agregan únicamente `/api/auth/refresh`
y `/api/auth/logout`"); el historial queda disponible para consultas internas
y está cubierto por los tests de integración (`backend/tests/integration`).

## Seguridad

- **Contraseñas**: Argon2id.
- **Sesión**: access token JWT de corta duración (solo en memoria del
  frontend, nunca en `localStorage`/`sessionStorage`) + refresh token opaco
  (`id.secreto`), persistido como hash (HMAC-SHA256), en cookie
  `HttpOnly; Secure (en producción); SameSite=Strict`, con **rotación** en
  cada uso y **detección de reutilización**: si se reutiliza un refresh token
  ya rotado, se revoca toda la sesión del usuario.
- **CSRF**: patrón de doble envío (`tarelli_csrf`, cookie no-HttpOnly +
  header `X-CSRF-Token`) para los dos únicos endpoints que se autentican
  solo por cookie (`/auth/refresh`, `/auth/logout`); el resto de la API usa
  `Authorization: Bearer`, inmune a CSRF por diseño. Además, validación de
  `Origin` contra la allowlist de CORS en toda solicitud que muta estado.
- **CORS**: allowlist estricta vía `CORS_ALLOWED_ORIGINS`.
- **Cabeceras de seguridad**: Helmet (CSP, HSTS, X-Content-Type-Options,
  Referrer-Policy, frameguard) + `Permissions-Policy` manual.
- **Rate limiting**: límite general por IP y límite más estricto en
  endpoints de autenticación (fuerza bruta / credential stuffing). En
  producción se complementa con AWS WAF.
- **Ownership**: toda consulta/mutación de tareas, categorías y etiquetas
  filtra por `usuario_id` del token autenticado; nunca se confía en un
  `usuario_id` enviado por el cliente. No hay roles ni PostgreSQL RLS — la
  autorización vive en la capa de aplicación.
- **SQL**: 100% parametrizado; el ordenamiento dinámico (`ordenar`,
  `direccion`) se resuelve contra una whitelist fija, nunca se interpola
  directamente el valor del cliente.
- **Transacciones**: creación/actualización de tareas (tarea + etiquetas +
  activity log), eliminación de tarea (tarea + relaciones + logs) y rotación
  de refresh tokens son atómicas.
- **Logging**: Pino con redacción de campos sensibles (passwords, hashes,
  JWT, refresh tokens, cookies, `Authorization`). Los errores técnicos nunca
  se exponen al cliente; solo se registran en el log del servidor.
- **Secretos**: nunca versionados; `.env.example` documenta las variables
  necesarias. En producción, AWS Secrets Manager.

## Arquitectura y despliegue

Ver `docs/reto-tecnico-fullstack-arquitectura.md` para el detalle completo
(diagramas de componentes, seguridad, autenticación, rotación de refresh,
autorización, modelo de datos, escalabilidad).

Resumen del objetivo de producción: contenedores de frontend y backend en
**Amazon ECS + Fargate** (sin Kubernetes, para no sobrearquitecturar),
**Amazon RDS PostgreSQL**, **AWS Secrets Manager** para credenciales/secretos
y **AWS WAF** + HTTPS obligatorio en el perímetro. El backend es stateless
respecto al access token (JWT autocontenido), lo que permite múltiples
réplicas detrás de un load balancer sin sesiones pegajosas. La observabilidad
avanzada (tracing, dashboards, alertas, DR) queda como recomendación futura,
fuera del alcance de esta primera versión, según la especificación.

## Fuera de alcance (explícito en la especificación)

Roles/admin, dashboard visual, drag & drop, modo oscuro, exportación
CSV/JSON, atajos de teclado, WebSockets, operaciones masivas, microservicios,
Elasticsearch/OpenSearch, data warehouse, notificaciones, app móvil nativa,
observabilidad avanzada (queda documentada como recomendación futura).
