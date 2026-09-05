import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth';
import { verifyCsrf } from '../../shared/middleware/csrf';
import { authRateLimiter } from '../../shared/middleware/rateLimit';
import { validate } from '../../shared/validation/validate';
import * as controller from './auth.controller';
import { loginSchema, registroSchema } from './auth.validation';

export const authRouter = Router();

authRouter.post(
  '/registro',
  authRateLimiter,
  validate({ body: registroSchema }),
  controller.registro,
);

authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), controller.login);

// refresh/logout se autentican solo por cookie -> exigen el token CSRF de doble envío.
authRouter.post('/refresh', authRateLimiter, verifyCsrf, controller.refresh);
authRouter.post('/logout', verifyCsrf, controller.logout);

authRouter.get('/perfil', requireAuth, controller.perfil);
