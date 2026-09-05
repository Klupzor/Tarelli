import { z } from 'zod';

export const etiquetaBodySchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(1, 'El nombre no puede estar vacío.')
    .max(50, 'El nombre no puede superar 50 caracteres.'),
});
