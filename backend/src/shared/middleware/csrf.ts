import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

const CSRF_HEADER = 'x-csrf-token';

/**
 * Defensa en profundidad contra CSRF para los únicos endpoints que se
 * autentican exclusivamente por cookie (refresh/logout): patrón de doble
 * envío. El resto de la API se autentica con Authorization: Bearer, que un
 * sitio malicioso no puede adjuntar automáticamente, así que no lo necesita.
 */
export function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(env.csrfCookieName, token, {
    httpOnly: false, // el frontend debe poder leerlo (document.cookie) para reenviarlo en el header
    secure: env.isProduction,
    sameSite: 'strict',
    // path '/' (a diferencia del refresh cookie): el navegador solo expone una
    // cookie a document.cookie cuando la página actual está bajo su `path`, y
    // el frontend SPA vive en '/', no en '/api/auth'. El refresh cookie sí
    // puede restringirse a '/api/auth' porque solo viaja en requests HTTP
    // hacia esa ruta, nunca se lee desde JS.
    path: '/',
  });
  return token;
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(env.csrfCookieName, { path: '/' });
}

export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.header(CSRF_HEADER);

  if (
    !cookieToken ||
    !headerToken ||
    cookieToken.length !== headerToken.length ||
    !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    next(AppError.forbidden('Token CSRF inválido o ausente.'));
    return;
  }
  next();
}

/**
 * Validación de Origin/Referer como defensa adicional para solicitudes que
 * mutan estado. Se aplica de forma global (sección 13 de la especificación).
 */
export function verifyOriginForMutations(req: Request, _res: Response, next: NextFunction): void {
  const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!mutatingMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.header('origin');
  if (!origin) {
    // Clientes sin navegador (curl, tests, server-to-server) no envían Origin.
    next();
    return;
  }

  if (!env.corsAllowedOrigins.includes(origin)) {
    next(AppError.forbidden('Origen no autorizado para esta operación.'));
    return;
  }
  next();
}
