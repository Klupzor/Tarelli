-- 0001_create_usuarios.sql
-- Usuarios de la aplicación. Soft delete vía eliminado_en.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(254) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    ultimo_login_en TIMESTAMPTZ NULL,
    timezone        VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    eliminado_en    TIMESTAMPTZ NULL
);

-- El email debe ser único entre usuarios activos (no eliminados), normalizado a minúsculas
-- por la capa de aplicación antes de insertar/consultar.
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email_activos
    ON usuarios (email)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS ix_usuarios_eliminado_en ON usuarios (eliminado_en);
