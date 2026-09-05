import { asyncHandler } from '../../shared/errors/asyncHandler';
import type { AuthenticatedRequest } from '../../shared/middleware/auth';
import { sendList, sendData } from '../../shared/utils/response';
import * as service from './tareas.service';
import type { ListarTareasQuery } from './tareas.validation';

export const listar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { rows, page, limit, total } = await service.listar(
    req.usuario!.id,
    req.query as unknown as ListarTareasQuery,
  );
  sendList(res, rows, { page, limit, total });
});

export const crear = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const tarea = await service.crear(req.usuario!.id, req.body);
  sendData(res, 201, tarea);
});

export const actualizar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const tarea = await service.actualizar(req.params.id, req.usuario!.id, req.body);
  sendData(res, 200, tarea);
});

export const eliminar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await service.eliminar(req.params.id, req.usuario!.id);
  res.status(204).send();
});

export const completar = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const tarea = await service.completar(req.params.id, req.usuario!.id, req.body.completada);
  sendData(res, 200, tarea);
});
