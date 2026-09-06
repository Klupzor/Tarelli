interface TablaDatosProps {
  caption: string;
  columnas: string[];
  filas: (string | number)[][];
}

/** Alternativa accesible obligatoria a cada gráfica (§5.8.3 de frontend-features.md). */
export function TablaDatos({ caption, columnas, filas }: TablaDatosProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-ink-2">
            {columnas.map((c) => (
              <th key={c} scope="col" className="py-1.5 pr-4 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {fila.map((valor, j) => (
                <td key={j} className={`py-1.5 pr-4 text-ink ${typeof valor === 'number' ? 'tabular' : ''}`}>
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
