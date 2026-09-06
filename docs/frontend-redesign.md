# Rediseño visual del frontend — Tarelli

> **Documento de trabajo para Claude Code.** Sustituye por completo a la versión
> anterior de este archivo (que describía una estética plana tipo Linear). Si
> recuerdas indicaciones previas sobre "nada de glassmorphism" o "un solo color
> de acento", **quedan anuladas**: manda este documento. Léelo entero antes de
> escribir código.

**Objetivo:** llevar la interfaz actual a un acabado **moderno, translúcido y
cálido**, inspirado en aplicaciones nativas de macOS: fondo decorativo suave,
superficies de vidrio esmerilado, rejilla de tarjetas y **color de tarjeta según
la prioridad de la tarea**.

---

## 1. Contexto del producto

Tarelli es un gestor **personal** de tareas. La UI está **en español** y así debe
permanecer. Lo que aparece en pantalla:

- **Tarea**: `titulo`, `descripcion`, `prioridad` (`baja` | `media` | `alta`),
  `completada`, `fecha_vencimiento` (fecha sin hora, puede ser `null`),
  `categoria_id` / `categoria_nombre` (opcional), `etiquetas[]`, `creado_en`.
- **Categoría**: propia del usuario, nombre único. Al borrarla, sus tareas
  quedan sin categoría (no se borran).
- **Etiqueta**: propia del usuario. El filtro por varias etiquetas es **AND**.
- **Sesión**: registro / login / logout, access token JWT en memoria y refresh
  silencioso al cargar la app mediante cookie HttpOnly.

Contexto completo del repositorio, comandos e invariantes: `CLAUDE.md`.
Contrato de la API: `docs/openapi.yaml`.

---

## 2. Referencia visual

El diseño se basa en un mockup de aplicación macOS. **Qué tomamos y qué no:**

| Del mockup | Decisión |
|---|---|
| Fondo con degradado suave y ventana translúcida | **Sí.** Fondo decorativo propio en CSS + superficies de vidrio (§6.1, §8.1). |
| Barra lateral con vistas y grupo de gestión | **Sí**, adaptada (§8.3). |
| Rejilla de tarjetas en lugar de lista | **Sí** (§8.6). |
| Tarjetas con tinte de color | **Sí, pero el tinte lo determina la prioridad** (§6.3). |
| Pestañas Todas / Pendientes / Completadas | **Sí** (§8.5). |
| Contadores en la barra lateral (Hoy 5, Próximas 4…) | **No.** Requerirían peticiones extra por cada vista; el único contador que se muestra es el total de la vista actual, que ya viene en `meta.total`. |
| Ítems "Actividad" y "Ajustes" | **No.** No existen en el backend y la lista de rutas está cerrada. No se pinta UI inerte. |
| Icono decorativo distinto por tarjeta (estrella, cohete, escudo…) | **No.** No hay campo de icono en el modelo; ese espacio se usa para el indicador de prioridad, que sí significa algo (§8.6). |
| Chips de categoría de colores variados | **Sí**, con color derivado de forma determinista del nombre de la categoría (§6.4). |
| Cromo de ventana de macOS (semáforo, esquinas) | **No.** Esto es una web, no una app nativa. |

---

## 3. Alcance

### Sí entra

- Todo lo que vive bajo `frontend/src/`: estilos, layout, componentes,
  jerarquía visual, estados de carga/vacío/error, microinteracciones.
- Reorganizar el layout y crear componentes nuevos puramente visuales.
- **Una excepción controlada en la capa `api/`**: añadir soporte para los
  parámetros `fecha_vencimiento_desde` y `fecha_vencimiento_hasta`, que el
  backend ya acepta pero el cliente todavía no envía (§9). No es un cambio de
  contrato: son parámetros existentes y documentados en `openapi.yaml`.
- Añadir las dependencias listadas en §5, y solo esas.

### No entra

- **Nada fuera de `frontend/`.** No tocar `backend/`, `database/`,
  `docker-compose.yml`, `CLAUDE.md` ni los documentos de especificación.
- Endpoints nuevos, cambios de rutas o del formato `{data, meta}` /
  `{error:{code,message,details}}`.
- Cambiar la estrategia de sesión y seguridad (§4).
- Funcionalidad de producto nueva fuera de lo descrito aquí: modo oscuro con
  selector, drag & drop, exportación, atajos de teclado, operaciones masivas o
  dashboard están **fuera de alcance** por la especificación del reto.

---

## 4. Restricciones duras (invariantes)

Romper cualquiera de estas es un fallo, por muy bonito que quede el resultado.

1. **El access token sigue viviendo solo en memoria** (`src/api/tokenStore.ts`).
   Nunca `localStorage`, `sessionStorage`, cookie legible ni DOM.
2. **`src/api/client.ts` conserva su comportamiento**: `credentials: 'include'`,
   header `X-CSRF-Token` en `refresh`/`logout`, y el **único refresh concurrente**
   ante 401 (`refreshPromise` compartida) con un solo reintento.
3. **Los hooks conservan su API y su comportamiento**: `useTareas`,
   `useCategorias`, `useEtiquetas`, `useDebouncedValue`. En particular el
   **update optimista con rollback** de completar/descompletar. Se puede añadir
   estado *puramente visual* y ampliar el tipo de filtros (§9).
4. **Ningún flujo se pierde**: registro, login, recuperación silenciosa de sesión
   al recargar, logout, CRUD de tareas, CRUD de categorías, crear/listar
   etiquetas, filtros, búsqueda, orden, paginación, completar/descompletar.
