import { useCallback, useEffect, useState } from 'react';
import { etiquetasApi } from '../api/etiquetas';
import { ApiError } from '../api/client';
import type { Etiqueta } from '../types';

export function useEtiquetas() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await etiquetasApi.listar();
      setEtiquetas(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las etiquetas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = useCallback(async (nombre: string) => {
    const res = await etiquetasApi.crear(nombre);
    setEtiquetas((prev) => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return res.data;
  }, []);

  return { etiquetas, cargando, error, crear, recargar };
}
