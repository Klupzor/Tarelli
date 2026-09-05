-- =============================================================================
-- 09. Creación y finalización mensual del último año
-- =============================================================================
-- Definición:
--   Serie mensual (12 meses, incluyendo el mes actual) con el total de tareas
--   creadas y el total de tareas completadas en cada mes. Los meses sin datos
--   se muestran con 0 en lugar de omitirse (generate_series garantiza la
--   serie completa).
--
-- Ventana temporal:
--   Últimos 12 meses calendario, desde date_trunc('month', now()) - 11 meses
--   hasta el mes actual.
--
-- Denominador:
--   No aplica (conteos absolutos por mes).
--
-- Columnas de salida:
--   mes                  -- primer día del mes (date)
--   tareas_creadas       -- tareas cuya creado_en cae en ese mes
--   tareas_completadas   -- tareas cuya completado_en cae en ese mes
--
-- Ejemplo esperado (con datos de seed):
--   mes         | tareas_creadas | tareas_completadas
--   2026-08-01  | 71             | 54
-- =============================================================================

WITH meses AS (
    SELECT generate_series(
        date_trunc('month', now()) - interval '11 months',
        date_trunc('month', now()),
        interval '1 month'
    )::date AS mes
),
creaciones AS (
    SELECT date_trunc('month', creado_en)::date AS mes, count(*) AS total
    FROM tareas
    GROUP BY 1
),
finalizaciones AS (
    SELECT date_trunc('month', completado_en)::date AS mes, count(*) AS total
    FROM tareas
    WHERE completada
    GROUP BY 1
)
SELECT
    m.mes,
    coalesce(c.total, 0) AS tareas_creadas,
    coalesce(f.total, 0) AS tareas_completadas
FROM meses m
LEFT JOIN creaciones c ON c.mes = m.mes
LEFT JOIN finalizaciones f ON f.mes = m.mes
ORDER BY m.mes;
