export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parsea page/limit desde query params con defaults y límites seguros.
 * page >= 1, 1 <= limit <= 100. Valores inválidos o ausentes caen al default
 * en lugar de producir un error, ya que son parámetros de conveniencia.
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : DEFAULT_PAGE;
  let limit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
}
