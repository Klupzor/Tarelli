import {
  BookOpen,
  Briefcase,
  Compass,
  Gem,
  Layers,
  Leaf,
  Rocket,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ColorCategoria {
  fondo: string;
  borde: string;
  texto: string;
  /** Clase `bg-*` a color completo (no derivable de `texto`: Tailwind necesita el literal). */
  punto: string;
  icono: LucideIcon;
}

/**
 * Paleta rotativa: cada categoría recibe siempre el mismo color e ícono
 * (hash determinístico por id), para que el usuario la reconozca de un
 * vistazo en el grid de tarjetas sin depender de un campo de color real
 * en el modelo de datos (categorías solo tienen `nombre`).
 */
const PALETA: ColorCategoria[] = [
  { fondo: 'bg-cat-amber-soft', borde: 'border-cat-amber-line', texto: 'text-cat-amber', punto: 'bg-cat-amber', icono: Sparkles },
  { fondo: 'bg-cat-blue-soft', borde: 'border-cat-blue-line', texto: 'text-cat-blue', punto: 'bg-cat-blue', icono: Compass },
  { fondo: 'bg-cat-green-soft', borde: 'border-cat-green-line', texto: 'text-cat-green', punto: 'bg-cat-green', icono: Leaf },
  { fondo: 'bg-cat-purple-soft', borde: 'border-cat-purple-line', texto: 'text-cat-purple', punto: 'bg-cat-purple', icono: Gem },
  { fondo: 'bg-cat-pink-soft', borde: 'border-cat-pink-line', texto: 'text-cat-pink', punto: 'bg-cat-pink', icono: BookOpen },
  { fondo: 'bg-cat-teal-soft', borde: 'border-cat-teal-line', texto: 'text-cat-teal', punto: 'bg-cat-teal', icono: Layers },
  { fondo: 'bg-cat-red-soft', borde: 'border-cat-red-line', texto: 'text-cat-red', punto: 'bg-cat-red', icono: Rocket },
  { fondo: 'bg-cat-slate-soft', borde: 'border-cat-slate-line', texto: 'text-cat-slate', punto: 'bg-cat-slate', icono: Shield },
];

const SIN_CATEGORIA: ColorCategoria = {
  fondo: 'bg-surface-2',
  borde: 'border-line',
  texto: 'text-ink-3',
  punto: 'bg-ink-3',
  icono: Briefcase,
};

function hashCadena(valor: string): number {
  let hash = 0;
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash * 31 + valor.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function obtenerColorCategoria(categoriaId: string | null): ColorCategoria {
  if (!categoriaId) return SIN_CATEGORIA;
  return PALETA[hashCadena(categoriaId) % PALETA.length];
}
