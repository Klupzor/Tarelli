-- =============================================================================
-- 10. Top 10% de usuarios por tasa de finalización y promedio de tareas simultáneas
-- =============================================================================
-- Definición:
--   Se calcula, por usuario, la tasa de finalización histórica (completadas /
--   total de tareas) y el promedio de tareas simultáneas abiertas durante los
--   últimos 90 días. El promedio de tareas simultáneas se estima como el
--   total de "tarea-días abiertos" dentro de la ventana (para cada tarea, el
--   solapamiento entre [creado_en, completado_en o ahora] y la ventana de 90
--   días) dividido entre 90 — equivalente a la concurrencia promedio (L de la
--   ley de Little). Finalmente se seleccionan los usuarios cuya tasa de
--   finalización está en el percentil 10 superior (percent_rank <= 0.10).
--
-- Ventana temporal:
--   Tasa de finalización: histórico completo.
--   Tareas simultáneas: últimos 90 días.
--
-- Denominador:
--   Tasa de finalización: total de tareas del usuario.
--   Tareas simultáneas: 90 días (tamaño de la ventana).
--
-- Columnas de salida:
--   usuario                        -- nombre del usuario
--   total_tareas                   -- total histórico de tareas del usuario
--   completadas                    -- tareas completadas del usuario
--   tasa_finalizacion_pct          -- completadas / total_tareas * 100
--   promedio_tareas_simultaneas    -- concurrencia promedio de tareas abiertas (90 días)
--
-- Ejemplo esperado (con datos de seed, ~12 usuarios ⇒ top 10% ≈ 1-2 filas):
--   usuario         | total_tareas | completadas | tasa_finalizacion_pct | promedio_tareas_simultaneas
--   Usuario Demo 7  | 61           | 52          | 85.25                 | 6.10
-- =============================================================================

WITH ventana AS (
    SELECT now() - interval '90 days' AS inicio, now() AS fin
),
tasa AS (
    SELECT
        t.usuario_id,
        count(*)                             AS total_tareas,
        count(*) FILTER (WHERE t.completada) AS completadas,
        round(100.0 * count(*) FILTER (WHERE t.completada) / NULLIF(count(*), 0), 2) AS tasa_finalizacion_pct
    FROM tareas t
    GROUP BY t.usuario_id
),
concurrencia AS (
    SELECT
        t.usuario_id,
        sum(
            EXTRACT(EPOCH FROM (
                LEAST(coalesce(t.completado_en, v.fin), v.fin) -
                GREATEST(t.creado_en, v.inicio)
            )) / 86400.0
        ) FILTER (WHERE t.creado_en < v.fin AND coalesce(t.completado_en, v.fin) > v.inicio) AS tarea_dias_abiertos
    FROM tareas t CROSS JOIN ventana v
    GROUP BY t.usuario_id
),
ranking AS (
    SELECT
        ta.usuario_id,
        ta.total_tareas,
        ta.completadas,
        ta.tasa_finalizacion_pct,
        round(coalesce(c.tarea_dias_abiertos, 0) / 90.0, 2) AS promedio_tareas_simultaneas,
        percent_rank() OVER (ORDER BY ta.tasa_finalizacion_pct DESC) AS percentil
    FROM tasa ta
    LEFT JOIN concurrencia c ON c.usuario_id = ta.usuario_id
)
SELECT
    u.nombre AS usuario,
    r.total_tareas,
    r.completadas,
    r.tasa_finalizacion_pct,
    r.promedio_tareas_simultaneas
FROM ranking r
JOIN usuarios u ON u.id = r.usuario_id
WHERE r.percentil <= 0.10
ORDER BY r.tasa_finalizacion_pct DESC;
