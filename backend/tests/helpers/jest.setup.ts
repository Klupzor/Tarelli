import { pool } from '../../src/shared/database/pool';

afterAll(async () => {
  await pool.end();
});