5. **Se conservan estos `id` del DOM** (los usan las pruebas end-to-end):
   `#nombre`, `#email`, `#password`, `#task-form-modal`, `#task-form-title`,
   `#tarea-titulo`, `#tarea-descripcion`.
6. **`npm run build` (`tsc -b && vite build`) debe pasar limpio.** Trampas del
   `tsconfig` del frontend:
   - `verbatimModuleSyntax: true` → imports de tipos con `import type`.
   - `noUnusedLocals` / `noUnusedParameters` → nada declarado sin usar.
   - `erasableSyntaxOnly: true` → nada de `enum` ni parámetros-propiedad.
7. **La UI sigue en español**, con la terminología del dominio (tareas,
   categorías, etiquetas, prioridad, vence, completada).
8. No renombrar ni mover las carpetas existentes. Los componentes nuevos van en
   `src/components/ui/`.

---

## 5. Stack y dependencias

Estado actual: **React 19.2**, **react-router-dom 7**, **TypeScript 6**,
**Vite 8**, **Tailwind CSS 4.3** (vía `@tailwindcss/vite`).

> ⚠️ **Tailwind v4**: el tema se define con el bloque `@theme` dentro de
> `src/index.css`. **No crear `tailwind.config.js`** — en v4 no se usa. Los
> tokens de `@theme` generan utilidades automáticamente (`--color-brand` →
> `bg-brand`; `--radius-card` → `rounded-card`; `--shadow-card` → `shadow-card`).

Instalar (y solo esto):

```bash
cd frontend
npm install lucide-react motion @fontsource-variable/inter
```

- **`lucide-react`** — iconografía, `strokeWidth={1.75}`, 16px por defecto.
- **`motion`** — es `framer-motion` renombrado (v12+); imports desde
  `motion/react`. Si acabas instalando `framer-motion`, debe ser `>= 11.11` por
  React 19 y los imports cambian a `from 'framer-motion'`. **Comprueba qué se
  instaló antes de escribir los imports.**
- **`@fontsource-variable/inter`** — fuente self-hosted, sin CDNs externos.
  Se importa una sola vez en `src/main.tsx`.

`zod` figura en `dependencies` sin usarse; puedes quitarlo o dejarlo.

**No** instalar librerías de componentes (MUI, Chakra, Radix, shadcn CLI,
daisyUI). Las primitivas se escriben a mano: es parte de lo que se evalúa.

---

## 6. Sistema de diseño

Reemplaza `src/index.css` por esta base. **Ningún color se escribe suelto en los
componentes**: si falta un token, se añade aquí.

