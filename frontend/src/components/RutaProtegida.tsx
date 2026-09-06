import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './ui/LogoMark';

function RecuperandoSesion() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="animate-pulse">
        <LogoMark size={40} />
      </div>
      <p className="text-[12.5px] text-ink-3">Recuperando sesión…</p>
    </div>
  );
}

export function RutaProtegida({ children }: { children: ReactNode }) {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return <RecuperandoSesion />;
  }

  if (estado === 'anonimo') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function RutaPublica({ children }: { children: ReactNode }) {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return <RecuperandoSesion />;
  }

  if (estado === 'autenticado') {
    return <Navigate to="/" replace />;
  }

  return children;
}
