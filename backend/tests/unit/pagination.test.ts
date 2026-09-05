import { parsePagination } from '../../src/shared/utils/pagination';

describe('parsePagination', () => {
  it('aplica los defaults cuando no se envían page/limit', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('calcula el offset correctamente', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('limita el límite máximo a 100', () => {
    expect(parsePagination({ page: '1', limit: '500' }).limit).toBe(100);
  });

  it('ignora valores inválidos y usa el default', () => {
    expect(parsePagination({ page: '-5', limit: 'abc' })).toEqual({ page: 1, limit: 20, offset: 0 });
  });
});
