-- =============================================================================
-- 04. Horas y días pico de creación y finalización de tareas
-- =============================================================================
-- Definición:
--   Distribución de eventos de creación y de finalización de tareas por día
--   de la semana y hora del día, para identificar los momentos de mayor
--   actividad ("picos").
--
-- Ventana temporal:
--   Histórico completo. (Puede acotarse agregando un WHERE sobre `momento` si
--   se desea limitar a un rango reciente.)
--
-- Denominador:
--   Total de eventos del mismo tipo (creación o finalización); pct_del_tipo
--   sirve para comparar franjas horarias sin importar el volumen absoluto.
--
-- Columnas de salida:
--   tipo          -- 'creacion' | 'finalizacion'
--   dia_semana    -- 0=domingo .. 6=sábado (EXTRACT(DOW))
--   hora          -- 0-23
--   eventos       -- cantidad de eventos en esa franja
--   pct_del_tipo  -- eventos / total de eventos de ese tipo * 100
--
-- Ejemplo esperado (con datos de seed):
--   tipo     | dia_semana | hora | eventos | pct_del_tipo
--   creacion | 2          | 14   | 37      | 4.34
-- =============================================================================

WITH eventos AS (
    SELECT 'creacion' AS tipo, creado_en AS momento FROM tareas
    UNION ALL
    SELECT 'finalizacion' AS tipo, completado_en AS momento FROM tareas WHERE completada
)
SELECT
    tipo,
    EXTRACT(DOW FROM momento)::int  AS dia_semana,
    EXTRACT(HOUR FROM momento)::int AS hora,
    count(*)                        AS eventos,
    round(100.0 * count(*) / sum(count(*)) OVER (PARTITION BY tipo), 2) AS pct_del_tipo
FROM eventos
GROUP BY tipo, dia_semana, hora
ORDER BY tipo, eventos DESC;
