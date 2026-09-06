import type { Tarea, TareasFiltro } from '../types';

const COLUMNAS = [
  'titulo',
  'descripcion',
  'prioridad',
  'estado',
  'categoria',
  'etiquetas',
  'fecha_vencimiento',
  'completado_en',
  'creado_en',
] as const;

type Columna = (typeof COLUMNAS)[number];

function filaDeTarea(t: Tarea): Record<Columna, string> {
  return {
    titulo: t.titulo,
    descripcion: t.descripcion,
    prioridad: t.prioridad,
    estado: t.completada ? 'Completada' : 'Pendiente',
    categoria: t.categoria_nombre ?? '',
    etiquetas: t.etiquetas.map((e) => e.nombre).join('; '),
    fecha_vencimiento: t.fecha_vencimiento?.slice(0, 10) ?? '',
    completado_en: t.completado_en?.slice(0, 10) ?? '',
    creado_en: t.creado_en.slice(0, 10),
  };
}

// Un valor que empieza por estos caracteres se interpretaría como fórmula al
// abrir el CSV en Excel/Sheets (CSV injection): se antepone un apóstrofo.
const CARACTERES_FORMULA = ['=', '+', '-', '@', '\t', '\r'];

function celdaCSV(valor: string): string {
  const saneada = CARACTERES_FORMULA.some((c) => valor.startsWith(c)) ? `'${valor}` : valor;
  return `"${saneada.replace(/"/g, '""')}"`;
}

/** Función pura, sin acceso al DOM: separador coma, BOM UTF-8, CRLF, todo entrecomillado. */
export function aCSV(tareas: Tarea[]): string {
  const encabezado = COLUMNAS.map(celdaCSV).join(',');
  const filas = tareas.map((t) => {
    const fila = filaDeTarea(t);
    return COLUMNAS.map((col) => celdaCSV(fila[col])).join(',');
  });
  return `﻿${[encabezado, ...filas].join('\r\n')}\r\n`;
}

interface MetaExportacionJSON {
  truncado: boolean;
  filtros: Record<string, unknown>;
}

/** Función pura, sin acceso al DOM. Etiquetas como array; fechas vacías como `null`. */
export function aJSON(tareas: Tarea[], meta: MetaExportacionJSON): string {
  const payload = {
    exportado_en: new Date().toISOString(),
    total: tareas.length,
    truncado: meta.truncado,
    filtros: meta.filtros,
    tareas: tareas.map((t) => ({
      titulo: t.titulo,
      descripcion: t.descripcion,
      prioridad: t.prioridad,
      estado: t.completada ? 'Completada' : 'Pendiente',
      categoria: t.categoria_nombre ?? '',
      etiquetas: t.etiquetas.map((e) => e.nombre),
      fecha_vencimiento: t.fecha_vencimiento?.slice(0, 10) ?? null,
      completado_en: t.completado_en?.slice(0, 10) ?? null,
      creado_en: t.creado_en.slice(0, 10),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

const CAMPOS_FILTRO: (keyof TareasFiltro)[] = [
  'completada',
  'categoria',
  'prioridad',
  'busqueda',
  'etiquetas',
  'fecha_vencimiento_desde',
  'fecha_vencimiento_hasta',
];

/** Solo los criterios de filtrado realmente activos, sin paginación ni orden (para el JSON exportado). */
export function filtrosActivos(filtro: TareasFiltro): Record<string, unknown> {
  const activos: Record<string, unknown> = {};
  CAMPOS_FILTRO.forEach((campo) => {
    const valor = filtro[campo];
    if (valor === undefined) return;
    if (Array.isArray(valor) && valor.length === 0) return;
    activos[campo] = valor;
  });
  return activos;
}
