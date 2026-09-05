import {
  generateRefreshToken,
  parseRefreshCookie,
  secretMatchesHash,
  signAccessToken,
  verifyAccessToken,
} from '../../src/modules/auth/token.service';

describe('token.service', () => {
  it('firma y verifica un access token válido', () => {
    const token = signAccessToken('usuario-123');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('usuario-123');
  });

  it('rechaza un access token manipulado', () => {
    const token = signAccessToken('usuario-123');
    expect(() => verifyAccessToken(`${token}manipulado`)).toThrow();
  });

  it('genera un refresh token cuyo secreto valida contra su propio hash', () => {
    const refresh = generateRefreshToken();
    expect(secretMatchesHash(refresh.secret, refresh.secretHash)).toBe(true);
    expect(secretMatchesHash('secreto-incorrecto', refresh.secretHash)).toBe(false);
  });

  it('parsea correctamente el valor de la cookie id.secret', () => {
    const refresh = generateRefreshToken();
    const parsed = parseRefreshCookie(refresh.plaintext);
    expect(parsed).toEqual({ id: refresh.id, secret: refresh.secret });
  });

  it('devuelve null para cookies malformadas', () => {
    expect(parseRefreshCookie(undefined)).toBeNull();
    expect(parseRefreshCookie('sin-punto')).toBeNull();
    expect(parseRefreshCookie('.solo-secreto')).toBeNull();
  });
});