```css
@import 'tailwindcss';

@theme {
  /* ---- Superficies -------------------------------------------------- */
  --color-canvas: #f4f4f8;         /* base bajo el fondo decorativo */
  --color-surface: #ffffff;
  --color-surface-2: #f3f3f7;

  /* ---- Fondo decorativo (manchas del degradado en malla) ------------ */
  --color-mesh-1: #dcdffb;         /* violeta */
  --color-mesh-2: #ffe6d2;         /* ámbar cálido */
  --color-mesh-3: #d6f0e8;         /* verde agua */

  /* ---- Bordes ------------------------------------------------------- */
  --color-line: #e7e7ee;
  --color-line-strong: #d6d6e0;

  /* ---- Texto -------------------------------------------------------- */
  --color-ink: #17171c;
  --color-ink-2: #5c5c68;          /* secundario, cumple AA */
  --color-ink-3: #8e8e9c;          /* SOLO placeholders, iconos y metadatos
                                      no esenciales: no llega a AA en 14px */

  /* ---- Marca -------------------------------------------------------- */
  --color-brand: #5b5bd6;
  --color-brand-hover: #4b4bc4;
  --color-brand-soft: #eeeefc;
  --color-brand-line: #dcdcf7;

  /* ---- Tinte de tarjeta por PRIORIDAD (núcleo del rediseño) --------- */
  --color-tint-alta: #fde9e6;      /* rosa  */
  --color-edge-alta: #f6cdc7;
  --color-tint-media: #fdf1dd;     /* ámbar */
  --color-edge-media: #f2ddb6;
  --color-tint-baja: #ffffff;      /* neutra: la prioridad baja no grita */
  --color-edge-baja: #e7e7ee;
  --color-tint-hecha: #f1f1f5;     /* completada: apagada */
  --color-edge-hecha: #e3e3ea;

  /* ---- Semánticos (badges y estados) -------------------------------- */
  --color-danger: #b42318;
  --color-danger-soft: #fef3f2;
  --color-danger-line: #fecdca;
  --color-warn: #b54708;
  --color-warn-soft: #fffaeb;
  --color-warn-line: #fedf89;
  --color-ok: #067647;
  --color-ok-soft: #ecfdf3;
  --color-ok-line: #abefc6;

  /* ---- Radios ------------------------------------------------------- */
  --radius-field: 10px;
  --radius-card: 16px;
  --radius-modal: 20px;

  /* ---- Sombras (suaves, nunca duras) -------------------------------- */
  --shadow-xs: 0 1px 2px 0 rgb(16 24 40 / 0.04);
  --shadow-card: 0 1px 2px 0 rgb(16 24 40 / 0.04), 0 8px 24px -12px rgb(16 24 40 / 0.10);
  --shadow-card-hover: 0 2px 4px 0 rgb(16 24 40 / 0.05), 0 12px 28px -12px rgb(16 24 40 / 0.16);
  --shadow-chrome: 0 1px 0 0 rgb(16 24 40 / 0.03);
  --shadow-modal: 0 24px 56px -16px rgb(16 24 40 / 0.24);

  /* ---- Tipografía --------------------------------------------------- */
  --font-sans: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* ---- Movimiento --------------------------------------------------- */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}

:root {
  color-scheme: light;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background-color: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Fondo decorativo: tres manchas radiales fijas. Solo CSS, sin imágenes.
   Va en un pseudo-elemento fijo para que no se mueva con el scroll ni
   participe en el layout. */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(60rem 40rem at 8% 4%, var(--color-mesh-1) 0%, transparent 60%),
    radial-gradient(50rem 36rem at 92% 12%, var(--color-mesh-2) 0%, transparent 58%),
    radial-gradient(56rem 40rem at 60% 96%, var(--color-mesh-3) 0%, transparent 60%);
  opacity: 0.75;
}

* {
  box-sizing: border-box;
}

/* Anillo de foco único. Nunca eliminar el outline sin reemplazarlo. */
:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: var(--radius-field);
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.1 Receta de "vidrio"

Dos niveles, y solo estos:

- **Cromo** (barra lateral, barra superior, popover de filtros, overlay del
  modal): `bg-surface/70` + `backdrop-blur-xl` + `border-line/70`. Aquí el
  desenfoque sí aporta, porque hay contenido desplazándose por detrás.
- **Tarjetas**: color de tinte semitransparente + `backdrop-blur-sm` +
  `border` del borde correspondiente + `shadow-card`. El blur es mínimo a
  propósito: detrás solo hay un degradado suave, así que un desenfoque fuerte
  no se notaría y sí costaría rendimiento con 20 tarjetas en pantalla (§13).

Nunca aplicar `backdrop-blur` a elementos que contengan párrafos largos sobre
fondos con mucho contraste: el texto pierde legibilidad.

### 6.2 Escala tipográfica

Base **14px** (densidad de aplicación).

| Uso | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|
| Título de página ("Mis tareas") | 24px / 1.2 | 600 | `-0.02em` |
| Subtítulo de página | 13.5px / 1.4 | 400 | normal |
| Título de modal | 17px / 1.3 | 600 | `-0.01em` |
| Título de tarjeta | 14.5px / 1.4 | 600 | normal |
| Descripción de tarjeta | 13px / 1.45 | 400 | normal |
| Metadatos, chips, badges | 12px / 1.35 | 500 | normal |
| Etiqueta de sección del sidebar | 11px | 600 | `0.06em`, mayúsculas |

Máximo dos pesos por pantalla (400/500 más 600 en títulos). Tracking negativo
solo en ≥ 17px.

### 6.3 Color de tarjeta por prioridad — regla central

| Estado de la tarea | Fondo | Borde | Notas |
|---|---|---|---|
| `prioridad: 'alta'`, pendiente | `bg-tint-alta/72` | `border-edge-alta/80` | Es lo que debe saltar a la vista. |
| `prioridad: 'media'`, pendiente | `bg-tint-media/72` | `border-edge-media/80` | |
| `prioridad: 'baja'`, pendiente | `bg-surface/72` | `border-edge-baja` | Sin tinte: evita el efecto arcoíris con 20 tarjetas. |
| `completada` (cualquier prioridad) | `bg-tint-hecha/70` | `border-edge-hecha` | El tinte de prioridad **desaparece**: una tarea hecha ya no compite por atención. |

El cambio de tinte al completar debe transicionar (`transition-colors`, 180ms),
no saltar de golpe.

> **Accesibilidad:** el color **nunca** es el único canal. Toda tarjeta con
> prioridad alta o media lleva además su badge de texto ("Alta" / "Media") en la
> esquina superior derecha (§8.6). La prioridad baja no lleva badge porque es el
> valor por defecto y su ausencia no oculta información crítica.

### 6.4 Color de los chips de categoría

Las categorías no tienen color en el modelo de datos. Deriva uno **de forma
determinista** a partir del `id` de la categoría, para que sea estable entre
recargas y entre sesiones:

```ts
// src/utils/colorCategoria.ts
const PALETA = ['violeta', 'ambar', 'verde', 'rosa', 'cian', 'indigo'] as const;

