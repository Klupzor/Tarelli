-- =============================================================================
-- 02. Tasa diaria de finalización (últimos 90 días) por prioridad
-- =============================================================================
-- Definición:
--   Para cada día de creación dentro de los últimos 90 días y cada prioridad,
--   qué porcentaje de las tareas creadas ese día (cohorte por día de creación)
--   ha sido completado a la fecha de ejecución de la consulta.
--
-- Ventana temporal:
--   creado_en >= now() - 90 días. El estado "completada" se evalúa al momento
--   de ejecutar la consulta (no está acotado a los 90 días).
--
-- Denominador:
--   Tareas creadas ese día con esa prioridad (cohorte del día).
--
-- Columnas de salida:
--   dia                    -- fecha de creación (date)
--   prioridad              -- baja | media | alta
--   tareas_creadas         -- total de tareas creadas ese día con esa prioridad
--   tareas_completadas     -- de esas, cuántas están completadas hoy
--   tasa_finalizacion_pct  -- tareas_completadas / tareas_creadas * 100
--
-- Ejemplo esperado (con datos de seed):
--   dia         | prioridad | tareas_creadas | tareas_completadas | tasa_finalizacion_pct
--   2026-08-20  | alta      | 3              | 2                  | 66.67
-- =============================================================================

SELECT
    creado_en::date AS dia,
    prioridad,
    count(*)                                   AS tareas_creadas,
    count(*) FILTER (WHERE completada)         AS tareas_completadas,
    round(100.0 * count(*) FILTER (WHERE completada) / NULLIF(count(*), 0), 2) AS tasa_finalizacion_pct
FROM tareas
WHERE creado_en >= now() - interval '90 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
