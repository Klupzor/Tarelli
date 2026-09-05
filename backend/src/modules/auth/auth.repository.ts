import type { PoolClient } from 'pg';
import { pool } from '../../shared/database/pool';

export interface RefreshTokenRow {
  id: string;
  usuario_id: string;
  token_hash: string;
  creado_en: Date;
  expira_en: Date;
  revocado_en: Date | null;
  reemplazado_por: string | null;
  ultimo_uso_en: Date | null;
}

type Queryable = Pick<PoolClient, 'query'>;

export async function insertRefreshToken(
  input: { id: string; usuarioId: string; secretHash: string; expiraEn: Date },
  db: Queryable = pool,
): Promise<void> {
  await db.query(
    `INSERT INTO refresh_tokens (id, usuario_id, token_hash, expira_en)
     VALUES ($1, $2, $3, $4)`,
    [input.id, input.usuarioId, input.secretHash, input.expiraEn],
  );
}

export async function findRefreshTokenById(
  id: string,
  db: Queryable = pool,
): Promise<RefreshTokenRow | null> {
  const { rows } = await db.query<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function revokeRefreshToken(
  id: string,
  reemplazadoPor: string | null,
  db: Queryable = pool,
): Promise<void> {
  await db.query(
    `UPDATE refresh_tokens
     SET revocado_en = now(), reemplazado_por = $2, ultimo_uso_en = now()
     WHERE id = $1`,
    [id, reemplazadoPor],
  );
}

/** Detección de reutilización: revoca toda la cadena de sesión del usuario. */
export async function revokeAllRefreshTokensForUser(
  usuarioId: string,
  db: Queryable = pool,
): Promise<void> {
  await db.query(
    `UPDATE refresh_tokens
     SET revocado_en = now()
     WHERE usuario_id = $1 AND revocado_en IS NULL`,
    [usuarioId],
  );
}
