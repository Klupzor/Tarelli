import type { ApiErrorPayload } from '../types';
import { getAccessToken, setAccessToken } from './tokenStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  readonly status: number;

  readonly code: string;

  readonly details: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Notificado cuando una sesión no puede renovarse: AuthContext lo usa para forzar logout. */
type SessionExpiredListener = () => void;
let onSessionExpired: SessionExpiredListener | null = null;
export function setOnSessionExpired(listener: SessionExpiredListener | null): void {
  onSessionExpired = listener;
}

// Único refresh concurrente: si varias requests reciben 401 al mismo tiempo,
// todas esperan la MISMA promesa en lugar de disparar refrescos en paralelo.
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const csrf = readCookie('tarelli_csrf');
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: csrf ? { 'X-CSRF-Token': csrf } : {},
        });
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const body = await res.json();
        setAccessToken(body.data.accessToken as string);
        return true;
      } catch {
        setAccessToken(null);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Evita el reintento automático tras 401 (usado por auth.refresh/logout mismos). */
  skipAuthRetry?: boolean;
  needsCsrf?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.needsCsrf) {
    const csrf = readCookie('tarelli_csrf');
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const errorPayload: ApiErrorPayload = payload?.error ?? {
      code: 'UNKNOWN_ERROR',
      message: 'Ocurrió un error inesperado.',
    };
    throw new ApiError(res.status, errorPayload);
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await doFetch(path, options);

  if (res.status === 401 && !options.skipAuthRetry) {
    const refreshed = await performRefresh();
    if (!refreshed) {
      onSessionExpired?.();
      return parseResponse<T>(res); // lanza el ApiError 401 original
    }
    return parseResponse<T>(await doFetch(path, options));
  }

  return parseResponse<T>(res);
}

export { performRefresh, readCookie };
