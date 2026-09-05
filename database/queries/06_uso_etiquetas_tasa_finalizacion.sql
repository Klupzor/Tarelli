-- =============================================================================
-- 06. Uso de etiquetas y tasa de finalización
-- =============================================================================
-- Definición:
--   Para cada nombre de etiqueta (las etiquetas son privadas por usuario, por
--   lo que este reporte agrega por NOMBRE a través de todos los usuarios que
--   tengan una etiqueta con ese nombre), cuántas tareas la usan y qué
--   porcentaje de ellas están completadas.
--
-- Ventana temporal:
--   Histórico completo.
--
-- Denominador:
--   Tareas asociadas a esa etiqueta (a través de tarea_etiquetas).
--
-- Columnas de salida:
--   etiqueta               -- nombre de la etiqueta
--   usuarios_distintos      -- cantidad de usuarios distintos que tienen esa etiqueta
--   tareas_con_etiqueta      -- total de tareas asociadas
--   completadas              -- de esas, cuántas están completadas
--   tasa_finalizacion_pct    -- completadas / tareas_con_etiqueta * 100
--
-- Ejemplo esperado (con datos de seed):
--   etiqueta | usuarios_distintos | tareas_con_etiqueta | completadas | tasa_finalizacion_pct
--   urgente  | 9                  | 142                  | 91          | 64.08
-- =============================================================================

SELECT
    e.nombre                                      AS etiqueta,
    count(DISTINCT e.usuario_id)                  AS usuarios_distintos,
    count(t.id)                                   AS tareas_con_etiqueta,
    count(t.id) FILTER (WHERE t.completada)       AS completadas,
    round(100.0 * count(t.id) FILTER (WHERE t.completada) / NULLIF(count(t.id), 0), 2) AS tasa_finalizacion_pct
FROM etiquetas e
JOIN tarea_etiquetas te ON te.etiqueta_id = e.id
JOIN tareas t ON t.id = te.tarea_id
GROUP BY e.nombre
ORDER BY tareas_con_etiqueta DESC;
