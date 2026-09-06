# Tarelli

Aplicación web de gestión personal de tareas. React (frontend) + Node.js/Express
en Modular Monolith (backend) + PostgreSQL, contenerizada con Docker y pensada
para desplegarse en AWS (ECS + Fargate, RDS, Secrets Manager, WAF).

No existen roles ni administradores: cada usuario autenticado solo puede ver y
modificar sus propios recursos (ownership estricto verificado en cada consulta).

## Funcionalidades

**Del alcance del reto**

- Registro, login, logout y recuperación silenciosa de sesión al recargar.
- CRUD completo de tareas, con prioridad, fecha de vencimiento, categoría
  opcional y etiquetas.
- CRUD de categorías; creación y listado de etiquetas.
- Completar y descompletar tareas de forma idempotente, con actualización
  optimista en la interfaz.
- Filtros por estado, prioridad, categoría y etiquetas (semántica **AND**),
  búsqueda de texto completo (PostgreSQL FTS), ordenamiento y paginación.
- Historial de actividad por tarea (`activity_logs`), ver la nota más abajo.
- 10 consultas SQL de inteligencia de negocio.

**Extras añadidos por encima del reto** (la especificación los listaba como
fuera de alcance; se implementaron igualmente, **solo en el frontend y sin
tocar la API**)

- **Tema claro / oscuro / sistema**, con la preferencia persistida y sin
  destello al recargar.
- **Dashboard de estadísticas** (`/estadisticas`): indicadores, tasa de
  finalización, distribución de pendientes por prioridad y por categoría, y
  tendencia de tareas completadas por semana.
- **Exportación a CSV y JSON** de las tareas que cumplen los filtros activos.

## Stack

| Área | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router 7 |
| UI | Componentes propios (sin librería de componentes), `lucide-react`, `motion`, fuente Inter self-hosted |
| Gráficas | SVG escrito a mano, sin librería de charts |
| Backend | Node.js + Express + TypeScript (Modular Monolith) |
| Base de datos | PostgreSQL 16 (Docker en desarrollo, Amazon RDS en producción) |
| Acceso a datos | `pg` (node-postgres) + SQL parametrizado a mano — sin ORM |
| Autenticación | Argon2id + JWT de acceso (en memoria) + refresh token rotable (cookie HttpOnly) |
| Tests backend | Jest + Supertest, contra una base de datos PostgreSQL real |
| Contenedores | Docker / Docker Compose |

## Estructura del repositorio

```text
.
├── frontend/                 React + Vite + Tailwind (SPA)
│   └── src/
│       ├── api/               cliente HTTP centralizado + token en memoria
│       ├── components/        UI de la aplicación
│       │   ├── ui/            primitivas (Button, Modal, Popover, Toast…)
│       │   └── estadisticas/  tarjetas y gráficas del dashboard
│       ├── context/           AuthContext, ThemeContext
│       ├── hooks/             tareas, categorías, etiquetas, paginado completo
│       ├── pages/             Login, Registro, Tareas, Estadísticas
│       └── utils/             fechas, exportación, colores de categoría
├── backend/                  Express modular monolith (TypeScript)
│   ├── src/modules/           auth, tareas, categorias, etiquetas, usuarios
│   ├── src/shared/            db, middleware, errores, validación, logging
│   └── tests/                 unit, integration, api
├── database/
│   ├── migrations/            SQL versionado (0001..0009)
│   ├── seeds/                 datos de desarrollo/pruebas
│   └── queries/               10 consultas SQL de analítica (BI)
├── docs/
│   └── openapi.yaml           especificación completa de la API
├── CLAUDE.md                 contexto del proyecto para asistentes de código
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

Scripts del frontend: `npm run dev`, `npm run build` (type-check + build de
producción), `npm run preview`, `npm run lint`.

## Tests

```bash
cd backend
npm install
npm test
```

La suite crea/actualiza automáticamente el esquema en la base de datos de
pruebas (por defecto `postgres://tarelli_app:devpass@localhost:5432/tarelli_test`,
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

54 tests en 8 suites. El frontend no tiene suite automatizada: se verificó
manualmente contra los criterios de aceptación de cada entrega.

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

