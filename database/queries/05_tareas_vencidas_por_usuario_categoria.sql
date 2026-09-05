-- =============================================================================
-- 05. Tareas vencidas por usuario/categoría y promedio de días vencidos
-- =============================================================================
-- Definición:
--   Una tarea está vencida cuando fecha_vencimiento < fecha local actual del
--   usuario (según usuarios.timezone, siguiendo la regla de negocio de la
--   sección "Fechas y timezone" de la especificación) y completada = false.
--   Se agrupa por usuario y categoría, contando tareas vencidas y el
--   promedio de días de atraso.
--
-- Ventana temporal:
--   Estado actual (a la fecha/hora de ejecución de la consulta).
--
-- Denominador:
--   No aplica porcentaje; son conteos y promedios sobre el subconjunto de
--   tareas vencidas.
--
-- Columnas de salida:
--   usuario_id              -- UUID del usuario
--   usuario                 -- nombre del usuario
--   categoria               -- nombre de categoría o 'Sin categoría'
--   tareas_vencidas          -- cantidad de tareas vencidas
--   promedio_dias_vencidos   -- promedio de (fecha local actual - fecha_vencimiento)
--
-- Ejemplo esperado (con datos de seed):
--   usuario         | categoria | tareas_vencidas | promedio_dias_vencidos
--   Usuario Demo 3  | Trabajo   | 4               | 12.50
-- =============================================================================

SELECT
    u.id                                 AS usuario_id,
    u.nombre                             AS usuario,
    coalesce(c.nombre, 'Sin categoría')  AS categoria,
    count(*)                             AS tareas_vencidas,
    round(avg((now() AT TIME ZONE u.timezone)::date - t.fecha_vencimiento), 2) AS promedio_dias_vencidos
FROM tareas t
JOIN usuarios u ON u.id = t.usuario_id
LEFT JOIN categorias c ON c.id = t.categoria_id
WHERE t.completada = false
  AND t.fecha_vencimiento IS NOT NULL
  AND t.fecha_vencimiento < (now() AT TIME ZONE u.timezone)::date
  AND u.eliminado_en IS NULL
GROUP BY u.id, u.nombre, c.nombre
ORDER BY tareas_vencidas DESC;
