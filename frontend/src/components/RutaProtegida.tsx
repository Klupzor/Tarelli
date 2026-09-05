import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EstadoCargando } from './EstadoCarga';

export function RutaProtegida({ children }: { children: ReactNode }) {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EstadoCargando mensaje="Recuperando sesión..." />
      </div>
    );
  }

  if (estado === 'anonimo') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function RutaPublica({ children }: { children: ReactNode }) {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EstadoCargando mensaje="Recuperando sesión..." />
      </div>
    );
  }

  if (estado === 'autenticado') {
    return <Navigate to="/" replace />;
  }

  return children;
}
