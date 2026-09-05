import { createApp } from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logging/logger';
import { pool } from './shared/database/pool';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`Tarelli backend escuchando en el puerto ${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string) {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
