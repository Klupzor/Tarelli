import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** Límite general para toda la API (defensa adicional; AWS WAF cubre el perímetro en producción). */
export const generalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes, intente más tarde.',
      details: {},
    },
  },
});

/** Límite estricto para endpoints de autenticación (fuerza bruta / credential stuffing). */
export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos de autenticación, intente más tarde.',
      details: {},
    },
  },
});
