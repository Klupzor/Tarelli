# Nuevas funcionalidades del frontend — Tarelli

> **Documento de trabajo para Claude Code.** Complementa a
> `docs/frontend-redesign.md`, que define el sistema de diseño y el layout.
> **Ese documento es el prerrequisito**: si el rediseño (rejilla de tarjetas,
> tokens de vidrio, primitivas de UI) todavía no está implementado, párate y
> avísalo antes de empezar aquí.

Tres funcionalidades nuevas, todas **solo frontend**:

1. **Toggle de tema** claro / oscuro / sistema.
2. **Dashboard de estadísticas** de tareas.
3. **Exportación** de tareas a CSV y JSON.

## 0. Nota de alcance — leer antes que nada

La especificación original del reto lista estas tres funcionalidades como
**fuera de alcance** (`Dashboard`, `Exportación CSV/JSON`, `Dark/light mode`).
Se añaden ahora de forma deliberada como **extras por encima del reto**, no como
parte de él. Esto implica:

- El backend **no se toca**. La lista de rutas sigue cerrada: no hay
  `GET /api/estadisticas` ni endpoint de exportación. Todo se calcula en el
  cliente a partir de `GET /api/tareas` (§3).
- No se modifican `openapi.yaml`, migraciones ni tests de backend.
- `CLAUDE.md` ya recoge estos tres extras en su sección de alcance; si detectas
  una contradicción entre documentos, la jerarquía es:
  `CLAUDE.md` → este documento → `frontend-redesign.md`.

---

## 1. Restricciones (siguen vigentes)

Las mismas invariantes del §4 de `frontend-redesign.md`, en resumen:

1. Access token **solo en memoria**. `localStorage` se usa exclusivamente para
   la preferencia de tema (§4), que no es información sensible.
2. `src/api/client.ts` conserva su comportamiento: `credentials: 'include'`,
   `X-CSRF-Token` en `refresh`/`logout`, y **un único refresh concurrente** ante
   401. Todas las peticiones nuevas de este documento pasan por `apiRequest`,
   nunca por `fetch` directo.
3. Los hooks existentes conservan su API y el update optimista.
4. Se conservan los `id` del DOM usados por las pruebas E2E.
5. `npm run build` (`tsc -b && vite build`) debe pasar limpio. Recuerda
   `verbatimModuleSyntax` (imports de tipos con `import type`),
   `noUnusedLocals`/`noUnusedParameters` y `erasableSyntaxOnly`.
6. UI en español.
7. Tailwind v4: los tokens van en `@theme` dentro de `src/index.css`. **No creces
   `tailwind.config.js`.**
8. **Sin dependencias nuevas.** Las gráficas se dibujan en SVG a mano (§5.4). No
   instales Recharts, Chart.js, D3 ni ninguna librería de export/CSV.

---

## 2. Dónde vive cada cosa en la UI

| Funcionalidad | Ubicación |
|---|---|
| Toggle de tema | Pie de la barra lateral, junto al bloque de usuario. |
| Dashboard | Ruta nueva `/estadisticas` + ítem `Estadísticas` (`BarChart3`) en el grupo de vistas de la barra lateral, debajo de `Completadas`. |
| Exportar | Botón `Exportar` (`Download`, `variant="secondary"`) en la barra superior, a la izquierda del botón `Filtros`. En `< md` se colapsa a `IconButton`. Abre un modal. |

---

## 3. Origen de datos compartido: `useTodasLasTareas`

El dashboard y la exportación necesitan **todas** las tareas que cumplen unos
filtros, no solo la página visible. Como no hay endpoint de agregación, se
resuelve paginando el listado que ya existe.

Crea `src/hooks/useTodasLasTareas.ts`:

