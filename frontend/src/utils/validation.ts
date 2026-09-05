export function validarEmail(email: string): string | null {
  if (!email.trim()) return 'El email es obligatorio.';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'El email no tiene un formato válido.';
  return null;
}

export function validarPassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número.';
  return null;
}

export function validarNombre(nombre: string): string | null {
  if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
  return null;
}

export function validarTitulo(titulo: string): string | null {
  if (!titulo.trim()) return 'El título es obligatorio.';
  if (titulo.length > 200) return 'El título no puede superar 200 caracteres.';
  return null;
}
