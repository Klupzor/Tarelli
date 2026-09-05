/**
 * Las categorías no tienen color en el modelo de datos: se deriva uno de forma
 * determinista a partir del `id` (nunca del `nombre`: renombrar una categoría
 * no debe cambiarle el color), para que sea estable entre recargas y sesiones.
 */
const PALETA = ['violeta', 'ambar', 'verde', 'rosa', 'cian', 'indigo'] as const;

export type ColorCategoria = (typeof PALETA)[number];

export function colorCategoria(id: string): ColorCategoria {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETA[Math.abs(hash) % PALETA.length];
}

/** Clase `bg-*` a color completo del punto de categoría (Tailwind necesita el literal). */
export const PUNTO_COLOR_CATEGORIA: Record<ColorCategoria, string> = {
  violeta: 'bg-cat-violeta-ink',
  ambar: 'bg-cat-ambar-ink',
  verde: 'bg-cat-verde-ink',
  rosa: 'bg-cat-rosa-ink',
  cian: 'bg-cat-cian-ink',
  indigo: 'bg-cat-indigo-ink',
};
