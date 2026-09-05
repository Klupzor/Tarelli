import { AppError } from '../errors/AppError';

/**
 * Construye una whitelist de columnas ordenables. Nunca debe interpolarse
 * directamente el valor del cliente en el SQL: se traduce a través de este
 * mapa, y cualquier valor fuera de la whitelist lanza VALIDATION_ERROR.
 */
export function buildOrderBy(
  columnMap: Record<string, string>,
  ordenar: string | undefined,
  direccion: string | undefined,
  fallback: { columna: string; direccion: 'ASC' | 'DESC' },
): string {
  let columna = fallback.columna;
  let dir: 'ASC' | 'DESC' = fallback.direccion;

  if (ordenar !== undefined) {
    const mapped = columnMap[ordenar];
    if (!mapped) {
      throw AppError.validation(`El campo de ordenamiento '${ordenar}' no es válido.`, {
        ordenar: `Valores permitidos: ${Object.keys(columnMap).join(', ')}`,
      });
    }
    columna = mapped;
  }

  if (direccion !== undefined) {
    const normalized = direccion.toLowerCase();
    if (normalized !== 'asc' && normalized !== 'desc') {
      throw AppError.validation(`La dirección de ordenamiento '${direccion}' no es válida.`, {
        direccion: "Valores permitidos: 'asc', 'desc'",
      });
    }
    dir = normalized.toUpperCase() as 'ASC' | 'DESC';
  }

  return `${columna} ${dir}`;
}
