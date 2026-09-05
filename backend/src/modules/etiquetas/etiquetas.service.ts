import { AppError } from '../../shared/errors/AppError';
import * as repo from './etiquetas.repository';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export async function listar(usuarioId: string) {
  return repo.listByUsuario(usuarioId);
}

export async function crear(usuarioId: string, nombre: string) {
  try {
    return await repo.create(usuarioId, nombre);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict('Ya existe una etiqueta con ese nombre.');
    }
    throw err;
  }
}

/** Valida que TODOS los IDs de etiqueta pertenezcan al usuario autenticado. Usado por tareas. */
export async function verificarPertenecen(ids: string[], usuarioId: string): Promise<void> {
  if (ids.length === 0) return;
  const encontradas = await repo.findByIdsAndUsuario(ids, usuarioId);
  if (encontradas.length !== new Set(ids).size) {
    throw AppError.validation('Una o más etiquetas no existen o no le pertenecen.', {
      etiquetas: 'Inválidas',
    });
  }
}
