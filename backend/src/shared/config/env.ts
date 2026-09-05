import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: int('PORT', 4000),

  databaseUrl: required('DATABASE_URL', 'postgres://tarelli_app:devpass@localhost:5432/tarelli'),

  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev_only_access_secret'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev_only_refresh_secret'),
  refreshTokenExpiresInDays: int('REFRESH_TOKEN_EXPIRES_IN_DAYS', 30),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'tarelli_refresh',
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? 'tarelli_csrf',

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  rateLimitWindowMs: int('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: int('RATE_LIMIT_MAX', 100),
  authRateLimitMax: int('AUTH_RATE_LIMIT_MAX', 10),
};