export function colorCategoria(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETA[Math.abs(hash) % PALETA.length];
}
```

Define los seis pares fondo/texto como tokens en el `@theme`
(`--color-cat-violeta`, `--color-cat-violeta-ink`, …) con la misma saturación
baja que el resto de la paleta. **No usar el `nombre` como semilla**: renombrar
una categoría le cambiaría el color.

### 6.5 Espaciado y medidas

- Rejilla base de 4px (escala nativa de Tailwind).
- Sidebar: **248px** fija en `≥ lg`.
- Contenido: `max-w-[1400px]`, centrado, `px-6` (`px-4` en móvil).
- Altura de controles: 36px (`h-9`), 32px (`h-8`) en variantes compactas.
- Separación de la rejilla de tarjetas: `gap-4`.

### 6.6 Movimiento

- Duraciones: **120ms** (color/hover), **180ms** (entradas de tarjeta, chips),
  **220ms** (modal, drawer, popover). Nada por encima de 300ms.
- Easing de entrada: `--ease-out-quint`; salidas más cortas (≈140ms).
- Anima **opacidad, transform y color**. Nunca `width`/`height`/`top`/`left`.
- Respeta `prefers-reduced-motion` (cubierto en el CSS base; con `motion`, usa
  además `useReducedMotion()` para animaciones de transform).

---

## 7. Primitivas de UI (crear en `src/components/ui/`)

Componentes pequeños, tipados, sin lógica de negocio. Todos aceptan `className`
y reenvían el resto de props al elemento nativo.

| Archivo | Descripción |
|---|---|
| `Button.tsx` | `variant`: `primary` \| `secondary` \| `ghost` \| `danger`. `size`: `sm` \| `md`. Props `loading` (spinner + `disabled` + `aria-busy`), `icon`, `iconRight`. `secondary` es de vidrio: `bg-surface/70 backdrop-blur border border-line`. |
| `IconButton.tsx` | Botón cuadrado 32×32 (`sm`: 28×28) con un icono. **`aria-label` obligatorio en el tipo.** |
| `Field.tsx` | Envoltorio con `label` (`htmlFor`), `hint` y `error`. Con error: borde `danger-line`, mensaje 12px en `danger`, `aria-invalid` + `aria-describedby`. |
| `Input.tsx` | `h-9`, `rounded-field`, `bg-surface/80`, `placeholder:text-ink-3`, `focus:border-brand`. Slots `icon` (izquierda) y `trailing` (derecha). |
| `Textarea.tsx` | Igual, `min-h-[88px]`, `resize-none`. |
| `Select.tsx` | `<select>` nativo con `appearance-none` y `ChevronDown` posicionado. Nativo = accesible y correcto en móvil; no construir un dropdown a mano. |
| `Checkbox.tsx` | `<input type="checkbox" className="peer sr-only">` + caja visual 20×20 `rounded-[7px]`, marcada con fondo `brand` y `Check` blanco animado (scale 0.6→1, 140ms). Operable con teclado, con `aria-label`. |
| `Badge.tsx` | `tone`: `neutral` \| `brand` \| `danger` \| `warn` \| `ok` \| `cat-*`. Píldora 12px, `px-2 py-0.5`. Soporta `dot`. |
| `SegmentedControl.tsx` | Grupo de 2–4 opciones. Contenedor `bg-surface/60 backdrop-blur rounded-field p-0.5`; segmento activo `bg-surface shadow-xs`, con `layoutId` de `motion` para que el indicador se deslice. Semántica de radios (`role="radiogroup"` + `role="radio"` o botones con `aria-pressed`). |
| `Popover.tsx` | Panel anclado a un disparador, para el menú de filtros. Cierra con Esc, clic fuera y `blur` fuera; devuelve el foco al disparador. En `< md` se renderiza como hoja inferior a ancho completo. |
| `Skeleton.tsx` | Bloque `bg-surface-2` con `animate-pulse`. |
| `Modal.tsx` | Overlay + panel, `AnimatePresence`, Esc, clic en overlay, bloqueo de scroll del body, foco inicial dentro y **retorno del foco** al cerrar. Props: `abierto`, `onCerrar`, `titulo`, `children`, `footer`, `size`. |
| `ConfirmDialog.tsx` | Sobre `Modal`. Sustituye los `window.confirm` de borrar tarea y categoría. Props: `abierto`, `titulo`, `descripcion`, `textoConfirmar`, `tono`, `onConfirmar`, `onCancelar`, `cargando`. |
| `Toast.tsx` + `ToastProvider` | Contexto con `useToast()` → `mostrarToast({ tono, mensaje })`. Pila abajo-derecha (abajo-centro en móvil), autocierre 4s, `role="status"` + `aria-live="polite"`. Sustituye los recuadros rojos inline de `errorAccion`. |
| `LogoMark.tsx` | Cuadrado 32×32 `rounded-[10px]`, fondo `brand`, `Check` blanco. Se usa en auth y en el sidebar. |

`ToastProvider` se monta en `App.tsx` dentro de `ErrorBoundary` y fuera de
`BrowserRouter`.

---

## 8. Rediseño pantalla por pantalla

### 8.1 Estructura general

```text
body::before  → fondo decorativo fijo (mesh)
└── AppShell
    ├── Sidebar        248px, vidrio, sticky, altura completa   (drawer en <lg)
    └── main
        ├── TopBar     sticky, vidrio, título + buscador + acciones
        ├── ControlsRow segmentado + orden + botón Filtros
        ├── TaskGrid    rejilla de TaskCard
        └── Pagination
```

### 8.2 Autenticación — `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`

Extrae el marco común a `components/AuthLayout.tsx`.

- Una sola columna centrada sobre el fondo decorativo (aquí luce más que un
  split). `LogoMark` + "Tarelli" arriba, tarjeta de vidrio debajo:
  `bg-surface/80 backdrop-blur-xl border border-white/60 rounded-modal
  shadow-modal p-8 w-full max-w-[400px]`.
- Campos con `Field` + `Input` e iconos (`Mail`, `Lock`, `User`), más el toggle
  `Eye`/`EyeOff` en contraseña (solo UI, no cambia la validación).
  Conserva los `id` `#nombre`, `#email`, `#password` y los `autoComplete`.
- Errores de campo debajo del campo; error del servidor en bloque
  `danger-soft` con `AlertTriangle` sobre el formulario.
- Botón `primary` a ancho completo, `h-10`, con `loading`.
- Pie con el enlace a la otra pantalla.

### 8.3 Barra lateral — `components/Sidebar.tsx`

`bg-surface/70 backdrop-blur-xl border-r border-line/70`, `sticky top-0
h-screen`, ancho 248px, en tres zonas:

