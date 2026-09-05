import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // Errores en clientes ociosos del pool: no deben tumbar el proceso, solo registrarse.
  // eslint-disable-next-line no-console
  console.error('[db] Error inesperado en cliente inactivo del pool', err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

/**
 * Ejecuta `fn` dentro de una transacción. Si `fn` lanza, se hace ROLLBACK y se
 * relanza el error; si resuelve, se hace COMMIT. El cliente siempre se libera.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
