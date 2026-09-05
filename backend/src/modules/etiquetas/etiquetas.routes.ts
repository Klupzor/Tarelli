import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth';
import { validate } from '../../shared/validation/validate';
import * as controller from './etiquetas.controller';
import { etiquetaBodySchema } from './etiquetas.validation';

export const etiquetasRouter = Router();

etiquetasRouter.use(requireAuth);

etiquetasRouter.get('/', controller.listar);
etiquetasRouter.post('/', validate({ body: etiquetaBodySchema }), controller.crear);
