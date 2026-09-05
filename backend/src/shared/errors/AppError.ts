export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

/**
 * Error de aplicación con código de negocio + status HTTP. El error handler
 * global lo serializa como { error: { code, message, details } } y nunca
 * expone detalles técnicos de errores no controlados (ver errorHandler.ts).
 */
export class AppError extends Error {
  readonly statusCode: number;

  readonly code: ErrorCode;

  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', message, 422, details);
  }

  static unauthorized(message = 'No autenticado.'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static invalidCredentials(message = 'Credenciales inválidas.'): AppError {
    return new AppError('INVALID_CREDENTIALS', message, 401);
  }

  static forbidden(message = 'No tiene permiso para acceder a este recurso.'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(message = 'Recurso no encontrado.'): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError('CONFLICT', message, 409, details);
  }

  static tooManyRequests(message = 'Demasiadas solicitudes, intente más tarde.'): AppError {
    return new AppError('TOO_MANY_REQUESTS', message, 429);
  }

  static internal(message = 'Error interno del servidor.'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500);
  }
}
