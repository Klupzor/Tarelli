-- =============================================================================
-- 01. Promedio de tareas por usuario: últimos 30 días vs 30 días anteriores
-- =============================================================================
-- Definición:
--   Promedio de tareas CREADAS por usuario en los últimos 30 días, comparado
--   contra el promedio de tareas creadas por usuario en el período de 30 días
--   inmediatamente anterior (días 31 a 60).
--
-- Ventana temporal:
--   Ventana A: [now() - 30 días, now()]
--   Ventana B: [now() - 60 días, now() - 30 días)
--
-- Denominador:
--   Número total de usuarios activos (usuarios.eliminado_en IS NULL), no solo
--   los usuarios que crearon tareas en la ventana — así el promedio refleja la
--   actividad real de la base de usuarios completa.
--
-- Columnas de salida:
--   tareas_ultimos_30                   -- total de tareas creadas en la ventana A
--   tareas_30_anteriores                -- total de tareas creadas en la ventana B
--   promedio_por_usuario_ultimos_30      -- tareas_ultimos_30 / usuarios activos
--   promedio_por_usuario_30_anteriores   -- tareas_30_anteriores / usuarios activos
--   variacion_absoluta                   -- diferencia entre ambos promedios
--
-- Ejemplo esperado (con datos de seed):
--   tareas_ultimos_30 | tareas_30_anteriores | promedio_por_usuario_ultimos_30 | ...
--   64                | 61                   | 5.33                            | ...
-- =============================================================================

WITH ventanas AS (
    SELECT
        count(*) FILTER (WHERE creado_en >= now() - interval '30 days')                                    AS tareas_ultimos_30,
        count(*) FILTER (WHERE creado_en >= now() - interval '60 days'
                            AND creado_en <  now() - interval '30 days')                                    AS tareas_30_anteriores
    FROM tareas
),
usuarios_activos AS (
    SELECT count(*) AS total FROM usuarios WHERE eliminado_en IS NULL
)
SELECT
    v.tareas_ultimos_30,
    v.tareas_30_anteriores,
    round(v.tareas_ultimos_30::numeric / NULLIF(u.total, 0), 2)      AS promedio_por_usuario_ultimos_30,
    round(v.tareas_30_anteriores::numeric / NULLIF(u.total, 0), 2)   AS promedio_por_usuario_30_anteriores,
    round(
        (v.tareas_ultimos_30::numeric / NULLIF(u.total, 0)) -
        (v.tareas_30_anteriores::numeric / NULLIF(u.total, 0)), 2
    ) AS variacion_absoluta
FROM ventanas v, usuarios_activos u;
