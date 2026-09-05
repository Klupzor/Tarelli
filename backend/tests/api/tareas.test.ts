import request from 'supertest';
import { app } from '../helpers/testApp';
import { pool } from '../../src/shared/database/pool';
import { truncateAll } from '../helpers/db';
import { crearCategoria, crearEtiqueta, crearTarea, crearUsuarioDePrueba } from '../helpers/factories';

beforeEach(async () => {
  await truncateAll();
});

describe('Tareas: CRUD y validaciones', () => {
  it('crea una tarea con valores por defecto (prioridad media, sin categoría/etiquetas)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ titulo: 'Tarea simple' });

    expect(res.status).toBe(201);
    expect(res.body.data.prioridad).toBe('media');
    expect(res.body.data.completada).toBe(false);
    expect(res.body.data.etiquetas).toEqual([]);
  });

  it('rechaza título vacío (422)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ titulo: '' });
    expect(res.status).toBe(422);
  });

  it('rechaza una prioridad fuera del enum permitido', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ titulo: 'X', prioridad: 'urgentisima' });
    expect(res.status).toBe(422);
  });

  it('rechaza asociar una categoría inexistente o ajena', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ titulo: 'X', categoria_id: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(422);
  });

  it('PUT reemplaza completamente los campos editables y sincroniza etiquetas', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const etiquetaA = await crearEtiqueta(app, usuario.accessToken, 'a');
    const etiquetaB = await crearEtiqueta(app, usuario.accessToken, 'b');
    const tarea = await crearTarea(app, usuario.accessToken, { etiquetas: [etiquetaA.id] });

    const res = await request(app)
      .put(`/api/tareas/${tarea.id}`)
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({
        titulo: 'Actualizada',
        descripcion: 'Nueva desc',
        prioridad: 'alta',
        categoria_id: null,
        fecha_vencimiento: null,
        etiquetas: [etiquetaB.id],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe('Actualizada');
    expect(res.body.data.prioridad).toBe('alta');
    expect(res.body.data.etiquetas).toHaveLength(1);
    expect(res.body.data.etiquetas[0].id).toBe(etiquetaB.id);
  });

  it('DELETE hace hard delete y limpia activity_logs y tarea_etiquetas (transaccional)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const etiqueta = await crearEtiqueta(app, usuario.accessToken, 'x');
    const tarea = await crearTarea(app, usuario.accessToken, { etiquetas: [etiqueta.id] });

    await request(app)
      .delete(`/api/tareas/${tarea.id}`)
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .expect(204);

    const { rows: tareaRows } = await pool.query('SELECT * FROM tareas WHERE id = $1', [tarea.id]);
    expect(tareaRows).toHaveLength(0);

    const { rows: logRows } = await pool.query('SELECT * FROM activity_logs WHERE tarea_id = $1', [
      tarea.id,
    ]);
    expect(logRows).toHaveLength(0);

    const { rows: relRows } = await pool.query('SELECT * FROM tarea_etiquetas WHERE tarea_id = $1', [
      tarea.id,
    ]);
    expect(relRows).toHaveLength(0);

    // La etiqueta en sí (recurso independiente) sigue existiendo.
    const { rows: etiquetaRows } = await pool.query('SELECT * FROM etiquetas WHERE id = $1', [
      etiqueta.id,
    ]);
    expect(etiquetaRows).toHaveLength(1);
  });
});

describe('Tareas: completar/descompletar (idempotente)', () => {
  it('completar y volver a completar no duplica activity_logs', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const tarea = await crearTarea(app, usuario.accessToken);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };

    const primera = await request(app).patch(`/api/tareas/${tarea.id}/completar`).set(auth).send({
      completada: true,
    });
    expect(primera.status).toBe(200);
    expect(primera.body.data.completada).toBe(true);
    expect(primera.body.data.completado_en).not.toBeNull();

    const segunda = await request(app).patch(`/api/tareas/${tarea.id}/completar`).set(auth).send({
      completada: true,
    });
    expect(segunda.status).toBe(200);

    const { rows } = await pool.query(
      `SELECT * FROM activity_logs WHERE tarea_id = $1 AND tipo_actividad = 'TASK_COMPLETED'`,
      [tarea.id],
    );
    expect(rows).toHaveLength(1); // no se duplicó al repetir la misma operación

    const descompletar = await request(app).patch(`/api/tareas/${tarea.id}/completar`).set(auth).send({
      completada: false,
    });
    expect(descompletar.body.data.completada).toBe(false);
    expect(descompletar.body.data.completado_en).toBeNull();
  });
});

