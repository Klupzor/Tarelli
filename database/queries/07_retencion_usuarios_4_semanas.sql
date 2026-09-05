-- =============================================================================
-- 07. Retención de usuarios a cuatro semanas
-- =============================================================================
-- Definición:
--   Se agrupan los usuarios en cohortes por la semana calendario en que se
--   registraron (date_trunc('week', usuarios.creado_en)). Un usuario se
--   considera "retenido en la semana 4" si generó al menos un evento en
--   activity_logs (creó, actualizó, completó o descompletó una tarea) entre
--   los días 21 y 27 (inclusive) después de su registro.
--
-- Ventana temporal:
--   Solo se incluyen cohortes cuya ventana de la semana 4 ya haya concluido
--   (creado_en <= now() - 28 días), para no penalizar cohortes demasiado
--   recientes que aún no pudieron ser medidas.
--
-- Denominador:
--   Número de usuarios en la cohorte (usuarios registrados esa semana).
--
-- Columnas de salida:
--   semana_cohorte              -- lunes de la semana de registro
--   usuarios_en_cohorte          -- tamaño de la cohorte
--   usuarios_retenidos_semana_4  -- cuántos tuvieron actividad en la semana 4
--   retencion_pct                -- usuarios_retenidos_semana_4 / usuarios_en_cohorte * 100
--
-- Ejemplo esperado (con datos de seed):
--   semana_cohorte | usuarios_en_cohorte | usuarios_retenidos_semana_4 | retencion_pct
--   2026-05-04     | 2                   | 2                           | 100.00
-- =============================================================================

WITH cohortes AS (
    SELECT
        id AS usuario_id,
        date_trunc('week', creado_en)::date AS semana_cohorte,
        creado_en
    FROM usuarios
    WHERE eliminado_en IS NULL
      AND creado_en <= now() - interval '28 days'
),
actividad_semana_4 AS (
    SELECT DISTINCT a.usuario_id
    FROM activity_logs a
    JOIN cohortes c ON c.usuario_id = a.usuario_id
    WHERE a.creado_en >= c.creado_en + interval '21 days'
      AND a.creado_en <  c.creado_en + interval '28 days'
)
SELECT
    c.semana_cohorte,
    count(DISTINCT c.usuario_id)                                            AS usuarios_en_cohorte,
    count(DISTINCT a4.usuario_id)                                           AS usuarios_retenidos_semana_4,
    round(100.0 * count(DISTINCT a4.usuario_id) / NULLIF(count(DISTINCT c.usuario_id), 0), 2) AS retencion_pct
FROM cohortes c
LEFT JOIN actividad_semana_4 a4 ON a4.usuario_id = c.usuario_id
GROUP BY c.semana_cohorte
ORDER BY c.semana_cohorte;
