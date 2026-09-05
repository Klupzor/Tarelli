import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth';
import { validate } from '../../shared/validation/validate';
import * as controller from './categorias.controller';
import { categoriaBodySchema, idParamSchema } from './categorias.validation';

export const categoriasRouter = Router();

categoriasRouter.use(requireAuth);

categoriasRouter.get('/', controller.listar);
categoriasRouter.post('/', validate({ body: categoriaBodySchema }), controller.crear);
categoriasRouter.put(
  '/:id',
  validate({ params: idParamSchema, body: categoriaBodySchema }),
  controller.actualizar,
);
categoriasRouter.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);
