import { apiRequest } from './client';
import type { PaginatedMeta, Tarea, TareaInput, TareasFiltro } from '../types';

interface ListResponse {
  data: Tarea[];
  meta: PaginatedMeta;
}
interface ItemResponse {
  data: Tarea;
  meta: Record<string, unknown>;
}

export const tareasApi = {
  listar: (filtro: TareasFiltro) =>
    apiRequest<ListResponse>('/tareas', {
      query: {
        completada: filtro.completada === undefined ? undefined : String(filtro.completada),
        categoria: filtro.categoria,
        prioridad: filtro.prioridad,
        busqueda: filtro.busqueda,
        etiquetas: filtro.etiquetas?.length ? filtro.etiquetas.join(',') : undefined,
        ordenar: filtro.ordenar,
        direccion: filtro.direccion,
        page: filtro.page,
        limit: filtro.limit,
      },
    }),
  crear: (input: TareaInput) => apiRequest<ItemResponse>('/tareas', { method: 'POST', body: input }),
  actualizar: (id: string, input: TareaInput) =>
    apiRequest<ItemResponse>(`/tareas/${id}`, { method: 'PUT', body: input }),
  eliminar: (id: string) => apiRequest<void>(`/tareas/${id}`, { method: 'DELETE' }),
  completar: (id: string, completada: boolean) =>
    apiRequest<ItemResponse>(`/tareas/${id}/completar`, { method: 'PATCH', body: { completada } }),
};
