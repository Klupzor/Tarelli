import request from 'supertest';
import { app } from '../helpers/testApp';
import { pool, withTransaction } from '../../src/shared/database/pool';
import { truncateAll } from '../helpers/db';
import { crearEtiqueta, crearUsuarioDePrueba } from '../helpers/factories';

beforeEach(async () => {
  await truncateAll();
});

describe('withTransaction (helper transaccional compartido)', () => {
  it('revierte todos los cambios si el callback lanza una excepción', async () => {
    const usuario = await crearUsuarioDePrueba(app);

    await expect(
      withTransaction(async (client) => {
        await client.query(`INSERT INTO categorias (usuario_id, nombre) VALUES ($1, $2)`, [
          usuario.usuarioId,
          'No debería persistir',
        ]);
        throw new Error('fallo simulado a mitad de la transacción');
      }),
    ).rejects.toThrow('fallo simulado');

    const { rows } = await pool.query('SELECT * FROM categorias WHERE usuario_id = $1', [
      usuario.usuarioId,
    ]);
    expect(rows).toHaveLength(0);
  });

  it('confirma todos los cambios si el callback resuelve exitosamente', async () => {
    const usuario = await crearUsuarioDePrueba(app);

    await withTransaction(async (client) => {
      await client.query(`INSERT INTO categorias (usuario_id, nombre) VALUES ($1, $2)`, [
        usuario.usuarioId,
        'Sí persiste',
      ]);
    });

    const { rows } = await pool.query('SELECT * FROM categorias WHERE usuario_id = $1', [
      usuario.usuarioId,
    ]);
    expect(rows).toHaveLength(1);
  });
});

describe('Creación de tarea: atomicidad tarea + etiquetas + activity_log', () => {
  it('inserta la tarea, sus relaciones de etiquetas y el log de actividad en la misma operación', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const etiqueta = await crearEtiqueta(app, usuario.accessToken, 'importante');

    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ titulo: 'Tarea transaccional', etiquetas: [etiqueta.id] });

    expect(res.status).toBe(201);
    const tareaId = res.body.data.id;

    const { rows: relaciones } = await pool.query(
      'SELECT * FROM tarea_etiquetas WHERE tarea_id = $1',
      [tareaId],
    );
    expect(relaciones).toHaveLength(1);

    const { rows: logs } = await pool.query(
      `SELECT * FROM activity_logs WHERE tarea_id = $1 AND tipo_actividad = 'TASK_CREATED'`,
      [tareaId],
    );
    expect(logs).toHaveLength(1);
  });
});

describe('Rotación de refresh tokens: atomicidad', () => {
  it('revoca el token viejo y crea el nuevo en la misma transacción', async () => {
    const registro = await request(app).post('/api/auth/registro').send({
      nombre: 'Tx Refresh',
      email: 'tx-refresh@test.dev',
      password: 'Password123',
    });
    const setCookie = registro.headers['set-cookie'] as unknown as string[];
    const csrf = setCookie
      .find((c) => c.startsWith('tarelli_csrf='))!
      .split(';')[0]
      .split('=')[1];
    const cookieStr = setCookie.map((c) => c.split(';')[0]).join('; ');

    const { rows: antes } = await pool.query('SELECT * FROM refresh_tokens');
    expect(antes).toHaveLength(1);
    expect(antes[0].revocado_en).toBeNull();

    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieStr)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf)
      .expect(200);

    const { rows: despues } = await pool.query(
      'SELECT * FROM refresh_tokens ORDER BY creado_en ASC',
    );
    expect(despues).toHaveLength(2);
    expect(despues[0].revocado_en).not.toBeNull();
    expect(despues[0].reemplazado_por).toBe(despues[1].id);
    expect(despues[1].revocado_en).toBeNull();
  });
});
