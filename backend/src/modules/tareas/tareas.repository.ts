import type { PoolClient } from 'pg';
import { pool } from '../../shared/database/pool';

export interface EtiquetaResumen {
  id: string;
  nombre: string;
}

export interface TareaRow {
  id: string;
  usuario_id: string;
  categoria_id: string | null;
  categoria_nombre: string | null;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  completada: boolean;
  fecha_vencimiento: string | null;
  completado_en: Date | null;
  creado_en: Date;
  actualizado_en: Date;
  etiquetas: EtiquetaResumen[];
}

type Queryable = Pick<PoolClient, 'query'>;

const SELECT_BASE = `
  SELECT
    t.id, t.usuario_id, t.categoria_id, c.nombre AS categoria_nombre,
    t.titulo, t.descripcion, t.prioridad, t.completada,
    t.fecha_vencimiento, t.completado_en, t.creado_en, t.actualizado_en,
    COALESCE(
      (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre) ORDER BY e.nombre)
       FROM tarea_etiquetas te
       JOIN etiquetas e ON e.id = te.etiqueta_id
       WHERE te.tarea_id = t.id),
      '[]'::json
    ) AS etiquetas
  FROM tareas t
  LEFT JOIN categorias c ON c.id = t.categoria_id
`;

export interface ListFiltros {
  usuarioId: string;
  completada?: boolean;
  categoriaId?: string;
  prioridad?: string;
  fechaVencimiento?: string;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  busqueda?: string;
  etiquetaIds?: string[];
}

function buildWhere(filtros: ListFiltros): { clause: string; params: unknown[] } {
  const conditions: string[] = ['t.usuario_id = $1'];
  const params: unknown[] = [filtros.usuarioId];

  const push = (fragment: string, value: unknown) => {
    params.push(value);
    conditions.push(fragment.replace('?', `$${params.length}`));
  };

  if (filtros.completada !== undefined) push('t.completada = ?', filtros.completada);
  if (filtros.categoriaId) push('t.categoria_id = ?', filtros.categoriaId);
  if (filtros.prioridad) push('t.prioridad = ?', filtros.prioridad);
  if (filtros.fechaVencimiento) push('t.fecha_vencimiento = ?', filtros.fechaVencimiento);
  if (filtros.fechaVencimientoDesde) push('t.fecha_vencimiento >= ?', filtros.fechaVencimientoDesde);
  if (filtros.fechaVencimientoHasta) push('t.fecha_vencimiento <= ?', filtros.fechaVencimientoHasta);
  if (filtros.busqueda) push("t.busqueda_tsv @@ plainto_tsquery('spanish', ?)", filtros.busqueda);

  if (filtros.etiquetaIds && filtros.etiquetaIds.length > 0) {
    params.push(filtros.etiquetaIds);
    const etiquetasParamIndex = params.length;
    params.push(filtros.etiquetaIds.length);
    const countParamIndex = params.length;
    conditions.push(`
      t.id IN (
        SELECT te.tarea_id FROM tarea_etiquetas te
        WHERE te.etiqueta_id = ANY($${etiquetasParamIndex}::uuid[])
        GROUP BY te.tarea_id
        HAVING COUNT(DISTINCT te.etiqueta_id) = $${countParamIndex}
      )
    `);
  }

  return { clause: conditions.join(' AND '), params };
}

export async function list(
  filtros: ListFiltros,
  orderBy: string,
  limit: number,
  offset: number,
): Promise<{ rows: TareaRow[]; total: number }> {
  const { clause, params } = buildWhere(filtros);

  const countResult = await pool.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM tareas t WHERE ${clause}`,
    params,
  );
  const total = Number(countResult.rows[0]?.total ?? 0);

  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query<TareaRow>(
    `${SELECT_BASE} WHERE ${clause} ORDER BY ${orderBy} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams,
  );

  return { rows, total };
}

export async function findByIdAndUsuario(
  id: string,
  usuarioId: string,
  db: Queryable = pool,
): Promise<TareaRow | null> {
  const { rows } = await db.query<TareaRow>(`${SELECT_BASE} WHERE t.id = $1 AND t.usuario_id = $2`, [
    id,
    usuarioId,
  ]);
  return rows[0] ?? null;
}

export interface TareaEditable {
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  categoriaId: string | null;
  fechaVencimiento: string | null;
}

export async function insert(
  usuarioId: string,
  data: TareaEditable,
  db: Queryable,
): Promise<{ id: string }> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO tareas (usuario_id, categoria_id, titulo, descripcion, prioridad, fecha_vencimiento)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [usuarioId, data.categoriaId, data.titulo, data.descripcion, data.prioridad, data.fechaVencimiento],
  );
  return rows[0];
}

export async function updateEditableFields(
  id: string,
  usuarioId: string,
  data: TareaEditable,
  db: Queryable,
): Promise<void> {
  await db.query(
    `UPDATE tareas
     SET titulo = $3, descripcion = $4, prioridad = $5, categoria_id = $6,
         fecha_vencimiento = $7, actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId, data.titulo, data.descripcion, data.prioridad, data.categoriaId, data.fechaVencimiento],
  );
}

export async function replaceEtiquetas(tareaId: string, etiquetaIds: string[], db: Queryable): Promise<void> {
  await db.query(`DELETE FROM tarea_etiquetas WHERE tarea_id = $1`, [tareaId]);
  if (etiquetaIds.length === 0) return;
  const values = etiquetaIds.map((_, i) => `($1, $${i + 2})`).join(', ');
  await db.query(
    `INSERT INTO tarea_etiquetas (tarea_id, etiqueta_id) VALUES ${values} ON CONFLICT DO NOTHING`,
    [tareaId, ...etiquetaIds],
  );
}

export async function setCompletada(
  id: string,
  usuarioId: string,
  completada: boolean,
  db: Queryable,
): Promise<void> {
  await db.query(
    `UPDATE tareas
     SET completada = $3,
         completado_en = CASE WHEN $3 THEN now() ELSE NULL END,
         actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId, completada],
  );
}

export async function remove(id: string, usuarioId: string, db: Queryable): Promise<boolean> {
  const result = await db.query(`DELETE FROM tareas WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
  return (result.rowCount ?? 0) > 0;
}

export async function insertActivityLog(
  input: { tareaId: string; usuarioId: string; tipo: string; details: Record<string, unknown> },
  db: Queryable,
): Promise<void> {
  await db.query(
    `INSERT INTO activity_logs (tarea_id, usuario_id, tipo_actividad, details)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [input.tareaId, input.usuarioId, input.tipo, JSON.stringify(input.details)],
  );
}

export async function listActivityLogs(tareaId: string, usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT id, tipo_actividad, details, creado_en
     FROM activity_logs
     WHERE tarea_id = $1 AND usuario_id = $2
     ORDER BY creado_en DESC`,
    [tareaId, usuarioId],
  );
  return rows;
}