```ts
const LIMITE_POR_PAGINA = 100;   // máximo que acepta el backend
const MAX_PAGINAS = 10;          // techo de seguridad: 1000 tareas

// Devuelve { tareas, total, truncado, cargando, error, recargar }
// - Pide la página 1 con limit=100 y lee meta.totalPages.
// - Si totalPages > 1, pide las páginas restantes (hasta MAX_PAGINAS) con
//   Promise.all y concatena en orden de página.
// - truncado = totalPages > MAX_PAGINAS.
```

Reglas:

- Acepta un `TareasFiltro` y lo reenvía tal cual (sin `page` ni `limit`, que los
  fija el propio hook). El dashboard lo llama sin filtros; la exportación lo
  llama con los filtros activos de la vista.
- **No se ejecuta al montar la app**: solo cuando se abre el dashboard o el
  modal de exportación. No conviertas esto en una carga global.
- Si `truncado` es `true`, la UI debe decirlo explícitamente (§5.7, §6.3). Nunca
  presentes cifras parciales como si fueran totales.
- Va a través de `apiRequest`, así que hereda el manejo de 401 y refresh.

---

## 4. Funcionalidad 1 — Tema claro / oscuro / sistema

### 4.1 Modelo de estado

`src/context/ThemeContext.tsx`:

```ts
type PreferenciaTema = 'claro' | 'oscuro' | 'sistema';   // lo que elige el usuario
type TemaEfectivo = 'claro' | 'oscuro';                  // lo que se pinta
```

- Clave de `localStorage`: `tarelli:tema`. Valor: la preferencia, no el tema
  efectivo.
- Con `sistema`, el tema efectivo se resuelve con
  `window.matchMedia('(prefers-color-scheme: dark)')` y **se suscribe a sus
  cambios** (`addEventListener('change', ...)`), para que cambiar el tema del SO
  se refleje al vuelo sin recargar.
- El tema efectivo se aplica poniendo `data-theme="light"` o `data-theme="dark"`
  en `document.documentElement`. Con preferencia `sistema` **también** se
  estampa el atributo (resuelto), para que el CSS tenga una sola fuente de
  verdad.
- El provider se monta en `App.tsx` por fuera de `AuthProvider`: el tema no
  depende de la sesión.
- `localStorage` puede lanzar (modo privado, cookies bloqueadas): envuelve
  lectura y escritura en `try/catch` y cae a `sistema` sin romper la app.

### 4.2 Evitar el destello blanco (FOUC)

React monta después del primer pintado, así que sin esto la app parpadea en
blanco al recargar en oscuro. Añade este script **inline y síncrono** en
`frontend/index.html`, dentro de `<head>`, antes de cualquier CSS:

```html
<script>
  (function () {
    try {
      var pref = localStorage.getItem('tarelli:tema') || 'sistema';
      var oscuro =
        pref === 'oscuro' ||
        (pref === 'sistema' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
      document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    } catch (e) {}
  })();
</script>
```

### 4.3 Estrategia de tokens

Los tokens actuales de `@theme` **son el tema claro** y no se tocan. El tema
oscuro redefine las mismas variables bajo el selector de atributo. Como la
resolución de `sistema` ya se estampa en el DOM (§4.1), **no hace falta un
bloque `@media (prefers-color-scheme: dark)`**: un solo selector, sin
duplicación ni conflictos de precedencia.

Añade al final de `src/index.css`:

