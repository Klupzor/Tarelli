import pino from 'pino';
import { env } from '../config/env';

/**
 * Logger con redacción de campos sensibles. Nunca deben aparecer en logs:
 * passwords, hashes, JWT, refresh tokens, cookies ni cabeceras Authorization.
 */
export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.password_hash',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.token_hash',
      'req.body.password',
      'req.body.contrasena',
    ],
    censor: '[REDACTADO]',
  },
  transport: env.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
