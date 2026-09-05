import request from 'supertest';
import { app } from '../helpers/testApp';
import { truncateAll } from '../helpers/db';
import { crearUsuarioDePrueba, extraerCookie, extraerValorCookie } from '../helpers/factories';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/auth/registro', () => {
  it('registra un usuario y devuelve accessToken + cookies de sesión', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Ana',
      email: 'ana@test.dev',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.usuario.email).toBe('ana@test.dev');
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.usuario.password).toBeUndefined();
    expect(res.body.data.usuario.passwordHash).toBeUndefined();

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('tarelli_refresh='))).toBe(true);
    expect(setCookie.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('rechaza un email duplicado con 409 CONFLICT', async () => {
    await crearUsuarioDePrueba(app, { email: 'dup@test.dev' });
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Otro',
      email: 'dup@test.dev',
      password: 'Password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('valida datos de entrada (422 VALIDATION_ERROR)', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'A',
      email: 'no-es-un-email',
      password: '123',
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('inicia sesión con credenciales válidas', async () => {
    await crearUsuarioDePrueba(app, { email: 'login@test.dev', password: 'Password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.dev', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rechaza contraseña incorrecta sin filtrar si el email existe', async () => {
    await crearUsuarioDePrueba(app, { email: 'login2@test.dev', password: 'Password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@test.dev', password: 'incorrecta' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rechaza un email inexistente con el mismo código de error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-existe@test.dev', password: 'Password123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/perfil', () => {
  it('requiere autenticación', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('devuelve el perfil del usuario autenticado', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${usuario.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.usuario.id).toBe(usuario.usuarioId);
  });

  it('rechaza un token manipulado', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${usuario.accessToken}x`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh y rotación', () => {
  it('exige el token CSRF de doble envío', async () => {
    const usuario = await crearUsuarioDePrueba(app);
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', usuario.cookie)
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(403);
  });

  it('rota el refresh token y emite un nuevo access token', async () => {
    const registro = await request(app).post('/api/auth/registro').send({
      nombre: 'Rotacion',
      email: 'rotacion@test.dev',
      password: 'Password123',
    });
    const cookieHeader = registro.headers['set-cookie'] as unknown as string[];
    const csrf = extraerValorCookie(cookieHeader, 'tarelli_csrf');
    const cookieStr = extraerCookie(cookieHeader);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieStr)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf!);

    expect(refreshRes.status).toBe(200);
    // Nota: el access token puede coincidir byte a byte si ambos se firman dentro
    // del mismo segundo (payload mínimo sub/iat/exp, HMAC determinístico) — eso
    // no es un problema de seguridad. Lo que sí debe rotar siempre es el refresh
    // token/cookie, verificado a continuación.
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));

    const nuevaCookie = refreshRes.headers['set-cookie'] as unknown as string[];
    expect(nuevaCookie.some((c) => c.startsWith('tarelli_refresh='))).toBe(true);
    expect(extraerCookie(nuevaCookie)).not.toBe(cookieStr); // el refresh token sí rota siempre
  });

  it('detecta reutilización de un refresh token ya rotado e invalida la sesión', async () => {
    const registro = await request(app).post('/api/auth/registro').send({
      nombre: 'Reuso',
      email: 'reuso@test.dev',
      password: 'Password123',
    });
    const cookieHeader = registro.headers['set-cookie'] as unknown as string[];
    const csrf = extraerValorCookie(cookieHeader, 'tarelli_csrf');
    const cookieOriginal = extraerCookie(cookieHeader);

    // Primera rotación: válida.
    const primeraRotacion = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieOriginal)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf!);
    expect(primeraRotacion.status).toBe(200);

    const nuevaCookieHeader = primeraRotacion.headers['set-cookie'] as unknown as string[];
    const nuevoCsrf = extraerValorCookie(nuevaCookieHeader, 'tarelli_csrf');

    // Reutilizar el token viejo (ya revocado) debe fallar...
    const reutilizacion = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieOriginal)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf!);
    expect(reutilizacion.status).toBe(401);

    // ...y además debe haber invalidado también la cadena nueva (toda la sesión del usuario).
    const intentoConTokenNuevo = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', extraerCookie(nuevaCookieHeader))
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', nuevoCsrf!);
    expect(intentoConTokenNuevo.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca la sesión y evita refrescar después', async () => {
    const registro = await request(app).post('/api/auth/registro').send({
      nombre: 'Logout',
      email: 'logout@test.dev',
      password: 'Password123',
    });
    const cookieHeader = registro.headers['set-cookie'] as unknown as string[];
    const csrf = extraerValorCookie(cookieHeader, 'tarelli_csrf');
    const cookieStr = extraerCookie(cookieHeader);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieStr)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf!);
    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieStr)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrf!);
    expect(refreshRes.status).toBe(401);
  });
});
