import { z } from 'zod';

const PRIORIDADES = ['baja', 'media', 'alta'] as const;
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const idParamSchema = z.object({
  id: z.string().uuid('El identificador no tiene un formato válido.'),
});

export const crearTareaSchema = z.object({
  titulo: z.string({ required_error: 'El título es obligatorio.' }).trim().min(1).max(200),
  descripcion: z.string().trim().max(5000).optional().default(''),
  prioridad: z.enum(PRIORIDADES).optional().default('media'),
  categoria_id: z.string().uuid().nullable().optional().default(null),
  fecha_vencimiento: z
    .string()
    .regex(fechaRegex, 'fecha_vencimiento debe tener formato YYYY-MM-DD.')
    .nullable()
    .optional()
    .default(null),
  etiquetas: z.array(z.string().uuid()).optional().default([]),
});
export type CrearTareaInput = z.infer<typeof crearTareaSchema>;

// PUT es actualización completa: se exigen todos los campos editables.
export const actualizarTareaSchema = z.object({
  titulo: z.string({ required_error: 'El título es obligatorio.' }).trim().min(1).max(200),
  descripcion: z.string().trim().max(5000).default(''),
  prioridad: z.enum(PRIORIDADES),
  categoria_id: z.string().uuid().nullable(),
  fecha_vencimiento: z.string().regex(fechaRegex).nullable(),
  etiquetas: z.array(z.string().uuid()),
});
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;

export const completarSchema = z.object({
  completada: z.boolean({ required_error: 'completada es obligatorio.' }),
});

export const listarTareasQuerySchema = z.object({
  completada: z.enum(['true', 'false']).optional(),
  categoria: z.string().uuid().optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  fecha_vencimiento: z.string().regex(fechaRegex).optional(),
  fecha_vencimiento_desde: z.string().regex(fechaRegex).optional(),
  fecha_vencimiento_hasta: z.string().regex(fechaRegex).optional(),
  busqueda: z.string().trim().min(1).max(200).optional(),
  etiquetas: z.string().optional(), // CSV de UUIDs, semántica AND
  ordenar: z.string().optional(),
  direccion: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListarTareasQuery = z.infer<typeof listarTareasQuerySchema>;
