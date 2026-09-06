import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { validarEmail, validarNombre, validarPassword } from '../utils/validation';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { IconButton } from '../components/ui/IconButton';

export default function RegisterPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; email?: string; password?: string }>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nuevosErrores = {
      nombre: validarNombre(nombre) ?? undefined,
      email: validarEmail(email) ?? undefined,
      password: validarPassword(password) ?? undefined,
    };
    setErrores(nuevosErrores);
    if (nuevosErrores.nombre || nuevosErrores.email || nuevosErrores.password) return;

    setEnviando(true);
    setErrorServidor(null);
    try {
      await registrar(nombre, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorServidor(err instanceof ApiError ? err.message : 'No se pudo completar el registro.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">Crear cuenta</h1>
      <p className="mt-1 text-sm text-ink-2">Empieza a organizar tus tareas en minutos.</p>

      {errorServidor && (
        <div className="mt-4 flex items-start gap-2 rounded-field border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{errorServidor}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Nombre" htmlFor="nombre" error={errores.nombre}>
          <Input icon={User} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
        </Field>

        <Field label="Email" htmlFor="email" error={errores.email}>
          <Input
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="password"
          error={errores.password}
          hint={errores.password ? undefined : 'Mínimo 8 caracteres, con letras y números.'}
        >
          <Input
            type={mostrarPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            trailing={
              <IconButton
                icon={mostrarPassword ? EyeOff : Eye}
                size="sm"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setMostrarPassword((v) => !v)}
              />
            }
          />
        </Field>

        <Button type="submit" loading={enviando} className="mt-2 h-10! w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
