import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { verifyAccessToken } from '../../modules/auth/token.service';

export interface AuthenticatedRequest extends Request {
  usuario?: { id: string };
}

/**
 * Exige un access token JWT válido en el header Authorization: Bearer <token>.
 * El usuario autenticado queda disponible en req.usuario.id para que cada
 * módulo filtre siempre por ownership.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(AppError.unauthorized('Falta el token de acceso.'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.usuario = { id: payload.sub };
    next();
  } catch {
    next(AppError.unauthorized('Token de acceso inválido o expirado.'));
  }
}
