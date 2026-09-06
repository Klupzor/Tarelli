import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type PreferenciaTema = 'claro' | 'oscuro' | 'sistema';
export type TemaEfectivo = 'claro' | 'oscuro';

const CLAVE_ALMACENAMIENTO = 'tarelli:tema';

interface ThemeContextValue {
  preferencia: PreferenciaTema;
  temaEfectivo: TemaEfectivo;
  setPreferencia: (preferencia: PreferenciaTema) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerPreferenciaGuardada(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (valor === 'claro' || valor === 'oscuro' || valor === 'sistema') return valor;
  } catch {
    // localStorage puede lanzar en modo privado o con cookies bloqueadas: cae a 'sistema'.
  }
  return 'sistema';
}

function resolverTemaEfectivo(preferencia: PreferenciaTema): TemaEfectivo {
  if (preferencia === 'sistema') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  return preferencia;
}

function aplicarTemaEfectivo(tema: TemaEfectivo): void {
  const atributo = tema === 'oscuro' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', atributo);
  document.documentElement.style.colorScheme = atributo;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferenciaState] = useState<PreferenciaTema>(leerPreferenciaGuardada);
  const [temaEfectivo, setTemaEfectivo] = useState<TemaEfectivo>(() => resolverTemaEfectivo(preferencia));

  useEffect(() => {
    const efectivo = resolverTemaEfectivo(preferencia);
    setTemaEfectivo(efectivo);
    aplicarTemaEfectivo(efectivo);

    if (preferencia !== 'sistema') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      const nuevo = media.matches ? 'oscuro' : 'claro';
      setTemaEfectivo(nuevo);
      aplicarTemaEfectivo(nuevo);
    }
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preferencia]);

  const setPreferencia = useCallback((nueva: PreferenciaTema) => {
    setPreferenciaState(nueva);
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, nueva);
    } catch {
      // Si falla el guardado, la preferencia solo dura la sesión actual.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preferencia, temaEfectivo, setPreferencia }),
    [preferencia, temaEfectivo, setPreferencia],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
