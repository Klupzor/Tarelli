import { asyncHandler } from '../../shared/errors/asyncHandler';
import type { AuthenticatedRequest } from '../../shared/middleware/auth';
import { sendData } from '../../shared/utils/response';
import * as service from './etiquetas.service';

export const listar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const etiquetas = await service.listar(req.usuario!.id);
  sendData(res, 200, etiquetas);
});

export const crear = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const etiqueta = await service.crear(req.usuario!.id, req.body.nombre);
  sendData(res, 201, etiqueta);
});
