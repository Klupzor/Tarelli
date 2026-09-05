import { pool } from '../../src/shared/database/pool';

/** Limpia todas las tablas de negocio entre tests, preservando el esquema. */
export async function truncateAll(): Promise<void> {
  await pool.query(
    'TRUNCATE TABLE activity_logs, tarea_etiquetas, tareas, etiquetas, categorias, refresh_tokens, usuarios RESTART IDENTITY CASCADE;',
  );
}
