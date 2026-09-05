import { apiRequest } from './client';
import type { Usuario } from '../types';

interface SesionResponse {
  data: { usuario: Usuario; accessToken: string };
  meta: Record<string, unknown>;
}

export function registrar(input: { nombre: string; email: string; password: string }) {
  return apiRequest<SesionResponse>('/auth/registro', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
  });
}

export function iniciarSesion(input: { email: string; password: string }) {
  return apiRequest<SesionResponse>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
  });
}

export function refrescar() {
  return apiRequest<SesionResponse>('/auth/refresh', {
    method: 'POST',
    skipAuthRetry: true,
    needsCsrf: true,
  });
}

export function cerrarSesion() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    skipAuthRetry: true,
    needsCsrf: true,
  });
}

export function obtenerPerfil() {
  return apiRequest<{ data: { usuario: Usuario }; meta: Record<string, unknown> }>('/auth/perfil');
}
