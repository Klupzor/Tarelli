import type { Response } from 'express';
import { env } from '../../shared/config/env';
import { asyncHandler } from '../../shared/errors/asyncHandler';
import type { AuthenticatedRequest } from '../../shared/middleware/auth';
import { clearCsrfCookie, issueCsrfCookie } from '../../shared/middleware/csrf';
import { sendData } from '../../shared/utils/response';
import * as authService from './auth.service';
import type { SesionResultado } from './auth.service';

function setRefreshCookie(res: Response, sesion: SesionResultado): void {
  res.cookie(env.refreshCookieName, sesion.refreshTokenPlaintext, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    expires: sesion.refreshExpiraEn,
  });
  issueCsrfCookie(res);
}

function respuestaSesion(res: Response, status: number, sesion: SesionResultado): void {
  setRefreshCookie(res, sesion);
  sendData(res, status, {
    usuario: sesion.usuario,
    accessToken: sesion.accessToken,
  });
}

export const registro = asyncHandler(async (req, res) => {
  const sesion = await authService.registrar(req.body);
  respuestaSesion(res, 201, sesion);
});

export const login = asyncHandler(async (req, res) => {
  const sesion = await authService.iniciarSesion(req.body);
  respuestaSesion(res, 200, sesion);
});

export const refresh = asyncHandler(async (req, res) => {
  const cookieValue = req.cookies?.[env.refreshCookieName];
  const sesion = await authService.refrescarSesion(cookieValue);
  respuestaSesion(res, 200, sesion);
});

export const logout = asyncHandler(async (req, res) => {
  const cookieValue = req.cookies?.[env.refreshCookieName];
  await authService.cerrarSesion(cookieValue);
  res.clearCookie(env.refreshCookieName, { path: '/api/auth' });
  clearCsrfCookie(res);
  res.status(204).send();
});

export const perfil = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const usuario = await authService.obtenerPerfil(req.usuario!.id);
  sendData(res, 200, { usuario });
});