Son consultas **entre usuarios**, pensadas para ejecutarse a mano. No hay que
confundirlas con el dashboard de la aplicación, que es personal y del usuario
autenticado.

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

**La lista de rutas está cerrada** y así se mantuvo: el dashboard y la
exportación no añadieron endpoints. Ambos se resuelven en el cliente paginando
`GET /api/tareas` (100 resultados por página, con tope de 10 páginas y aviso
explícito en la interfaz cuando el resultado queda truncado). Las vistas "Hoy"
y "Próximas" tampoco son endpoints nuevos: usan los parámetros de fecha que la
API ya aceptaba.

### Nota sobre `activity_logs`

La tabla `activity_logs` (historial de actividad de una tarea) se implementa
y se llena tal como describe la especificación (`TASK_CREATED`,
`TASK_UPDATED` con los campos realmente modificados, `TASK_COMPLETED`,
`TASK_UNCOMPLETED`; se elimina en cascada junto con la tarea). No se expone
como endpoint HTTP porque la lista de rutas del reto es cerrada ("se
mantienen las rutas originales... y se agregan únicamente `/api/auth/refresh`
y `/api/auth/logout`"); el historial queda disponible para consultas internas
y está cubierto por los tests de integración (`backend/tests/integration`).

## Interfaz

Diseño propio, sin librería de componentes: superficies translúcidas sobre un
fondo decorativo en CSS, rejilla de tarjetas y una paleta con un único color de
acento.

- **El fondo de cada tarjeta codifica la prioridad** — alta en rosa, media en
  ámbar, baja sin tinte — y una tarea completada pierde el tinte y pasa a gris.
  El color nunca es el único canal: las prioridades alta y media llevan además
  su etiqueta de texto, y "vencida" lleva icono y texto para lectores de
  pantalla.
- **Tema claro, oscuro o el del sistema**, seleccionable desde la barra
  lateral. Con "sistema", cambiar el tema del SO se refleja al instante. La
  preferencia es el único dato que la aplicación guarda en `localStorage`.
- **Vistas por fecha** (Tareas, Hoy, Próximas, Completadas) construidas con los
  filtros que la API ya ofrecía; "Hoy" incluye las tareas vencidas, que es lo
  que se espera ver ahí.
- **Gráficas del dashboard dibujadas en SVG a mano**, con paleta validada
  contra contraste y daltonismo en ambos temas, leyenda y etiquetas directas, y
  una vista de tabla alternativa en cada gráfica.
- **Exportación CSV con BOM UTF-8** (para que Excel no destroce los acentos) y
  con escape de fórmulas, de modo que un título como `=1+1` no se ejecute al
  abrir el archivo.

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

Objetivo de producción: contenedores de frontend y backend en **Amazon ECS +
Fargate** (sin Kubernetes, para no sobrearquitecturar), **Amazon RDS
PostgreSQL**, **AWS Secrets Manager** para credenciales/secretos y **AWS WAF**
+ HTTPS obligatorio en el perímetro. El backend es stateless respecto al access
token (JWT autocontenido), lo que permite múltiples réplicas detrás de un load
balancer sin sesiones pegajosas.

Se eligió un **Modular Monolith** en lugar de microservicios: mantiene las
transacciones simples, reduce infraestructura y conserva la separación por
dominios dentro del propio código, de modo que extraer un módulo más adelante
sigue siendo viable.

La observabilidad avanzada (tracing, dashboards, alertas, plan de recuperación
ante desastres) queda como recomendación futura, fuera del alcance de esta
primera versión: la arquitectura conserva las interfaces y la separación
necesarias para incorporarla sin tocar el dominio de negocio.

## Alcance: reto vs. extras

**Fuera de alcance, según la especificación del reto**: roles/admin, drag &
drop, atajos de teclado, WebSockets, operaciones masivas, microservicios,
Elasticsearch/OpenSearch, data warehouse, notificaciones, app móvil nativa y
observabilidad avanzada.

**Implementado por encima del reto**: tema claro/oscuro, dashboard de
estadísticas y exportación CSV/JSON. La especificación los listaba como fuera
de alcance; se añadieron de forma deliberada como extras, **sin tocar el
backend, sin abrir endpoints nuevos y sin romper ninguna de las restricciones
del reto**.
