import type { Prioridad, Tarea } from '../types';

export interface ResumenEstadisticas {
  total: number;
  completadas: number;
  pendientes: number;
  vencidas: number;
  vencenHoy: number;
  /** `null` con 0 tareas: se muestra "—", nunca `NaN` ni `0 %`. */
  tasaFinalizacion: number | null;
  completadasEstaSemana: number;
}

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Todas las cifras se derivan del mismo array `tareas` para que siempre
 * cuadren entre sí (p. ej. completadas + pendientes === total), incluso si
 * `tareas` está truncado a las primeras 1000 (ver `useTodasLasTareas`).
 */
export function calcularResumen(tareas: Tarea[], hoy: string): ResumenEstadisticas {
  const total = tareas.length;
  const completadas = tareas.filter((t) => t.completada).length;
  const pendientes = total - completadas;
  const vencidas = tareas.filter(
    (t) => !t.completada && t.fecha_vencimiento !== null && t.fecha_vencimiento.slice(0, 10) < hoy,
  ).length;
  const vencenHoy = tareas.filter(
    (t) => !t.completada && t.fecha_vencimiento !== null && t.fecha_vencimiento.slice(0, 10) === hoy,
  ).length;

  const limiteSemana = Date.now() - SIETE_DIAS_MS;
  const completadasEstaSemana = tareas.filter(
    (t) => t.completada && t.completado_en !== null && new Date(t.completado_en).getTime() >= limiteSemana,
  ).length;

  return {
    total,
    completadas,
    pendientes,
    vencidas,
    vencenHoy,
    tasaFinalizacion: total === 0 ? null : Math.round((completadas / total) * 100),
    completadasEstaSemana,
  };
}

export interface SegmentoPrioridad {
  prioridad: Prioridad;
  etiqueta: string;
  valor: number;
}

const ETIQUETAS_PRIORIDAD: Record<Prioridad, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };

/** Solo tareas pendientes: la suma de los segmentos debe cuadrar con el KPI "Pendientes". */
export function calcularPrioridad(tareas: Tarea[]): SegmentoPrioridad[] {
  const conteo: Record<Prioridad, number> = { alta: 0, media: 0, baja: 0 };
  tareas.forEach((t) => {
    if (!t.completada) conteo[t.prioridad] += 1;
  });
  return (['alta', 'media', 'baja'] as const).map((prioridad) => ({
    prioridad,
    etiqueta: ETIQUETAS_PRIORIDAD[prioridad],
    valor: conteo[prioridad],
  }));
}

export interface BarraCategoria {
  categoriaId: string | null;
  nombre: string;
  valor: number;
}

const MAX_BARRAS_CATEGORIA = 8;

/**
 * Tareas pendientes con categoría, agrupadas y ordenadas de mayor a menor.
 * Con más de 8 categorías, se muestran las 7 principales y el resto se
 * pliega en una barra "Otras" (nunca más de 8 barras en pantalla).
 */
export function calcularCategorias(tareas: Tarea[]): BarraCategoria[] {
  const conteos = new Map<string, { nombre: string; valor: number }>();
  tareas.forEach((t) => {
    if (t.completada || !t.categoria_id || !t.categoria_nombre) return;
    const actual = conteos.get(t.categoria_id);
    if (actual) actual.valor += 1;
    else conteos.set(t.categoria_id, { nombre: t.categoria_nombre, valor: 1 });
  });

  const ordenadas: BarraCategoria[] = Array.from(conteos.entries())
    .map(([categoriaId, v]) => ({ categoriaId, nombre: v.nombre, valor: v.valor }))
    .sort((a, b) => b.valor - a.valor);

  if (ordenadas.length <= MAX_BARRAS_CATEGORIA) return ordenadas;

  const principales = ordenadas.slice(0, MAX_BARRAS_CATEGORIA - 1);
  const otras = ordenadas.slice(MAX_BARRAS_CATEGORIA - 1).reduce((acc, c) => acc + c.valor, 0);
  return [...principales, { categoriaId: null, nombre: 'Otras', valor: otras }];
}

export interface PuntoTendencia {
  /** Fecha de inicio del bucket, YYYY-MM-DD. */
  fecha: string;
  etiqueta: string;
  valor: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const SEMANAS_TENDENCIA = 12;
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatearEtiquetaSemana(fechaISO: string): string {
  const [, mes, dia] = fechaISO.split('-');
  return `${parseInt(dia, 10)} ${MESES_ABREV[parseInt(mes, 10) - 1]}`;
}

/**
 * 12 buckets móviles de 7 días (no semanas de calendario: evita depender de
 * un día de inicio de semana) terminando hoy, con el conteo de tareas
 * completadas (`completado_en`) en cada uno.
 */
export function calcularTendencia(tareas: Tarea[], hoy: string, timeZone: string): PuntoTendencia[] {
  const hoyMs = new Date(`${hoy}T00:00:00Z`).getTime();

  const buckets = Array.from({ length: SEMANAS_TENDENCIA }, (_, i) => {
    const semanasAtras = SEMANAS_TENDENCIA - i - 1;
    const inicioFecha = new Date(hoyMs - (semanasAtras * 7 + 6) * DIA_MS).toISOString().slice(0, 10);
    const finFecha = new Date(hoyMs - semanasAtras * 7 * DIA_MS).toISOString().slice(0, 10);
    return { inicioFecha, finFecha, valor: 0 };
  });

  tareas.forEach((t) => {
    if (!t.completada || !t.completado_en) return;
    const fecha = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(t.completado_en));
    const bucket = buckets.find((b) => fecha >= b.inicioFecha && fecha <= b.finFecha);
    if (bucket) bucket.valor += 1;
  });

  return buckets.map((b) => ({ fecha: b.inicioFecha, etiqueta: formatearEtiquetaSemana(b.inicioFecha), valor: b.valor }));
}