```css
:root[data-theme='dark'] {
  color-scheme: dark;

  --color-canvas: #0e0f13;
  --color-surface: #17181f;
  --color-surface-2: #1e202a;

  --color-mesh-1: #2a2b52;
  --color-mesh-2: #3a2c1f;
  --color-mesh-3: #16302b;

  --color-line: #282a35;
  --color-line-strong: #363948;

  --color-ink: #f2f2f7;
  --color-ink-2: #a9abba;
  --color-ink-3: #71748a;

  --color-brand: #8b8bea;
  --color-brand-hover: #9c9cf0;
  --color-brand-soft: #24244a;
  --color-brand-line: #35356b;

  /* Tintes de prioridad: mismas familias de color, escalonadas para fondo oscuro */
  --color-tint-alta: #3a2027;
  --color-edge-alta: #5c2f38;
  --color-tint-media: #382b16;
  --color-edge-media: #56421f;
  --color-tint-baja: #1b1d26;
  --color-edge-baja: #2a2d3a;
  --color-tint-hecha: #16171d;
  --color-edge-hecha: #242631;

  --color-danger: #f27a70;
  --color-danger-soft: #3a1f1c;
  --color-danger-line: #5e2f29;
  --color-warn: #e8b04a;
  --color-warn-soft: #372a14;
  --color-warn-line: #57431f;
  --color-ok: #4ec08d;
  --color-ok-soft: #14301f;
  --color-ok-line: #245c3d;
}

/* El fondo decorativo pesa menos en oscuro: a plena opacidad ensucia. */
:root[data-theme='dark'] body::before {
  opacity: 0.5;
}
```

**Ajustes del efecto vidrio en oscuro.** Sobre fondo oscuro, una superficie al
70 % se ve sucia y el borde desaparece. En oscuro:

- Sidebar y barra superior: `bg-surface/80` en vez de `/70`.
- Tarjetas: opacidad de tinte `/85` en vez de `/72`.
- Los bordes claros de vidrio (`border-white/60` en claro) pasan a
  `border-white/8`.

Resuélvelo con variantes de Tailwind sobre el atributo, por ejemplo declarando
en `index.css` un `@custom-variant oscuro (&:where([data-theme=dark], [data-theme=dark] *))`
y usando `oscuro:bg-surface/85`. Si prefieres no añadir la variante, define
tokens de opacidad como variables y úsalos; lo que **no** vale es duplicar
componentes por tema.

### 4.4 Control en la UI

En el pie de la barra lateral, sobre el bloque de usuario: `SegmentedControl`
compacto de tres opciones con iconos `Sun`, `Moon`, `Monitor` (lucide), a
32×28 cada uno.

- Cada opción es un `radio` con `aria-label` (`Tema claro`, `Tema oscuro`,
  `Seguir al sistema`) y `title` para el tooltip nativo.
- La opción activa se marca con `aria-checked` y fondo `bg-surface shadow-xs`.
- El indicador se desliza con `layoutId` de `motion`.
- **No** animes el cambio de tema en sí (un fundido de toda la página se ve
  barato y provoca parpadeos). El cambio es instantáneo; solo se anima el
  indicador del control.

### 4.5 Revisión obligatoria de contraste

Al terminar el tema oscuro, recorre la app en oscuro y comprueba con las
herramientas del navegador:

- `ink` e `ink-2` sobre `surface`, `tint-alta`, `tint-media` y `tint-hecha`
  cumplen AA (4.5:1 para texto normal).
- Los badges (`danger`, `warn`, `ok`, `brand`) siguen legibles sobre sus
  `*-soft` correspondientes.
- El anillo de foco (`--color-brand`) se distingue sobre el fondo oscuro.
- Los tintes de prioridad siguen siendo **distinguibles entre sí** en oscuro:
  si alta y media se parecen demasiado, sube el contraste de los bordes
  (`edge-*`), no el de los fondos.

---

## 5. Funcionalidad 2 — Dashboard de estadísticas

Ruta `/estadisticas`, protegida por `RutaProtegida`, con el mismo `AppShell`
(barra lateral + barra superior). Título "Estadísticas", subtítulo
"Tu actividad de un vistazo".

Alcance de los datos: **todas las tareas del usuario**, sin los filtros de la
vista de listado. Se obtienen con `useTodasLasTareas()` sin argumentos.

> Nota: esto es distinto de `database/queries/`, que son 10 consultas SQL de
> inteligencia de negocio entre usuarios, pensadas para ejecutarse a mano. El
> dashboard es personal y del usuario autenticado.

