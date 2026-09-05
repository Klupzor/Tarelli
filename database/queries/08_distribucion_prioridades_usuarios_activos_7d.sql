-- =============================================================================
-- 08. Distribución de prioridades entre usuarios activos en los últimos 7 días
-- =============================================================================
-- Definición:
--   Se considera "usuario activo" a quien generó al menos un evento en
--   activity_logs en los últimos 7 días. Sobre el conjunto total de tareas
--   (histórico completo) de esos usuarios activos, se calcula la
--   distribución porcentual por prioridad.
--
-- Ventana temporal:
--   Actividad: últimos 7 días (para determinar quién es "activo").
--   Tareas consideradas: todas las tareas históricas de esos usuarios.
--
-- Denominador:
--   Total de tareas de los usuarios activos (todas las prioridades).
--
-- Columnas de salida:
--   prioridad       -- baja | media | alta
--   total_tareas    -- cantidad de tareas con esa prioridad
--   pct_del_total   -- total_tareas / total de tareas de usuarios activos * 100
--
-- Ejemplo esperado (con datos de seed):
--   prioridad | total_tareas | pct_del_total
--   media     | 210          | 38.32
-- =============================================================================

WITH usuarios_activos AS (
    SELECT DISTINCT usuario_id
    FROM activity_logs
    WHERE creado_en >= now() - interval '7 days'
)
SELECT
    t.prioridad,
    count(*) AS total_tareas,
    round(100.0 * count(*) / sum(count(*)) OVER (), 2) AS pct_del_total
FROM tareas t
JOIN usuarios_activos ua ON ua.usuario_id = t.usuario_id
GROUP BY t.prioridad
ORDER BY total_tareas DESC;
