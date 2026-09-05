import { apiRequest } from './client';
import type { Etiqueta } from '../types';

interface ListResponse {
  data: Etiqueta[];
  meta: Record<string, unknown>;
}
interface ItemResponse {
  data: Etiqueta;
  meta: Record<string, unknown>;
}

export const etiquetasApi = {
  listar: () => apiRequest<ListResponse>('/etiquetas'),
  crear: (nombre: string) => apiRequest<ItemResponse>('/etiquetas', { method: 'POST', body: { nombre } }),
};