### 5.1 Definición exacta de cada métrica

Sin ambigüedad, para que los números cuadren con lo que ve el usuario en la
lista:

| Métrica | Definición |
|---|---|
| Total | número de tareas del usuario |
| Completadas | `completada === true` |
| Pendientes | `completada === false` |
| Vencidas | `completada === false` **y** `fecha_vencimiento < hoy` en la zona del usuario (usa `hoyEnZona` de `src/utils/fechas.ts`, §9 del doc de rediseño) |
| Vencen hoy | `completada === false` **y** `fecha_vencimiento === hoy` |
| Tasa de finalización | `completadas / total`, redondeada a entero. Si `total === 0`, se muestra "—", nunca `NaN` ni `0 %` |
| Completadas esta semana | `completado_en` dentro de los últimos 7 días |

### 5.2 Composición de la página

```text
[ KPI row: 4 stat tiles ]                    ← Total · Pendientes · Vencidas · Completadas esta semana
[ Meter: tasa de finalización ]  [ Pendientes por prioridad: barra apilada ]
[ Pendientes por categoría: barras horizontales ]
[ Completadas por semana (12 semanas): área ]
```

Rejilla: `grid gap-4 md:grid-cols-2`; las barras por categoría y el área ocupan
`md:col-span-2`. Cada bloque es una tarjeta de vidrio: `bg-surface/72
backdrop-blur-sm border border-line rounded-card p-5 shadow-card` (en oscuro,
`/85` según §4.3).

### 5.3 Formas — y por qué estas

Decisiones tomadas; no las "mejores" por tu cuenta:

- **KPIs → stat tiles, no gráficas.** Un número aislado no es una gráfica de una
  barra. Valor en 28px/600, etiqueta en 12px `ink-2`, y en "Vencidas" el valor
  en `text-danger` cuando es > 0.
- **Tasa de finalización → meter** (barra de progreso con pista), no un donut de
  dos porciones. Un ratio contra un límite es un medidor.
- **Prioridad → barra apilada horizontal, no un donut.** Es parte-de-un-todo con
  tres segmentos cuyos valores pueden estar muy próximos, y en un donut eso es
  justo lo que peor se compara. Una barra apilada de 12px de alto, ancho
  completo, con leyenda y etiquetas directas, se lee mejor y encaja mejor en la
  tarjeta.
- **Categoría → barras horizontales, un solo color.** Es comparación de
  magnitud: la identidad la dan las etiquetas del eje, no el color. Horizontal
  porque los nombres de categoría son largos. Máximo **8 barras**; el resto se
  pliega en una barra "Otras". Ordenadas de mayor a menor.
- **Tendencia → área de una sola serie.** Una sola serie no necesita leyenda: el
  título de la tarjeta la nombra.

### 5.4 Paleta de datos (validada, no la cambies a ojo)

Estos valores pasaron el validador de contraste y de daltonismo (separación CVD
y de visión normal en todos los pares, en ambos modos). **Si cambias un color,
hay que revalidar el conjunto entero.**

Declara los slots como variables CSS en `@theme` (claro) y en el bloque
`:root[data-theme='dark']` (oscuro), y **usa los roles, nunca el hex** en los
componentes:

| Rol | Claro | Oscuro |
|---|---|---|
| `--color-dato-alta` | `#c5334f` | `#d94a63` |
| `--color-dato-media` | `#e0a020` | `#c98500` |
| `--color-dato-baja` | `#2a78d6` | `#3987e5` |
| `--color-dato-serie` (barras y área) | `#2a78d6` | `#3987e5` |
| `--color-grid` (rejilla hairline) | `#e7e7ee` | `#282a35` |
| `--color-eje` (línea base) | `#d6d6e0` | `#363948` |

Notas importantes:

