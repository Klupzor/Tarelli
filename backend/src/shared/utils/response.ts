import type { Response } from 'express';

export function sendData<T>(res: Response, status: number, data: T, meta: Record<string, unknown> = {}) {
  res.status(status).json({ data, meta });
}

export function sendList<T>(
  res: Response,
  items: T[],
  meta: { page: number; limit: number; total: number },
) {
  res.status(200).json({
    data: items,
    meta: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.limit > 0 ? Math.ceil(meta.total / meta.limit) : 0,
    },
  });
}
