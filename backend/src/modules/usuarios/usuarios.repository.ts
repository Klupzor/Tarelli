import { pool } from '../../shared/database/pool';

export interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  ultimo_login_en: Date | null;
  timezone: string;
  creado_en: Date;
  actualizado_en: Date;
  eliminado_en: Date | null;
}

export async function findByEmail(email: string): Promise<UsuarioRow | null> {
  const { rows } = await pool.query<UsuarioRow>(
    `SELECT * FROM usuarios WHERE email = $1 AND eliminado_en IS NULL`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<UsuarioRow | null> {
  const { rows } = await pool.query<UsuarioRow>(
    `SELECT * FROM usuarios WHERE id = $1 AND eliminado_en IS NULL`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createUsuario(input: {
  nombre: string;
  email: string;
  passwordHash: string;
}): Promise<UsuarioRow> {
  const { rows } = await pool.query<UsuarioRow>(
    `INSERT INTO usuarios (nombre, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.nombre, input.email, input.passwordHash],
  );
  return rows[0];
}

export async function updateUltimoLogin(id: string): Promise<void> {
  await pool.query(`UPDATE usuarios SET ultimo_login_en = now() WHERE id = $1`, [id]);
}