- **El violeta de marca (`--color-brand`) no se usa como color de datos.** Es
  demasiado parecido al azul de la serie (indistinguibles para visión normal y
  para daltonismo), y tener dos azul-violetas casi iguales en la misma pantalla
  ensucia. La marca se queda para UI (botones, estados activos); los datos usan
  la paleta de arriba.
- Que `dato-baja` y `dato-serie` compartan color es intencionado: nunca aparecen
  en la misma gráfica, y así en pantalla hay **un solo azul** en vez de dos
  confundibles.
- El ámbar queda por debajo de 3:1 sobre fondo claro. Es aceptable **solo**
  porque los segmentos llevan etiqueta directa y leyenda; no lo uses para texto
  ni para marcas sin etiquetar.
- **El texto nunca se pinta con el color de la serie.** Valores, etiquetas y
  leyendas van en `ink` / `ink-2`; la identidad la lleva la muestra de color
  contigua.

### 5.5 Especificación de las marcas

- **Barra apilada de prioridad**: 12px de alto, `rounded-full` en los extremos
  del conjunto, y **2px de hueco del color de la superficie entre segmentos**.
  Leyenda debajo con muestra de 8px + nombre + valor + porcentaje. Si un
  segmento vale 0, se omite (no dejes un hueco fantasma).
- **Barras horizontales de categoría**: alto 10px, `rounded-full`, separación
  vertical de 12px, valor numérico al final de cada barra en `ink-2` con clase
  `tabular`. Sin rejilla vertical: las etiquetas y los valores bastan.
- **Área de tendencia**: línea de **2px** con relleno del mismo color al 12 % de
  opacidad; puntos de ≥ 8px solo en hover. Rejilla horizontal hairline de 1px
  en `--color-grid`, **nunca discontinua**. Eje X con la etiqueta de una de cada
  tres semanas para que no se amontonen.
- Nada de sombras, degradados ni efectos 3D en las marcas.

### 5.6 Interacción

Una gráfica en HTML es interactiva por definición: no la dejes muda.

- **Barras y segmentos**: tooltip al pasar el ratón y al enfocar con teclado, con
  nombre, valor absoluto y porcentaje. El área sensible debe ser mayor que la
  marca (envuelve cada barra en una fila completa clicable).
- **Área**: retícula vertical (crosshair) que sigue al cursor + tooltip con la
  semana y el valor.
- El tooltip es un `div` posicionado, no el `title` nativo (que tarda y no se
  puede estilar). Reutiliza el estilo de vidrio: `bg-surface/95 backdrop-blur
  border border-line rounded-field shadow-md px-2.5 py-1.5 text-xs`.
- Con `prefers-reduced-motion` los tooltips aparecen sin transición.

### 5.7 Estados

- **Cargando**: skeletons con la silueta de cada bloque (4 tiles + 4 tarjetas).
  `aria-busy="true"`.
- **Sin tareas**: bloque centrado con `BarChart3`, "Todavía no hay nada que
  medir", descripción y `Button primary` "Crear tarea" que lleva a `/`.
- **Error**: tarjeta `danger-soft` con `AlertTriangle`, mensaje y "Reintentar".
- **Truncado** (`truncado === true`): banda informativa arriba, `warn-soft` con
  `Info`: "Mostrando estadísticas sobre las primeras 1000 tareas."

### 5.8 Accesibilidad de las gráficas

1. Cada gráfica va dentro de una `<figure>` con `<figcaption>` (puede ser
   `sr-only` si el título ya está en la cabecera de la tarjeta).
2. El SVG lleva `role="img"` y un `aria-label` que resuma el dato
   ("Pendientes por prioridad: 12 alta, 8 media, 5 baja").
3. **Vista de tabla**: cada tarjeta de gráfica tiene un `IconButton` `Table`
   que alterna entre la gráfica y una `<table>` con los mismos datos. Es la
   alternativa accesible obligatoria y además resuelve la advertencia de
   contraste del ámbar.
