import { useCallback, useEffect, useState } from 'react';
import { tareasApi } from '../api/tareas';
import { ApiError } from '../api/client';
import type { PaginatedMeta, Tarea, TareaInput, TareasFiltro } from '../types';

const META_INICIAL: PaginatedMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export function useTareas(filtro: TareasFiltro) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(META_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtroKey = JSON.stringify(filtro);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await tareasApi.listar(filtro);
      setTareas(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las tareas.');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroKey]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = useCallback(
    async (input: TareaInput) => {
      await tareasApi.crear(input);
      await recargar();
    },
    [recargar],
  );

  const actualizar = useCallback(
    async (id: string, input: TareaInput) => {
      await tareasApi.actualizar(id, input);
      await recargar();
    },
    [recargar],
  );

  const eliminar = useCallback(async (id: string) => {
    await tareasApi.eliminar(id);
    setTareas((prev) => prev.filter((t) => t.id !== id));
    setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }, []);

  /** Optimistic update: refleja el cambio de inmediato y revierte si el servidor falla. */
  const completar = useCallback(async (id: string, completada: boolean) => {
    setTareas((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completada, completado_en: completada ? new Date().toISOString() : null } : t,
      ),
    );
    try {
      const res = await tareasApi.completar(id, completada);
      setTareas((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } catch (err) {
      setTareas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completada: !completada, completado_en: t.completado_en } : t)),
      );
      throw err;
    }
  }, []);

  return { tareas, meta, cargando, error, crear, actualizar, eliminar, completar, recargar };
}
