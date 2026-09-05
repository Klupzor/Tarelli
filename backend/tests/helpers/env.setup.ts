// setupFiles (no setupFilesAfterEnv): se ejecuta antes de que Jest requiera
// cualquier módulo del código fuente, así que las variables quedan listas
// para cuando src/shared/config/env.ts se importe por primera vez.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://tarelli_app:devpass@localhost:5432/tarelli_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '30';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