**1. Cabecera** — `LogoMark` + "Tarelli" (15px/600).

**2. Cuerpo** (scrolleable), dos grupos separados por un `<hr>` de 1px
`border-line/70`:

*Grupo "vistas"* — navegación principal. Cada ítem: alto 36px, `rounded-field`,
icono 16px + etiqueta 13.5px. Estado activo: `bg-brand-soft`, texto e icono en
`brand`, y una **barra de 3px `bg-brand` pegada al borde izquierdo** con
`rounded-full` (usa `layoutId` de `motion` para que se deslice entre ítems).
Hover inactivo: `bg-surface-2/70`.

- `Tareas` (`ListChecks`) — sin filtro de fecha
- `Hoy` (`CalendarDays`) — vence hoy **o antes** (incluye vencidas)
- `Próximas` (`Clock`) — vence a partir de mañana
- `Completadas` (`CircleCheck`) — atajo que fija el estado a "Completadas"

Ver §9 para el mapeo exacto a parámetros de la API. **Las cuatro vistas escriben
sobre el mismo objeto de filtro**: no crear un segundo estado paralelo.
`Completadas` en el sidebar y el segmento "Completadas" de §8.5 reflejan
exactamente el mismo valor, así que deben verse activos a la vez.

*Grupo "gestión"* — dos secciones plegables (`Folder` "Categorías" y `Tag`
"Etiquetas"), cerradas por defecto y con `ChevronRight` que rota 90° al abrir:

- **Categorías**: lista de filas de 32px; cada una con un punto del color
  derivado (§6.4), el nombre, y un `IconButton` `Trash2` que aparece con
  `opacity-0 group-hover:opacity-100 focus-within:opacity-100`. Al hacer clic en
  la fila se filtra por esa categoría. Debajo, input compacto (`h-8`) con
  `IconButton` `Plus`; al crear se limpia y **el foco permanece en el input**.
- **Etiquetas**: chips `#nombre` que actúan como toggle de filtro (AND), con el
  mismo input de creación debajo.

**3. Pie** — avatar circular 28px con iniciales sobre `brand-soft`, nombre
13px/500 truncado, email 12px `ink-3` truncado, y `IconButton` `LogOut` con
`aria-label="Cerrar sesión"`.

En `< lg` la barra se convierte en **drawer** (280px) sobre overlay
`bg-ink/20 backdrop-blur-[2px]`, animado (`x: -280 → 0`, 220ms), abierto con un
`IconButton` `Menu` de la barra superior y cerrado con Esc, clic en el overlay o
al elegir una vista.

### 8.4 Barra superior — `components/TopBar.tsx`

`sticky top-0 z-20`, `bg-surface/60 backdrop-blur-xl border-b border-line/60`,
alto 68px:

- Izquierda: `IconButton` `Menu` (solo `< lg`), luego el título de la vista
  actual ("Mis tareas", "Hoy", "Próximas", "Completadas") en 24px/600 con un
  **pill de conteo** al lado mostrando `meta.total` (`bg-surface-2 text-ink-2
  rounded-full px-2 py-0.5 text-xs tabular`). Ese número **ya viene en la
  respuesta del listado**: no hace falta ninguna petición extra.
  Debajo, subtítulo en `ink-2`: "Organiza tu día, logra más."
- Derecha: `Input` de búsqueda con icono `Search` y `X` para limpiar
  (ancho ~300px, se colapsa a `IconButton` en `< md`), botón `Filtros`
  (`SlidersHorizontal`, `variant="secondary"`) y botón `Nueva tarea`
  (`primary`, icono `Plus`; en `< sm` solo el icono).
- **Mantén el debounce de búsqueda existente** (`useDebouncedValue`, 350ms).

### 8.5 Fila de controles — `components/FiltersBar.tsx`

Una sola fila, alineada entre extremos:

- **Izquierda**: `SegmentedControl` con `Todas` / `Pendientes` / `Completadas`.
- **Derecha**: `Select` compacto de orden, con las mismas opciones de hoy y el
  formato "Ordenar por: …" (`Más recientes`, `Más antiguas`, `Vencimiento
  próximo`, `Prioridad`, `Título A-Z`), conservando la correspondencia
  `campo:direccion`.
- El botón `Filtros` de la barra superior abre un `Popover` (hoja inferior en
  `< md`) con: **Prioridad** (segmentado de 4: Todas/Alta/Media/Baja),
  **Categoría** (`Select`), **Etiquetas** (chips toggle, semántica AND) y un
  `Button ghost` "Limpiar filtros". El botón muestra un `Badge` con el número
  de filtros activos cuando hay alguno.
- Con 2 o más etiquetas activas, muestra bajo los chips un texto de 12px en
  `ink-3`: "Se muestran las tareas que tienen todas las etiquetas
  seleccionadas".
- Cualquier cambio de filtro vuelve a `page: 1`, como ahora.

### 8.6 Rejilla y tarjeta — `components/TaskGrid.tsx`, `components/TaskCard.tsx`

Sustituyen a la lista actual (`TaskItem.tsx` se reescribe como `TaskCard.tsx`).

**Rejilla**: `grid gap-4`, con `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
xl:grid-cols-4` y `auto-rows-fr` para que todas las tarjetas de una fila midan
igual. Envuelta en `AnimatePresence`; cada tarjeta es un `motion.article` con
`layout`, `initial={{opacity:0, y:6}}`, `animate={{opacity:1, y:0}}`,
`exit={{opacity:0, scale:0.97}}`, 180ms. **No reordenar la lista en el cliente**
al completar: el orden lo decide el backend.

