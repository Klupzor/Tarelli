import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { setOnSessionExpired } from '../api/client';
import { onAccessTokenChange, setAccessToken } from '../api/tokenStore';
import type { Usuario } from '../types';

type EstadoSesion = 'cargando' | 'autenticado' | 'anonimo';

interface AuthContextValue {
  usuario: Usuario | null;
  estado: EstadoSesion;
  login: (email: string, password: string) => Promise<void>;
  registrar: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<EstadoSesion>('cargando');
  const [, forceRender] = useState(0);

  useEffect(() => onAccessTokenChange(() => forceRender((n) => n + 1)), []);

  // Al cargar la app, intenta recuperar la sesión con el refresh cookie existente.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await authApi.refrescar();
        if (!cancelado) {
          setUsuario(res.data.usuario);
          setEstado('autenticado');
        }
      } catch {
        if (!cancelado) {
          setAccessToken(null);
          setUsuario(null);
          setEstado('anonimo');
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      setUsuario(null);
      setEstado('anonimo');
    });
    return () => setOnSessionExpired(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.iniciarSesion({ email, password });
    setAccessToken(res.data.accessToken);
    setUsuario(res.data.usuario);
    setEstado('autenticado');
  }, []);

  const registrar = useCallback(async (nombre: string, email: string, password: string) => {
    const res = await authApi.registrar({ nombre, email, password });
    setAccessToken(res.data.accessToken);
    setUsuario(res.data.usuario);
    setEstado('autenticado');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.cerrarSesion();
    } catch (err) {
      // Si el logout falla en el servidor igual limpiamos el estado local.
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setAccessToken(null);
      setUsuario(null);
      setEstado('anonimo');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, estado, login, registrar, logout }),
    [usuario, estado, login, registrar, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
