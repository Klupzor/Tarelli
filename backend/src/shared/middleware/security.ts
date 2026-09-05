import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import { env } from '../config/env';

/**
 * CORS con allowlist estricta (sección 19/13 de la especificación). `credentials: true`
 * es necesario porque el refresh token viaja en una cookie HttpOnly.
 */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Sin cabecera Origin (curl, health checks, same-origin) -> permitir.
    if (!origin || env.corsAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por la política de CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

export const corsMiddleware = cors(corsOptions);

/**
 * Cabeceras de seguridad estrictas: HSTS, CSP, X-Content-Type-Options,
 * Referrer-Policy, protección contra framing y Permissions-Policy.
 * Es una API JSON pura, por lo que la CSP puede ser muy restrictiva.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' },
  crossOriginResourcePolicy: { policy: 'same-site' },
});

/** Permissions-Policy no tiene helper dedicado en helmet 8: se agrega manualmente. */
export function permissionsPolicy(_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  );
  next();
}