**Tarjeta** — `rounded-card border backdrop-blur-sm shadow-card p-4
min-h-[168px] flex flex-col`, con el fondo y el borde de §6.3, y
`transition-[background-color,border-color,box-shadow,transform] duration-180`.
Hover: `shadow-card-hover` y `-translate-y-0.5` (único desplazamiento permitido
en toda la app). Estructura:

1. **Fila superior**: `Checkbox` a la izquierda; a la derecha el **badge de
   prioridad** — `Alta` (`tone="danger"`) o `Media` (`tone="warn"`); en `baja`
   no se muestra nada. Si la tarea está completada, el badge pasa a
   `tone="neutral"`.
2. **Título**: 14.5px/600, `line-clamp-2`. Si `completada`: `line-through` y
   `text-ink-3`.
3. **Descripción**: 13px `ink-2`, `line-clamp-2`. Se omite si está vacía.
4. **Etiquetas** (si las hay): fila de chips `#nombre` de 11.5px, máximo 2 más
   un `+N` con `title` que liste el resto.
5. **Pie** (`mt-auto`, separado con `pt-3`): a la izquierda el chip de categoría
   (punto de color + nombre, §6.4) o nada si no tiene; a la derecha la fecha de
   vencimiento con `CalendarDays` y formato `d MMM` (p. ej. "13 sep"), clase
   `tabular`. **Si está vencida** (fecha < hoy en la zona del usuario y no
   completada): el icono pasa a `AlertTriangle`, el texto a `text-danger`, y se
   añade un `<span className="sr-only">Vencida</span>` para que el estado no
   dependa solo del color.
6. **Acciones**: `IconButton` `Pencil` y `Trash2`, superpuestos en la esquina
   inferior derecha con `opacity-0 group-hover:opacity-100
   focus-within:opacity-100`; en `< md` y en dispositivos táctiles, siempre
   visibles. El borrado abre `ConfirmDialog`, nunca `window.confirm`.
7. Toda la tarjeta es clicable para editar (excepto el checkbox y los botones de
   acción). Si la haces clicable, debe ser un elemento con `role="button"` y
   `tabIndex={0}` que responda a Enter y Espacio, o mejor: un `<button>`
   invisible que cubra el área del contenido. No anides botones dentro de otro
   botón.

**Tarjeta "Nueva tarea"**: última celda de la rejilla, `border-2 border-dashed
border-line-strong bg-surface/40 rounded-card`, centrada, con `Plus` en círculo
y el texto "Nueva tarea"; abre el modal de creación. Solo se muestra en la
última página y cuando hay al menos una tarea (el estado vacío ya tiene su
propio CTA).

### 8.7 Modal de tarea — `components/TaskFormModal.tsx`

Reescríbelo sobre `ui/Modal`, conservando `#task-form-modal`, `#task-form-title`,
`#tarea-titulo`, `#tarea-descripcion`, `role="dialog"`, `aria-modal` y
`aria-labelledby`.

- Overlay `bg-ink/25 backdrop-blur-[3px]`, fade 160ms.
- Panel `bg-surface/95 backdrop-blur-xl rounded-modal shadow-modal w-full
  max-w-lg`; entrada `opacity 0→1` + `scale 0.97→1` + `y 10→0` en 220ms con
  `--ease-out-quint`, salida en 140ms. En `< sm`, hoja inferior a ancho completo
  (`rounded-t-modal`, entrada `y: 24 → 0`).
- Cabecera con título e `IconButton` `X`, separada por `border-b border-line`.
- Cuerpo (`p-6`, `space-y-4`): título, descripción, rejilla `sm:grid-cols-2` con
  **Prioridad** (segmentado de 3 con el color del tinte correspondiente como
  fondo del segmento activo — refuerza la asociación prioridad↔color) y
  **Vence**; **Categoría** a ancho completo; **Etiquetas** como chips toggle.
- Pie con `border-t border-line`: `Cancelar` (`ghost`) y `Guardar` (`primary`
  con `loading`).
- Teclado: Esc cierra, `Cmd/Ctrl + Enter` envía, foco inicial en el título, foco
  atrapado dentro y devuelto al disparador al cerrar. Scroll del body bloqueado.

### 8.8 Estados — `components/EstadoCarga.tsx`

- **Cargando**: rejilla de **8 tarjetas skeleton** con la silueta de una
  `TaskCard` (checkbox, dos barras de título, dos de descripción, pie).
  Contenedor con `aria-busy="true"`, skeletons con `aria-hidden`.
- **Vacío sin filtros**: bloque centrado con `ListChecks` de 20px en un círculo
  de 44px `bg-brand-soft text-brand`, título 15px/600 ("Aún no tienes tareas"),
  descripción en `ink-2` y `Button primary` "Crear tarea".
- **Vacío con filtros**: mismo bloque con `Search`, copy "Ninguna tarea coincide
  con los filtros" y `Button secondary` "Limpiar filtros".
- **Error**: tarjeta `bg-danger-soft border-danger-line` con `AlertTriangle`, el
  mensaje del servidor y `Button secondary` con `RotateCw` "Reintentar".
- **`RutaProtegida`** (recuperando sesión): pantalla completa centrada con
  `LogoMark` y `animate-pulse` suave. Evita el parpadeo hacia login.
