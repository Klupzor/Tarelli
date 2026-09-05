-- =============================================================================
-- 03. Tasa de finalización por categoría y tiempo medio de finalización
-- =============================================================================
-- Definición:
--   Para cada categoría (las tareas sin categoría se agrupan como
--   'Sin categoría'), porcentaje de tareas completadas sobre el total de
--   tareas de esa categoría, y el tiempo medio en días entre creación y
--   finalización de las tareas completadas.
--
-- Ventana temporal:
--   Ninguna (histórico completo). No es una métrica de tendencia sino de
--   estado acumulado por categoría.
--
-- Denominador:
--   Total de tareas de la categoría (completadas + pendientes).
--
-- Columnas de salida:
--   categoria                    -- nombre de categoría o 'Sin categoría'
--   total_tareas                 -- total de tareas en la categoría
--   tareas_completadas           -- tareas completadas en la categoría
--   tasa_finalizacion_pct        -- tareas_completadas / total_tareas * 100
--   dias_promedio_finalizacion   -- avg(completado_en - creado_en) en días, solo completadas
--
-- Ejemplo esperado (con datos de seed):
--   categoria | total_tareas | tareas_completadas | tasa_finalizacion_pct | dias_promedio_finalizacion
--   Trabajo   | 120          | 78                 | 65.00                 | 6.42
-- =============================================================================

SELECT
    coalesce(c.nombre, 'Sin categoría') AS categoria,
    count(t.id)                                            AS total_tareas,
    count(t.id) FILTER (WHERE t.completada)                AS tareas_completadas,
    round(100.0 * count(t.id) FILTER (WHERE t.completada) / NULLIF(count(t.id), 0), 2) AS tasa_finalizacion_pct,
    round(
        avg(EXTRACT(EPOCH FROM (t.completado_en - t.creado_en)) / 86400.0)
            FILTER (WHERE t.completada),
        2
    ) AS dias_promedio_finalizacion
FROM tareas t
LEFT JOIN categorias c ON c.id = t.categoria_id
GROUP BY 1
ORDER BY tasa_finalizacion_pct DESC NULLS LAST;
