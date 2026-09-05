import { pool } from '../../shared/database/pool';

export interface CategoriaRow {
  id: string;
  usuario_id: string;
  nombre: string;
  creado_en: Date;
  actualizado_en: Date;
}

export async function listByUsuario(usuarioId: string): Promise<CategoriaRow[]> {
  const { rows } = await pool.query<CategoriaRow>(
    `SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nombre ASC`,
    [usuarioId],
  );
  return rows;
}

export async function findByIdAndUsuario(id: string, usuarioId: string): Promise<CategoriaRow | null> {
  const { rows } = await pool.query<CategoriaRow>(
    `SELECT * FROM categorias WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId],
  );
  return rows[0] ?? null;
}

export async function create(usuarioId: string, nombre: string): Promise<CategoriaRow> {
  const { rows } = await pool.query<CategoriaRow>(
    `INSERT INTO categorias (usuario_id, nombre) VALUES ($1, $2) RETURNING *`,
    [usuarioId, nombre],
  );
  return rows[0];
}

export async function update(id: string, usuarioId: string, nombre: string): Promise<CategoriaRow | null> {
  const { rows } = await pool.query<CategoriaRow>(
    `UPDATE categorias SET nombre = $3, actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2
     RETURNING *`,
    [id, usuarioId, nombre],
  );
  return rows[0] ?? null;
}

export async function remove(id: string, usuarioId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM categorias WHERE id = $1 AND usuario_id = $2`, [
    id,
    usuarioId,
  ]);
  return (result.rowCount ?? 0) > 0;
}
