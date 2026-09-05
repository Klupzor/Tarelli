import { z } from 'zod';

export const categoriaBodySchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(1, 'El nombre no puede estar vacío.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
});
export type CategoriaBody = z.infer<typeof categoriaBodySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('El identificador no tiene un formato válido.'),
});
