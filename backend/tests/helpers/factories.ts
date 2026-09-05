import type { Express } from 'express';
import request from 'supertest';

export interface UsuarioDePrueba {
  accessToken: string;
  cookie: string;
  usuarioId: string;
  email: string;
}

let contador = 0;

/** Registra un usuario nuevo vía la API real y devuelve sus credenciales de sesión. */
export async function crearUsuarioDePrueba(
  app: Express,
  overrides: Partial<{ nombre: string; email: string; password: string }> = {},
): Promise<UsuarioDePrueba> {
  contador += 1;
  const email = overrides.email ?? `usuario${contador}.${Date.now()}@test.dev`;
  const res = await request(app)
    .post('/api/auth/registro')
    .send({
      nombre: overrides.nombre ?? `Usuario Prueba ${contador}`,
      email,
      password: overrides.password ?? 'Password123',
    })
    .expect(201);

  const cookie = extraerCookie(res.headers['set-cookie']);

  return {
    accessToken: res.body.data.accessToken as string,
    cookie,
    usuarioId: res.body.data.usuario.id as string,
    email,
  };
}

export function extraerCookie(setCookieHeader: string[] | string | undefined): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
  return headers.map((c) => c.split(';')[0]).join('; ');
}

export function extraerValorCookie(setCookieHeader: string[] | string | undefined, nombre: string): string | undefined {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
  for (const raw of headers) {
    const [pair] = raw.split(';');
    const [key, value] = pair.split('=');
    if (key === nombre) return value;
  }
  return undefined;
}

export async function crearCategoria(app: Express, accessToken: string, nombre = 'Trabajo') {
  const res = await request(app)
    .post('/api/categorias')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ nombre })
    .expect(201);
  return res.body.data;
}

export async function crearEtiqueta(app: Express, accessToken: string, nombre = 'urgente') {
  const res = await request(app)
    .post('/api/etiquetas')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ nombre })
    .expect(201);
  return res.body.data;
}

export async function crearTarea(
  app: Express,
  accessToken: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/tareas')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ titulo: 'Tarea de prueba', ...overrides })
    .expect(201);
  return res.body.data;
}
