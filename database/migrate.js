#!/usr/bin/env node
/**
 * Migration runner minimalista para Tarelli.
 *
 * Aplica, en orden alfabético, todos los archivos .sql de ./migrations que no
 * consten aún en la tabla schema_migrations. Cada migración se ejecuta dentro
 * de su propia transacción: si falla, se revierte y el proceso termina con
 * código de salida distinto de cero (útil en CI / entrypoint de Docker).
 *
 * Uso: node migrate.js
 * Variables de entorno: DATABASE_URL (obligatoria)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[migrate] Falta la variable de entorno DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    VARCHAR(255) PRIMARY KEY,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows.map(
        (r) => r.filename,
      ),
    );

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] Aplicando ${file} ...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        appliedCount += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] Error aplicando ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('[migrate] Nada que aplicar, la base de datos está al día.');
    } else {
      console.log(`[migrate] ${appliedCount} migración(es) aplicada(s).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] Falló la migración:', err);
  process.exit(1);
});