describe('Tareas: ownership entre usuarios', () => {
  it('un usuario no puede ver, actualizar, eliminar ni completar tareas de otro (404)', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);
    const tareaDeA = await crearTarea(app, usuarioA.accessToken, { titulo: 'Secreta de A' });
    const authB = { Authorization: `Bearer ${usuarioB.accessToken}` };

    const listadoB = await request(app).get('/api/tareas').set(authB);
    expect(listadoB.body.data).toHaveLength(0);

    await request(app)
      .put(`/api/tareas/${tareaDeA.id}`)
      .set(authB)
      .send({ titulo: 'Hackeada', descripcion: '', prioridad: 'baja', categoria_id: null, fecha_vencimiento: null, etiquetas: [] })
      .expect(404);

    await request(app).patch(`/api/tareas/${tareaDeA.id}/completar`).set(authB).send({ completada: true }).expect(404);

    await request(app).delete(`/api/tareas/${tareaDeA.id}`).set(authB).expect(404);

    // La tarea de A sigue intacta.
    const verificacion = await request(app)
      .get('/api/tareas')
      .set('Authorization', `Bearer ${usuarioA.accessToken}`);
    expect(verificacion.body.data).toHaveLength(1);
    expect(verificacion.body.data[0].titulo).toBe('Secreta de A');
  });

  it('nunca confía en un usuario_id enviado por el cliente', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);

    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuarioA.accessToken}`)
      .send({ titulo: 'Intento de suplantación', usuario_id: usuarioB.usuarioId });

    expect(res.status).toBe(201);
    expect(res.body.data.usuario_id).toBe(usuarioA.usuarioId);
  });
});

describe('Tareas: filtros, orden y paginación', () => {
  it('el filtro de etiquetas usa semántica AND (debe tener TODAS las etiquetas solicitadas)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };
    const urgente = await crearEtiqueta(app, usuario.accessToken, 'urgente');
    const cliente = await crearEtiqueta(app, usuario.accessToken, 'cliente');

    await crearTarea(app, usuario.accessToken, { titulo: 'Solo urgente', etiquetas: [urgente.id] });
    await crearTarea(app, usuario.accessToken, { titulo: 'Solo cliente', etiquetas: [cliente.id] });
    await crearTarea(app, usuario.accessToken, {
      titulo: 'Ambas',
      etiquetas: [urgente.id, cliente.id],
    });

    const res = await request(app)
      .get(`/api/tareas?etiquetas=${urgente.id},${cliente.id}`)
      .set(auth);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titulo).toBe('Ambas');
  });

  it('rechaza un campo de ordenamiento fuera de la whitelist', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .get('/api/tareas?ordenar=password_hash')
      .set('Authorization', `Bearer ${usuario.accessToken}`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza una dirección de ordenamiento inválida', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .get('/api/tareas?ordenar=titulo&direccion=hacia-arriba')
      .set('Authorization', `Bearer ${usuario.accessToken}`);
    expect(res.status).toBe(422);
  });

  it('pagina resultados con page/limit y expone meta.total/totalPages', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await crearTarea(app, usuario.accessToken, { titulo: `Tarea ${i}` });
    }

    const pagina1 = await request(app).get('/api/tareas?page=1&limit=10').set(auth);
    expect(pagina1.body.data).toHaveLength(10);
    expect(pagina1.body.meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });

    const pagina3 = await request(app).get('/api/tareas?page=3&limit=10').set(auth);
    expect(pagina3.body.data).toHaveLength(5);
  });

  it('filtra por completada, prioridad y categoría', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };
    const categoria = await crearCategoria(app, usuario.accessToken, 'Trabajo');

    const t1 = await crearTarea(app, usuario.accessToken, {
      titulo: 'Alta trabajo',
      prioridad: 'alta',
      categoria_id: categoria.id,
    });
    await crearTarea(app, usuario.accessToken, { titulo: 'Baja sin categoria', prioridad: 'baja' });
    await request(app).patch(`/api/tareas/${t1.id}/completar`).set(auth).send({ completada: true });

    const res = await request(app)
      .get(`/api/tareas?completada=true&prioridad=alta&categoria=${categoria.id}`)
      .set(auth);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(t1.id);
  });

  it('la búsqueda de texto completo (FTS) encuentra coincidencias en título/descripción', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };
    await crearTarea(app, usuario.accessToken, {
      titulo: 'Renovar contrato con proveedor',
      descripcion: 'Revisar cláusulas legales',
    });
    await crearTarea(app, usuario.accessToken, { titulo: 'Comprar café' });

    const res = await request(app).get('/api/tareas?busqueda=contrato').set(auth);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titulo).toContain('contrato');
  });
});
