import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Jest globalSetup: corre UNA vez antes de toda la suite. Aplica las
 * migraciones sobre la base de datos de pruebas para que cada test file
 * arranque con el esquema al día.
 */
export default function globalSetup(): void {
  const databaseUrl =
    process.env.TEST_DATABASE_URL ?? 'postgres://tarelli_app:devpass@localhost:5432/tarelli_test';
  const migrateScript = path.join(__dirname, '../../../database/migrate.js');

  execFileSync('node', [migrateScript], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
