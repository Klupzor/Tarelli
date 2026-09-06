export type Prioridad = 'baja' | 'media' | 'alta';

/** Atajos de navegación del sidebar, derivados de `TareasFiltro` (sin estado propio en el backend). */
export type VistaRapida = 'todas' | 'hoy' | 'proximas' | 'completadas';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  timezone: string;
  ultimoLoginEn: string | null;
  creadoEn: string;
}

export interface Etiqueta {
  id: string;
  usuario_id: string;
  nombre: string;
  creado_en: string;
}

export interface Categoria {
  id: string;
  usuario_id: string;
  nombre: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Tarea {
  id: string;
  usuario_id: string;
  categoria_id: string | null;
  categoria_nombre: string | null;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  completada: boolean;
  fecha_vencimiento: string | null;
  completado_en: string | null;
  creado_en: string;
  actualizado_en: string;
  etiquetas: Etiqueta[];
}

export interface TareaInput {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  categoria_id: string | null;
  fecha_vencimiento: string | null;
  etiquetas: string[];
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TareasFiltro {
  completada?: boolean;
  categoria?: string;
  prioridad?: Prioridad;
  busqueda?: string;
  etiquetas?: string[];
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
  ordenar?: 'creado_en' | 'fecha_vencimiento' | 'prioridad' | 'titulo';
  direccion?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
