import { apiRequest } from './client';
import type { Categoria } from '../types';

interface ListResponse {
  data: Categoria[];
  meta: Record<string, unknown>;
}
interface ItemResponse {
  data: Categoria;
  meta: Record<string, unknown>;
}

export const categoriasApi = {
  listar: () => apiRequest<ListResponse>('/categorias'),
  crear: (nombre: string) => apiRequest<ItemResponse>('/categorias', { method: 'POST', body: { nombre } }),
  actualizar: (id: string, nombre: string) =>
    apiRequest<ItemResponse>(`/categorias/${id}`, { method: 'PUT', body: { nombre } }),
  eliminar: (id: string) => apiRequest<void>(`/categorias/${id}`, { method: 'DELETE' }),
};
