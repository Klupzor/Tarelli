import type { Categoria, Etiqueta, Prioridad, TareasFiltro } from '../types';

interface Props {
  filtro: TareasFiltro;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  busquedaInput: string;
  onBusquedaChange: (valor: string) => void;
  onChange: (filtro: TareasFiltro) => void;
}

export function FiltersBar({ filtro, categorias, etiquetas, busquedaInput, onBusquedaChange, onChange }: Props) {
  function toggleEtiqueta(id: string) {
    const actuales = filtro.etiquetas ?? [];
    const nuevas = actuales.includes(id) ? actuales.filter((e) => e !== id) : [...actuales, id];
    onChange({ ...filtro, etiquetas: nuevas.length ? nuevas : undefined, page: 1 });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={busquedaInput}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por título o descripción..."
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />

        <select
          value={filtro.completada === undefined ? '' : String(filtro.completada)}
          onChange={(e) =>
            onChange({
              ...filtro,
              completada: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            })
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Completadas</option>
        </select>

        <select
          value={filtro.prioridad ?? ''}
          onChange={(e) =>
            onChange({ ...filtro, prioridad: (e.target.value || undefined) as Prioridad | undefined, page: 1 })
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Cualquier prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <select
          value={filtro.categoria ?? ''}
          onChange={(e) => onChange({ ...filtro, categoria: e.target.value || undefined, page: 1 })}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Cualquier categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={`${filtro.ordenar ?? 'creado_en'}:${filtro.direccion ?? 'desc'}`}
          onChange={(e) => {
            const [ordenar, direccion] = e.target.value.split(':') as [TareasFiltro['ordenar'], 'asc' | 'desc'];
            onChange({ ...filtro, ordenar, direccion, page: 1 });
          }}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="creado_en:desc">Más recientes</option>
          <option value="creado_en:asc">Más antiguas</option>
          <option value="fecha_vencimiento:asc">Vencimiento próximo</option>
          <option value="prioridad:desc">Prioridad (Z-A)</option>
          <option value="titulo:asc">Título (A-Z)</option>
        </select>
      </div>

      {etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {etiquetas.map((etq) => {
            const activa = (filtro.etiquetas ?? []).includes(etq.id);
            return (
              <button
                key={etq.id}
                type="button"
                onClick={() => toggleEtiqueta(etq.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  activa ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{etq.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
