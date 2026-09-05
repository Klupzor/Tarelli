import { asyncHandler } from '../../shared/errors/asyncHandler';
import type { AuthenticatedRequest } from '../../shared/middleware/auth';
import { sendData } from '../../shared/utils/response';
import * as service from './categorias.service';

export const listar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const categorias = await service.listar(req.usuario!.id);
  sendData(res, 200, categorias);
});

export const crear = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const categoria = await service.crear(req.usuario!.id, req.body.nombre);
  sendData(res, 201, categoria);
});

export const actualizar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const categoria = await service.actualizar(req.params.id, req.usuario!.id, req.body.nombre);
  sendData(res, 200, categoria);
});

export const eliminar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await service.eliminar(req.params.id, req.usuario!.id);
  res.status(204).send();
});
