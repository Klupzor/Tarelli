import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth';
import { validate } from '../../shared/validation/validate';
import * as controller from './tareas.controller';
import {
  actualizarTareaSchema,
  completarSchema,
  crearTareaSchema,
  idParamSchema,
  listarTareasQuerySchema,
} from './tareas.validation';

export const tareasRouter = Router();

tareasRouter.use(requireAuth);

tareasRouter.get('/', validate({ query: listarTareasQuerySchema }), controller.listar);
tareasRouter.post('/', validate({ body: crearTareaSchema }), controller.crear);
tareasRouter.put(
  '/:id',
  validate({ params: idParamSchema, body: actualizarTareaSchema }),
  controller.actualizar,
);
tareasRouter.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);
tareasRouter.patch(
  '/:id/completar',
  validate({ params: idParamSchema, body: completarSchema }),
  controller.completar,
);