- **`ErrorBoundary`**: mismo lenguaje — tarjeta de vidrio centrada,
  `AlertTriangle`, título, descripción y botón "Recargar página".

### 8.9 Paginación — `components/Pagination.tsx`

Bajo la rejilla: a la izquierda `Mostrando 1–20 de 42` (clase `tabular`, en
`ink-2`); a la derecha `Página 2 de 3` y dos `IconButton`
(`ChevronLeft`/`ChevronRight`) con `aria-label` y `opacity-40` al
deshabilitarse. Oculta si `totalPages <= 1`.

---

## 9. Mapeo de vistas a la API (importante)

Las vistas del sidebar **no** necesitan endpoints nuevos: se construyen con
parámetros que `GET /api/tareas` ya acepta.

| Vista / control | Parámetros enviados |
|---|---|
| `Tareas` | ninguno de fecha |
| `Hoy` | `fecha_vencimiento_hasta=<hoy>` — incluye las vencidas, que es lo que un usuario espera ver en "Hoy" |
| `Próximas` | `fecha_vencimiento_desde=<mañana>` |
| Segmento `Todas` | sin `completada` |
| Segmento `Pendientes` | `completada=false` |
| Segmento `Completadas` (y atajo del sidebar) | `completada=true` |
| Búsqueda | `busqueda` |
| Popover de filtros | `prioridad`, `categoria`, `etiquetas` (IDs separados por coma) |
| Orden | `ordenar` + `direccion` |
| Paginación | `page`, `limit` |

**Cambios permitidos para que esto funcione** (única excepción de §3):

1. `src/types/index.ts` → añadir a `TareasFiltro`:
   `fecha_vencimiento_desde?: string` y `fecha_vencimiento_hasta?: string`.
2. `src/api/tareas.ts` → incluir esos dos campos en el objeto `query` de
   `listar`, igual que los demás.

No añadir ningún otro parámetro ni ruta.

**Cálculo de "hoy" en la zona del usuario.** `usuario.timezone` viene en el
perfil (`America/Bogota` por defecto) y está disponible en `AuthContext`. No
hagas aritmética de zonas horarias a mano:

```ts
// src/utils/fechas.ts
export function hoyEnZona(timeZone: string): string {
  // 'en-CA' formatea como YYYY-MM-DD, que es justo lo que espera la API.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
```

Usa `hoyEnZona` también para decidir si una tarea está vencida en la tarjeta.

---

## 10. Iconografía

| Concepto | Icono |
|---|---|
| Vista Tareas / estado vacío | `ListChecks` |
| Vista Hoy | `CalendarDays` |
| Vista Próximas | `Clock` |
| Vista Completadas | `CircleCheck` |
| Categorías | `Folder` |
| Etiquetas | `Tag` |
| Nueva tarea / añadir | `Plus` |
| Editar | `Pencil` |
| Eliminar | `Trash2` |
| Buscar | `Search` |
| Filtros | `SlidersHorizontal` |
| Vencida / error | `AlertTriangle` |
| Completada (check) | `Check` |
| Cerrar | `X` |
| Menú móvil | `Menu` |
| Cerrar sesión | `LogOut` |
| Sección plegable | `ChevronRight` |
| Paginación | `ChevronLeft` / `ChevronRight` |
| Reintentar | `RotateCw` |
| Email / usuario / contraseña | `Mail`, `User`, `Lock` |
| Ver/ocultar contraseña | `Eye` / `EyeOff` |

16px por defecto, 18px en acciones principales, `strokeWidth={1.75}`. Los
iconos decorativos llevan `aria-hidden`.

---

## 11. Responsive

| Rango | Comportamiento |
|---|---|
| `< 640px` | 1 columna. Sidebar en drawer. Buscador colapsado a icono. Filtros en hoja inferior. Modal como hoja inferior. Acciones de tarjeta siempre visibles. |
| `640–1023px` | 2 columnas. Sidebar en drawer. Modal centrado. |
| `1024–1279px` | 3 columnas. Sidebar fija de 248px. |
| `≥ 1280px` | 4 columnas, como el mockup. |

El `body` **nunca** debe hacer scroll horizontal: títulos, emails y nombres de
categoría se truncan con `truncate` o `line-clamp`.

---

## 12. Accesibilidad (no negociable)

1. Foco visible en todo elemento interactivo (cubierto por `:focus-visible`).
   Nunca `outline: none` sin sustituto.
2. **El tinte de prioridad no es el único canal**: las prioridades alta y media
   llevan siempre su badge de texto, y "vencida" lleva icono + texto `sr-only`
   además del color.
3. Contraste: el texto va sobre tintes muy claros, pero **verifícalo de verdad**
   con las herramientas del navegador — `ink` y `ink-2` deben cumplir AA sobre
   `tint-alta`, `tint-media` y `tint-hecha`, no solo sobre blanco. `ink-3` solo
   para placeholders, iconos y metadatos no esenciales.
4. Todo botón de solo icono lleva `aria-label` en español.
5. `Modal` y `Popover`: `role` correcto, foco atrapado, Esc cierra, foco
   devuelto al disparador.
6. La tarjeta clicable responde a Enter y Espacio y **no** anida botones.
7. El `SegmentedControl` es navegable con flechas y expone el estado
   seleccionado (`aria-checked` o `aria-pressed`).
8. Los toasts viven en una región `role="status"` `aria-live="polite"`.
9. Cada campo tiene su `<label htmlFor>`; los errores se asocian con
   `aria-describedby` y el control marca `aria-invalid`.
