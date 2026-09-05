-- 0005_create_etiquetas.sql
-- Etiquetas: privadas por usuario, nombre único por usuario.

CREATE TABLE IF NOT EXISTS etiquetas (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    nombre     VARCHAR(50) NOT NULL,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_etiquetas_usuario_nombre UNIQUE (usuario_id, nombre)
);

CREATE INDEX IF NOT EXISTS ix_etiquetas_usuario_id ON etiquetas (usuario_id);
