-- 0004_create_tareas.sql
-- Tareas: recurso central. Eliminación física (hard delete). Categoría opcional
-- (SET NULL al eliminar la categoría). Prioridad restringida a baja/media/alta.

CREATE TABLE IF NOT EXISTS tareas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id        UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    categoria_id      UUID NULL REFERENCES categorias (id) ON DELETE SET NULL,
    titulo            VARCHAR(200) NOT NULL,
    descripcion       TEXT NOT NULL DEFAULT '',
    prioridad         VARCHAR(10) NOT NULL DEFAULT 'media'
                          CONSTRAINT ck_tareas_prioridad CHECK (prioridad IN ('baja', 'media', 'alta')),
    completada        BOOLEAN NOT NULL DEFAULT false,
    fecha_vencimiento DATE NULL,
    completado_en     TIMESTAMPTZ NULL,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- completado_en debe ser coherente con completada.
    CONSTRAINT ck_tareas_completado_en CHECK (
        (completada = false AND completado_en IS NULL) OR
        (completada = true AND completado_en IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_tareas_usuario_id ON tareas (usuario_id);
CREATE INDEX IF NOT EXISTS ix_tareas_categoria_id ON tareas (categoria_id);
CREATE INDEX IF NOT EXISTS ix_tareas_creado_en ON tareas (creado_en);
CREATE INDEX IF NOT EXISTS ix_tareas_fecha_vencimiento ON tareas (fecha_vencimiento);
CREATE INDEX IF NOT EXISTS ix_tareas_prioridad ON tareas (prioridad);
CREATE INDEX IF NOT EXISTS ix_tareas_completada ON tareas (completada);
-- Índice compuesto: el filtro más frecuente es "mis tareas pendientes ordenadas".
CREATE INDEX IF NOT EXISTS ix_tareas_usuario_completada ON tareas (usuario_id, completada);