10. Con `prefers-reduced-motion` no hay animaciones ni desplazamientos.

---

## 13. Rendimiento

- `backdrop-filter` es caro. Se usa **solo** en: sidebar, barra superior,
  popover, overlay y panel del modal, y un `blur-sm` mínimo en las tarjetas.
  No lo apliques a nada más.
- Si al desplazarte con 20 tarjetas notas jank en el equipo objetivo, **quita el
  `backdrop-blur-sm` de las tarjetas** (mantén el color semitransparente): el
  aspecto casi no cambia y el coste desaparece. Deja anotado si lo haces.
- El fondo decorativo va en `body::before` con `position: fixed` y
  `pointer-events: none`; no lo repitas por componente ni lo animes.
- No pongas `will-change` "por si acaso": solo en el panel del modal mientras se
  anima, si hace falta.
- Las animaciones de la rejilla usan `layout` de `motion`, que ya se apoya en
  transforms; no animes propiedades que disparen layout.

---

## 14. Anti-objetivos

- Degradados saturados o de neón, y sombras de colores. El fondo decorativo es
  **suave**: si compite con el contenido, bájale la opacidad.
- Blur en todas partes: el efecto pierde valor y el rendimiento se hunde.
- Colorear las tarjetas por categoría *además* de por prioridad. El tinte de
  fondo codifica una sola dimensión: la prioridad. La categoría vive en su chip.
- Emojis como iconos.
- Animaciones largas, rebotes exagerados o parallax.
- Reescribir los hooks o la capa `api/` más allá de la excepción de §9.
- Cambiar los textos al inglés.
- Añadir dependencias fuera de las tres de §5.
- Dejar en pantalla elementos inertes ("Actividad", "Ajustes", contadores
  falsos): si no funciona, no se pinta.

---

## 15. Orden de trabajo

Commits pequeños, en este orden. Cada paso debe dejar la app funcionando y
`npm run build` en verde.

1. `chore(frontend): add lucide-react, motion and Inter font`
2. `style(frontend): add glass design tokens and decorative background`
3. `feat(frontend): add UI primitives (Button, Modal, SegmentedControl…)`
4. `feat(frontend): redesign auth screens`
5. `feat(frontend): rebuild app shell with glass sidebar and top bar`
6. `feat(frontend): add date-scoped views (Hoy, Próximas) via existing filters`
7. `feat(frontend): replace task list with priority-tinted card grid`
8. `feat(frontend): filters popover, segmented state control and sorting`
9. `feat(frontend): accessible modal, confirm dialog and toasts`
10. `feat(frontend): skeleton, empty and error states`
11. `fix(frontend): responsive, accessibility and performance pass`

---

## 16. Criterios de aceptación

**Compilación y calidad**

- [ ] `npm run build` pasa sin errores ni warnings de TypeScript.
- [ ] `npm run lint` no reporta errores nuevos.
- [ ] Consola del navegador limpia (sin warnings de React ni claves duplicadas).
- [ ] No hay colores fuera de los tokens: `grep -rn "slate-\|indigo-\|#[0-9a-fA-F]\{6\}" src/`
      solo devuelve coincidencias dentro de `index.css`.

**Funcionalidad** (con el backend levantado)

- [ ] Registro → entra directo a la rejilla.
- [ ] Logout y login con el mismo usuario.
- [ ] **Recargar la página estando logueado mantiene la sesión.** Es el caso que
      más fácil se rompe.
- [ ] Crear categoría y etiqueta desde el sidebar; aparecen sin recargar.
- [ ] Crear tarea con categoría, fecha, prioridad y 2 etiquetas.
- [ ] Editar esa tarea (título, prioridad y quitar una etiqueta).
- [ ] Completar y descompletar: cambio **inmediato** (optimista) y el tinte pasa
      a gris y vuelve.
- [ ] Eliminar tarea mediante `ConfirmDialog`.
- [ ] Eliminar categoría: las tareas siguen existiendo, sin categoría.
- [ ] Buscar (con debounce), filtrar por estado, prioridad, categoría y 2
      etiquetas a la vez (AND), ordenar y paginar.
- [ ] Vistas `Hoy` y `Próximas` devuelven conjuntos distintos y coherentes;
      `Hoy` incluye las vencidas.
- [ ] "Limpiar filtros" restablece todo y vuelve a la página 1.

**Visual**

- [ ] Con tareas de las tres prioridades, la rejilla muestra rosa / ámbar /
      blanco, y las completadas en gris.
- [ ] Los cuatro rangos responsive de §11 dan 1 / 2 / 3 / 4 columnas.
- [ ] Sin scroll horizontal en ningún ancho.
- [ ] Estados vacío, de carga (skeletons) y de error revisados de verdad
      (apaga el backend un momento para forzar el error).

**Accesibilidad y rendimiento**

- [ ] Recorrido completo con teclado (Tab/Shift+Tab/Enter/Espacio/Esc) por
      login, sidebar, controles, rejilla y modal, con foco siempre visible.
- [ ] El modal atrapa el foco y lo devuelve al cerrar.
- [ ] Contraste verificado del texto sobre los tintes rosa, ámbar y gris.
- [ ] Con `prefers-reduced-motion: reduce` no hay animaciones.
- [ ] El desplazamiento de la rejilla va fluido; si no, aplica la nota de §13.

**Capturas**

- [ ] Adjunta capturas de: login, rejilla con datos de las tres prioridades,
      estado vacío, modal de tarea y vista móvil (375px).
