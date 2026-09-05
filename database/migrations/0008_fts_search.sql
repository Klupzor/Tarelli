-- 0008_fts_search.sql
-- Full-Text Search sobre título y descripción de las tareas, configuración 'spanish'.
-- Se usa una columna generada (tsvector) + índice GIN para que el planner la use
-- sin recalcular el vector en cada consulta.

ALTER TABLE tareas
    ADD COLUMN IF NOT EXISTS busqueda_tsv tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS ix_tareas_busqueda_tsv ON tareas USING GIN (busqueda_tsv);
