import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { validarEmail } from '../utils/validation';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errorEmail = validarEmail(email);
    const errorPassword = password ? null : 'La contraseña es obligatoria.';
    setErrores({ email: errorEmail ?? undefined, password: errorPassword ?? undefined });
    if (errorEmail || errorPassword) return;

    setEnviando(true);
    setErrorServidor(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorServidor(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Tarelli</h1>
        <p className="mb-6 text-sm text-slate-500">Inicia sesión para gestionar tus tareas.</p>

        {errorServidor && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorServidor}</div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoComplete="email"
            />
            {errores.email && <p className="mt-1 text-xs text-red-600">{errores.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoComplete="current-password"
            />
            {errores.password && <p className="mt-1 text-xs text-red-600">{errores.password}</p>}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-indigo-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
