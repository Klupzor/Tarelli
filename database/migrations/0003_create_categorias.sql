-- 0003_create_categorias.sql
-- Categorías: propias de cada usuario. Nombre único por usuario.

CREATE TABLE IF NOT EXISTS categorias (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id     UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    nombre         VARCHAR(100) NOT NULL,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_categorias_usuario_nombre UNIQUE (usuario_id, nombre)
);

CREATE INDEX IF NOT EXISTS ix_categorias_usuario_id ON categorias (usuario_id);
