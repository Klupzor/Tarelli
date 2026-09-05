import { useCallback, useEffect, useState } from 'react';
import { categoriasApi } from '../api/categorias';
import { ApiError } from '../api/client';
import type { Categoria } from '../types';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await categoriasApi.listar();
      setCategorias(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las categorías.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = useCallback(async (nombre: string) => {
    const res = await categoriasApi.crear(nombre);
    setCategorias((prev) => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return res.data;
  }, []);

  const actualizar = useCallback(async (id: string, nombre: string) => {
    const res = await categoriasApi.actualizar(id, nombre);
    setCategorias((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await categoriasApi.eliminar(id);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categorias, cargando, error, crear, actualizar, eliminar, recargar };
}
