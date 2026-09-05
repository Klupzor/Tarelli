export function EstadoCargando({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {mensaje}
    </div>
  );
}

export function EstadoVacio({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
    </div>
  );
}

export function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-8 text-center">
      <p className="text-sm font-medium text-red-700">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="text-sm font-medium text-red-700 underline hover:text-red-900"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
