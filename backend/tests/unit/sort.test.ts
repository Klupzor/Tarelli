import { buildOrderBy } from '../../src/shared/utils/sort';
import { AppError } from '../../src/shared/errors/AppError';

const COLUMN_MAP = { creado_en: 't.creado_en', titulo: 't.titulo' };
const FALLBACK = { columna: 't.creado_en', direccion: 'DESC' as const };

describe('buildOrderBy', () => {
  it('usa el fallback cuando no se especifica ordenar/direccion', () => {
    expect(buildOrderBy(COLUMN_MAP, undefined, undefined, FALLBACK)).toBe('t.creado_en DESC');
  });

  it('mapea una columna válida de la whitelist', () => {
    expect(buildOrderBy(COLUMN_MAP, 'titulo', 'asc', FALLBACK)).toBe('t.titulo ASC');
  });

  it('rechaza una columna fuera de la whitelist (posible SQL injection)', () => {
    expect(() => buildOrderBy(COLUMN_MAP, 'password_hash; DROP TABLE usuarios;', undefined, FALLBACK)).toThrow(
      AppError,
    );
  });

  it('rechaza una dirección inválida', () => {
    expect(() => buildOrderBy(COLUMN_MAP, 'titulo', 'sideways', FALLBACK)).toThrow(AppError);
  });
});
