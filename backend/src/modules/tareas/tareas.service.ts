import { withTransaction } from '../../shared/database/pool';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { buildOrderBy } from '../../shared/utils/sort';
import * as categoriasService from '../categorias/categorias.service';
import * as etiquetasService from '../etiquetas/etiquetas.service';
import * as repo from './tareas.repository';
import type { TareaEditable, TareaRow } from './tareas.repository';
import type {
  ActualizarTareaInput,
  CrearTareaInput,
  ListarTareasQuery,
} from './tareas.validation';

const ORDER_COLUMN_MAP: Record<string, string> = {
  creado_en: 't.creado_en',
  fecha_vencimiento: 't.fecha_vencimiento',
  prioridad: 't.prioridad',
  titulo: 't.titulo',
};

async function validarCategoriaYEtiquetas(
  usuarioId: string,
  categoriaId: string | null,
  etiquetaIds: string[],
): Promise<void> {
  if (categoriaId) {
    await categoriasService.verificarPertenece(categoriaId, usuarioId);
  }
  if (etiquetaIds.length > 0) {
    await etiquetasService.verificarPertenecen(etiquetaIds, usuarioId);
  }
}

export async function listar(usuarioId: string, query: ListarTareasQuery) {
  const { page, limit, offset } = parsePagination(query as Record<string, unknown>);

  const orderBy = buildOrderBy(
    ORDER_COLUMN_MAP,
    query.ordenar,
    query.direccion,
    { columna: 't.creado_en', direccion: 'DESC' },
  );

  const { rows, total } = await repo.list(
    {
      usuarioId,
      completada: query.completada === undefined ? undefined : query.completada === 'true',
      categoriaId: query.categoria,
      prioridad: query.prioridad,
      fechaVencimiento: query.fecha_vencimiento,
      fechaVencimientoDesde: query.fecha_vencimiento_desde,
      fechaVencimientoHasta: query.fecha_vencimiento_hasta,
      busqueda: query.busqueda,
      etiquetaIds: query.etiquetas
        ? query.etiquetas
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    },
    orderBy,
    limit,
    offset,
  );

  return { rows, page, limit, total };
}

export async function obtener(id: string, usuarioId: string): Promise<TareaRow> {
  const tarea = await repo.findByIdAndUsuario(id, usuarioId);
  if (!tarea) {
    throw AppError.notFound('Tarea no encontrada.');
  }
  return tarea;
}

export async function crear(usuarioId: string, input: CrearTareaInput): Promise<TareaRow> {
  await validarCategoriaYEtiquetas(usuarioId, input.categoria_id, input.etiquetas);

  const tareaId = await withTransaction(async (client) => {
    const editable: TareaEditable = {
      titulo: input.titulo,
      descripcion: input.descripcion,
      prioridad: input.prioridad,
      categoriaId: input.categoria_id,
      fechaVencimiento: input.fecha_vencimiento,
    };
    const { id } = await repo.insert(usuarioId, editable, client);
    await repo.replaceEtiquetas(id, input.etiquetas, client);
    await repo.insertActivityLog(
      {
        tareaId: id,
        usuarioId,
        tipo: 'TASK_CREATED',
        details: { titulo: input.titulo, prioridad: input.prioridad },
      },
      client,
    );
    return id;
  });

  return obtener(tareaId, usuarioId);
}

export async function actualizar(
  id: string,
  usuarioId: string,
  input: ActualizarTareaInput,
): Promise<TareaRow> {
  await validarCategoriaYEtiquetas(usuarioId, input.categoria_id, input.etiquetas);

  await withTransaction(async (client) => {
    const actual = await repo.findByIdAndUsuario(id, usuarioId, client);
    if (!actual) {
      throw AppError.notFound('Tarea no encontrada.');
    }

    const cambios: Record<string, { anterior: unknown; nuevo: unknown }> = {};
    const compararSimple = (campo: string, anterior: unknown, nuevo: unknown) => {
      if (anterior !== nuevo) cambios[campo] = { anterior, nuevo };
    };

    compararSimple('titulo', actual.titulo, input.titulo);
    compararSimple('descripcion', actual.descripcion, input.descripcion);
    compararSimple('prioridad', actual.prioridad, input.prioridad);
    compararSimple('categoria_id', actual.categoria_id, input.categoria_id);
    compararSimple('fecha_vencimiento', actual.fecha_vencimiento, input.fecha_vencimiento);

    const etiquetasAnteriores = actual.etiquetas.map((e) => e.id).sort();
    const etiquetasNuevas = [...input.etiquetas].sort();
    if (JSON.stringify(etiquetasAnteriores) !== JSON.stringify(etiquetasNuevas)) {
      cambios.etiquetas = { anterior: etiquetasAnteriores, nuevo: etiquetasNuevas };
    }

    const editable: TareaEditable = {
      titulo: input.titulo,
      descripcion: input.descripcion,
      prioridad: input.prioridad,
      categoriaId: input.categoria_id,
      fechaVencimiento: input.fecha_vencimiento,
    };
    await repo.updateEditableFields(id, usuarioId, editable, client);
    await repo.replaceEtiquetas(id, input.etiquetas, client);

    if (Object.keys(cambios).length > 0) {
      await repo.insertActivityLog(
        { tareaId: id, usuarioId, tipo: 'TASK_UPDATED', details: { cambios } },
        client,
      );
    }
  });

  return obtener(id, usuarioId);
}

export async function completar(
  id: string,
  usuarioId: string,
  completada: boolean,
): Promise<TareaRow> {
  await withTransaction(async (client) => {
    const actual = await repo.findByIdAndUsuario(id, usuarioId, client);
    if (!actual) {
      throw AppError.notFound('Tarea no encontrada.');
    }

    // Idempotente: si ya está en el estado solicitado, no se registra actividad duplicada.
    if (actual.completada === completada) {
      return;
    }

    await repo.setCompletada(id, usuarioId, completada, client);
    await repo.insertActivityLog(
      {
        tareaId: id,
        usuarioId,
        tipo: completada ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
        details: { completada },
      },
      client,
    );
  });

  return obtener(id, usuarioId);
}

export async function eliminar(id: string, usuarioId: string): Promise<void> {
  // Hard delete: activity_logs y tarea_etiquetas se eliminan en cascada por FK.
  await withTransaction(async (client) => {
    const eliminada = await repo.remove(id, usuarioId, client);
    if (!eliminada) {
      throw AppError.notFound('Tarea no encontrada.');
    }
  });
}

export async function historial(id: string, usuarioId: string) {
  await obtener(id, usuarioId); // valida ownership / existencia
  return repo.listActivityLogs(id, usuarioId);
}
