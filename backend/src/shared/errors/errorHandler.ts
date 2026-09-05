import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import { logger } from '../logging/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `La ruta ${req.method} ${req.path} no existe.`,
      details: {},
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La solicitud contiene datos inválidos.',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, 'Error de aplicación (5xx)');
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? {},
      },
    });
    return;
  }

  // Error no controlado: nunca exponer el detalle técnico al cliente.
  logger.error({ err, path: req.path }, 'Error no controlado');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno. Intente nuevamente más tarde.',
      details: {},
    },
  });
};
