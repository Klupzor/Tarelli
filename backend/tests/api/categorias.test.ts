import request from 'supertest';
import { app } from '../helpers/testApp';
import { truncateAll } from '../helpers/db';
import { crearCategoria, crearTarea, crearUsuarioDePrueba } from '../helpers/factories';

beforeEach(async () => {
  await truncateAll();
});

describe('Categorías CRUD + ownership', () => {
  it('crea, lista, actualiza y elimina una categoría propia', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const auth = { Authorization: `Bearer ${usuario.accessToken}` };

    const creada = await crearCategoria(app, usuario.accessToken, 'Trabajo');
    expect(creada.nombre).toBe('Trabajo');

    const listado = await request(app).get('/api/categorias').set(auth);
    expect(listado.body.data).toHaveLength(1);

    const actualizada = await request(app)
      .put(`/api/categorias/${creada.id}`)
      .set(auth)
      .send({ nombre: 'Trabajo actualizado' });
    expect(actualizada.status).toBe(200);
    expect(actualizada.body.data.nombre).toBe('Trabajo actualizado');

    const eliminar = await request(app).delete(`/api/categorias/${creada.id}`).set(auth);
    expect(eliminar.status).toBe(204);
  });

  it('rechaza nombres de categoría duplicados para el mismo usuario (409)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    await crearCategoria(app, usuario.accessToken, 'Trabajo');
    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ nombre: 'Trabajo' });
    expect(res.status).toBe(409);
  });

  it('permite el mismo nombre de categoría para usuarios distintos', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);
    await crearCategoria(app, usuarioA.accessToken, 'Trabajo');
    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${usuarioB.accessToken}`)
      .send({ nombre: 'Trabajo' });
    expect(res.status).toBe(201);
  });

  it('no permite ver, editar ni eliminar categorías de otro usuario (404, no 403, para no filtrar existencia)', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);
    const categoriaDeA = await crearCategoria(app, usuarioA.accessToken, 'Privada de A');
    const authB = { Authorization: `Bearer ${usuarioB.accessToken}` };

    const listadoB = await request(app).get('/api/categorias').set(authB);
    expect(listadoB.body.data).toHaveLength(0);

    const actualizar = await request(app)
      .put(`/api/categorias/${categoriaDeA.id}`)
      .set(authB)
      .send({ nombre: 'Hackeada' });
    expect(actualizar.status).toBe(404);

    const eliminar = await request(app).delete(`/api/categorias/${categoriaDeA.id}`).set(authB);
    expect(eliminar.status).toBe(404);
  });

  it('al eliminar una categoría, las tareas quedan con categoria_id = null (no se eliminan)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const categoria = await crearCategoria(app, usuario.accessToken, 'Temporal');
    const tarea = await crearTarea(app, usuario.accessToken, { categoria_id: categoria.id });

    await request(app)
      .delete(`/api/categorias/${categoria.id}`)
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .expect(204);

    const listado = await request(app)
      .get('/api/tareas')
      .set('Authorization', `Bearer ${usuario.accessToken}`);
    const tareaActualizada = listado.body.data.find((t: { id: string }) => t.id === tarea.id);
    expect(tareaActualizada).toBeDefined();
    expect(tareaActualizada.categoria_id).toBeNull();
  });
});
