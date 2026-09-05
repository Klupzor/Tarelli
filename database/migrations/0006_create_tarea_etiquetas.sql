-- 0006_create_tarea_etiquetas.sql
-- Relación N:M entre tareas y etiquetas. Ambas deben pertenecer al mismo usuario;
-- eso se valida en la capa de aplicación (no es expresable como FK simple).

CREATE TABLE IF NOT EXISTS tarea_etiquetas (
    tarea_id    UUID NOT NULL REFERENCES tareas (id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas (id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, etiqueta_id)
);

-- La PK ya indexa (tarea_id, etiqueta_id); se agrega el índice inverso para
-- resolver "tareas que tienen la etiqueta X" y el filtro AND de múltiples etiquetas.
CREATE INDEX IF NOT EXISTS ix_tarea_etiquetas_etiqueta_id ON tarea_etiquetas (etiqueta_id);
