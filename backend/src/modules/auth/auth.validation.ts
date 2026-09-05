import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
  email: z
    .string({ required_error: 'El email es obligatorio.' })
    .trim()
    .toLowerCase()
    .email('El email no tiene un formato válido.')
    .max(254),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128)
    .regex(/[a-zA-Z]/, 'La contraseña debe incluir al menos una letra.')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.'),
});
export type RegistroInput = z.infer<typeof registroSchema>;

export const loginSchema = z.object({
  email: z.string({ required_error: 'El email es obligatorio.' }).trim().toLowerCase().email(),
  password: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