4. Con ≥ 2 series hay siempre leyenda; con ≤ 4 segmentos, además etiqueta
   directa. La identidad nunca depende solo del color.
5. Los tooltips no pueden ser la única vía de acceso al valor: los valores
   también están en las etiquetas directas o en la vista de tabla.

---

## 6. Funcionalidad 3 — Exportar a CSV / JSON

### 6.1 Flujo

1. El usuario pulsa `Exportar` en la barra superior.
2. Se abre un `Modal` "Exportar tareas" que **usa los filtros activos de la
   vista actual** (incluidos búsqueda, vista de fecha, estado, prioridad,
   categoría y etiquetas).
3. El modal muestra: un `SegmentedControl` de formato (`CSV` / `JSON`), un
   resumen del alcance y un botón `Descargar`.
4. Al abrirse, lanza `useTodasLasTareas(filtroActual)` y muestra
   "Se exportarán **N** tareas con los filtros actuales." Mientras carga, el
   botón queda en `loading`.
5. Si no hay filtros activos, el texto es "Se exportarán **N** tareas (todas)."
6. Si `truncado`, avisa: "Se exportarán las primeras 1000 tareas."
7. Si `N === 0`, el botón queda deshabilitado con el texto "No hay tareas que
   exportar".
8. Al descargar: se genera el `Blob`, se dispara la descarga, se cierra el modal
   y se emite un toast "Se descargaron N tareas".

### 6.2 Columnas (mismo orden en ambos formatos)

Legibles, sin UUIDs:

| Columna | Origen |
|---|---|
| `titulo` | `titulo` |
| `descripcion` | `descripcion` |
| `prioridad` | `prioridad` |
| `estado` | `completada ? 'Completada' : 'Pendiente'` |
| `categoria` | `categoria_nombre ?? ''` |
| `etiquetas` | nombres unidos por `; ` (punto y coma + espacio) |
| `fecha_vencimiento` | `YYYY-MM-DD` o vacío |
| `completado_en` | `YYYY-MM-DD` o vacío |
| `creado_en` | `YYYY-MM-DD` |

### 6.3 Formato CSV

- Separador **coma** (RFC 4180). Es lo que esperan Sheets, Numbers, pandas y
  cualquier importador serio.
- **BOM UTF-8 (`﻿`) al principio del archivo.** Sin él, Excel en Windows
  destroza los acentos y las eñes, que en esta app aparecen en casi todos los
  títulos.
- Fin de línea `\r\n`.
- Toda celda va entre comillas dobles y las comillas internas se duplican
  (`"` → `""`). Es lo más simple y siempre correcto.
- Primera fila: cabeceras con los nombres de la tabla de §6.2.
- **Prevención de inyección de fórmulas**: si el valor de una celda empieza por
  `=`, `+`, `-`, `@`, tabulador o retorno de carro, anteponle un apóstrofo
  (`'`). Un título como `=1+1` abierto en Excel se ejecutaría como fórmula; con
  contenido escrito por el usuario esto es una vía de ataque real
  (*CSV injection*). No lo omitas.

### 6.4 Formato JSON

```json
{
  "exportado_en": "2026-09-05T20:14:00.000Z",
  "total": 42,
  "truncado": false,
  "filtros": { "completada": false, "prioridad": "alta" },
  "tareas": [
    {
      "titulo": "…",
      "descripcion": "…",
      "prioridad": "alta",
      "estado": "Pendiente",
      "categoria": "Trabajo",
      "etiquetas": ["urgente", "cliente"],
      "fecha_vencimiento": "2026-09-13",
      "completado_en": null,
      "creado_en": "2026-09-01"
    }
  ]
}
```

En JSON las etiquetas son un array (no una cadena) y las fechas vacías son
`null`, no `""`. Indentación de 2 espacios.

### 6.5 Descarga

```ts
// src/utils/descargar.ts
export function descargarArchivo(contenido: string, nombre: string, mime: string) {
  const blob = new Blob([contenido], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url); // no lo olvides: si no, se filtra memoria
}
```

