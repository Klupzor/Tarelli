import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Middleware de validación con Zod. En caso de error, ZodError se propaga a
 * next() y errorHandler.ts lo traduce a { error: { code: 'VALIDATION_ERROR' } }.
 * Los valores parseados (con defaults/coerciones aplicadas) reemplazan a los
 * originales para que los controllers reciban datos ya normalizados.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as never;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as never;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
