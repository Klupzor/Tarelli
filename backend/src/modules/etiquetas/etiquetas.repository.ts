import { pool } from '../../shared/database/pool';

export interface EtiquetaRow {
  id: string;
  usuario_id: string;
  nombre: string;
  creado_en: Date;
}

export async function listByUsuario(usuarioId: string): Promise<EtiquetaRow[]> {
  const { rows } = await pool.query<EtiquetaRow>(
    `SELECT * FROM etiquetas WHERE usuario_id = $1 ORDER BY nombre ASC`,
    [usuarioId],
  );
  return rows;
}

export async function create(usuarioId: string, nombre: string): Promise<EtiquetaRow> {
  const { rows } = await pool.query<EtiquetaRow>(
    `INSERT INTO etiquetas (usuario_id, nombre) VALUES ($1, $2) RETURNING *`,
    [usuarioId, nombre],
  );
  return rows[0];
}

/** Devuelve solo las etiquetas que existen Y pertenecen al usuario (para validar ownership). */
export async function findByIdsAndUsuario(ids: string[], usuarioId: string): Promise<EtiquetaRow[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query<EtiquetaRow>(
    `SELECT * FROM etiquetas WHERE usuario_id = $1 AND id = ANY($2::uuid[])`,
    [usuarioId, ids],
  );
  return rows;
}
