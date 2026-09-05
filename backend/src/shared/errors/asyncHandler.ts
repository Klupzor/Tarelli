import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Envuelve un handler async para reenviar cualquier rechazo a next(err). */
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
