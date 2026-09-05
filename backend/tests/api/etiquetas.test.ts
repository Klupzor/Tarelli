import request from 'supertest';
import { app } from '../helpers/testApp';
import { truncateAll } from '../helpers/db';
import { crearEtiqueta, crearUsuarioDePrueba } from '../helpers/factories';

beforeEach(async () => {
  await truncateAll();
});

describe('Etiquetas', () => {
  it('crea y lista etiquetas propias', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    await crearEtiqueta(app, usuario.accessToken, 'urgente');
    const res = await request(app)
      .get('/api/etiquetas')
      .set('Authorization', `Bearer ${usuario.accessToken}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nombre).toBe('urgente');
  });

  it('rechaza nombres duplicados por usuario (409)', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    await crearEtiqueta(app, usuario.accessToken, 'urgente');
    const res = await request(app)
      .post('/api/etiquetas')
      .set('Authorization', `Bearer ${usuario.accessToken}`)
      .send({ nombre: 'urgente' });
    expect(res.status).toBe(409);
  });

  it('un usuario no ve las etiquetas de otro', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);
    await crearEtiqueta(app, usuarioA.accessToken, 'de-a');
    const res = await request(app)
      .get('/api/etiquetas')
      .set('Authorization', `Bearer ${usuarioB.accessToken}`);
    expect(res.body.data).toHaveLength(0);
  });

  it('rechaza asociar a una tarea una etiqueta de otro usuario', async () => {
    const usuarioA = await crearUsuarioDePrueba(app);
    const usuarioB = await crearUsuarioDePrueba(app);
    const etiquetaDeA = await crearEtiqueta(app, usuarioA.accessToken, 'de-a');

    const res = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${usuarioB.accessToken}`)
      .send({ titulo: 'Intento cruzado', etiquetas: [etiquetaDeA.id] });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