- MIME: `text/csv` y `application/json`.
- Nombre del archivo: `tarelli-tareas-YYYY-MM-DD.csv` / `.json`, con la fecha en
  la zona del usuario.
- La generación va en `src/utils/exportar.ts` (`aCSV(tareas)` y
  `aJSON(tareas, meta)`), **funciones puras** sin acceso al DOM, para poder
  probarlas si más adelante se añaden tests de frontend.

---

## 7. Orden de trabajo

Commits pequeños; cada paso debe dejar la app funcionando y `npm run build` en
verde.

1. `feat(frontend): add theme context with light/dark/system preference`
2. `style(frontend): add dark theme tokens and glass adjustments`
3. `feat(frontend): add theme switcher to sidebar footer`
4. `feat(frontend): add useTodasLasTareas paginated fetch hook`
5. `feat(frontend): add statistics route with KPI tiles and meter`
6. `feat(frontend): add priority, category and trend charts`
7. `feat(frontend): add table view and tooltips to charts`
8. `feat(frontend): add CSV/JSON export modal`
9. `fix(frontend): dark mode contrast and accessibility pass`

---

## 8. Criterios de aceptación

**Compilación**

- [ ] `npm run build` pasa sin errores ni warnings de TypeScript.
- [ ] `npm run lint` no reporta errores nuevos.
- [ ] Consola limpia, sin warnings de React.

**Tema**

- [ ] Las tres opciones (Claro / Oscuro / Sistema) funcionan y persisten al
      recargar.
- [ ] Con `Sistema` seleccionado, cambiar el tema del SO actualiza la app **sin
      recargar**.
- [ ] Recargando en modo oscuro **no hay destello blanco**.
- [ ] Recorrido completo en oscuro: login, registro, rejilla, modal, popover de
      filtros, dashboard, modal de exportación, estados vacío y de error.
- [ ] Los tintes de prioridad se distinguen entre sí en oscuro y las tareas
      completadas siguen leyéndose como apagadas.
- [ ] Contraste AA verificado en oscuro para `ink` e `ink-2` sobre las cuatro
      superficies de tarjeta.
- [ ] `localStorage` bloqueado (modo privado) no rompe la app.

**Dashboard**

- [ ] Los números cuadran con la lista: filtra por "Pendientes" en `/` y
      compara el contador con el KPI "Pendientes".
- [ ] Con 0 tareas se ve el estado vacío, sin `NaN` ni divisiones por cero.
- [ ] La suma de los segmentos de la barra apilada es igual al KPI "Pendientes".
- [ ] Con más de 8 categorías aparece la barra "Otras".
- [ ] Tooltips funcionan con ratón y con teclado.
- [ ] La vista de tabla muestra los mismos datos que cada gráfica.
- [ ] Las gráficas se ven correctas en claro y en oscuro (no basta con invertir:
      revísalas de verdad).
- [ ] Con más de 1000 tareas aparece el aviso de truncado (pruébalo bajando
      `MAX_PAGINAS` a 1 temporalmente).

**Exportación**

- [ ] El CSV abre en Excel/Numbers **con los acentos y eñes correctos**.
- [ ] Un título con comillas dobles y otro con comas se exportan sin romper
      columnas.
- [ ] Una tarea titulada `=1+1` se exporta con apóstrofo delante y **no** se
      evalúa como fórmula al abrir el archivo.
- [ ] Exportar con filtros activos exporta exactamente esas tareas, incluidas
      las de páginas que no estaban a la vista.
- [ ] El JSON es válido (`JSON.parse` sin errores) y respeta la estructura de
      §6.4.
- [ ] Con 0 resultados, el botón queda deshabilitado.

**Capturas**

- [ ] Adjunta: dashboard en claro, dashboard en oscuro, rejilla en oscuro y
      modal de exportación.
