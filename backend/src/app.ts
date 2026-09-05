import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import pinoHttp from 'pino-http';
import { env } from './shared/config/env';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';
import { logger } from './shared/logging/logger';
import { corsMiddleware, permissionsPolicy, securityHeaders } from './shared/middleware/security';
import { verifyOriginForMutations } from './shared/middleware/csrf';
import { generalRateLimiter } from './shared/middleware/rateLimit';
import { authRouter } from './modules/auth/auth.routes';
import { tareasRouter } from './modules/tareas/tareas.routes';
import { categoriasRouter } from './modules/categorias/categorias.routes';
import { etiquetasRouter } from './modules/etiquetas/etiquetas.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // detrás de ALB/WAF en producción

  app.use(securityHeaders);
  app.use(permissionsPolicy);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(verifyOriginForMutations);

  if (env.nodeEnv !== 'test') {
    app.use(
      pinoHttp({
        logger,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/health' },
      }),
    );
  }

  app.use(generalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok' }, meta: {} });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/tareas', tareasRouter);
  app.use('/api/categorias', categoriasRouter);
  app.use('/api/etiquetas', etiquetasRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
