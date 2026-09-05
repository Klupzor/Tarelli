#!/usr/bin/env node
/**
 * Ejecuta cada script de database/queries/*.sql contra DATABASE_URL y muestra
 * los resultados. Útil para verificar manualmente las 10 consultas de BI.
 *
 * Uso: node run-analytics.js [nombre_parcial_del_archivo]
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const QUERIES_DIR = path.join(__dirname, 'queries');

async function main() {
  const filter = process.argv[2];
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[analytics] Falta DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const files = fs
      .readdirSync(QUERIES_DIR)
      .filter((f) => f.endsWith('.sql'))
      .filter((f) => !filter || f.includes(filter))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(QUERIES_DIR, file), 'utf8');
      console.log(`\n=== ${file} ===`);
      const start = Date.now();
      const { rows } = await client.query(sql);
      const ms = Date.now() - start;
      console.log(`(${rows.length} filas, ${ms}ms)`);
      console.table(rows.slice(0, 10));
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[analytics] Error:', err);
  process.exit(1);
});
