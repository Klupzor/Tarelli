import { useCallback, useEffect, useState } from 'react';
import { tareasApi } from '../api/tareas';
import { ApiError } from '../api/client';
import type { Tarea, TareasFiltro } from '../types';

const LIMITE_POR_PAGINA = 100; // máximo que acepta el backend
const MAX_PAGINAS = 10; // techo de seguridad: 1000 tareas

interface ResultadoTodasLasTareas {
  tareas: Tarea[];
  total: number;
  truncado: boolean;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Trae TODAS las tareas que cumplen `filtro`, paginando el listado existente
 * (no hay endpoint de agregación). Solo se invoca cuando el consumidor
 * (dashboard, modal de exportación) monta: nunca al cargar la app.
 *
 * `activo` permite a un consumidor que vive siempre montado (el modal de
 * exportación, que solo cambia de visibilidad) posponer la primera petición
 * hasta que realmente se abre, sin tener que desmontarse.
 */
export function useTodasLasTareas(filtro: TareasFiltro = {}, activo = true): ResultadoTodasLasTareas {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [total, setTotal] = useState(0);
  const [truncado, setTruncado] = useState(false);
  const [cargando, setCargando] = useState(activo);
  const [error, setError] = useState<string | null>(null);

  const filtroKey = JSON.stringify(filtro);

  const recargar = useCallback(async () => {
    if (!activo) return;
    setCargando(true);
    setError(null);
    try {
      const primera = await tareasApi.listar({ ...filtro, page: 1, limit: LIMITE_POR_PAGINA });
      const totalPaginas = primera.meta.totalPages;
      const paginasATraer = Math.min(totalPaginas, MAX_PAGINAS);

      const siguientes = await Promise.all(
        Array.from({ length: Math.max(0, paginasATraer - 1) }, (_, i) =>
          tareasApi.listar({ ...filtro, page: i + 2, limit: LIMITE_POR_PAGINA }),
        ),
      );

      setTareas([primera, ...siguientes].flatMap((res) => res.data));
      setTotal(primera.meta.total);
      setTruncado(totalPaginas > MAX_PAGINAS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las tareas.');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroKey, activo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { tareas, total, truncado, cargando, error, recargar };
}
