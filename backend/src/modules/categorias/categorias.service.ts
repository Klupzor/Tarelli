import { AppError } from '../../shared/errors/AppError';
import * as repo from './categorias.repository';

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
      throw AppError.conflict('Ya existe una categoría con ese nombre.');
    }
    throw err;
  }
}

export async function actualizar(id: string, usuarioId: string, nombre: string) {
  try {
    const actualizada = await repo.update(id, usuarioId, nombre);
    if (!actualizada) {
      throw AppError.notFound('Categoría no encontrada.');
    }
    return actualizada;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict('Ya existe una categoría con ese nombre.');
    }
    throw err;
  }
}

export async function eliminar(id: string, usuarioId: string) {
  const eliminada = await repo.remove(id, usuarioId);
  if (!eliminada) {
    throw AppError.notFound('Categoría no encontrada.');
  }
}

/** Usado por el módulo de tareas para validar ownership antes de asociar una categoría. */
export async function verificarPertenece(id: string, usuarioId: string): Promise<void> {
  const categoria = await repo.findByIdAndUsuario(id, usuarioId);
  if (!categoria) {
    throw AppError.validation('La categoría indicada no existe o no le pertenece.', {
      categoria_id: 'Inválida',
    });
  }
}
