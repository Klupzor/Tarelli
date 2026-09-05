-- 0009_schema_migrations.sql
-- Tabla de control de migraciones aplicadas (usada por database/migrate.js).
-- Se crea explícitamente aquí por completitud del esquema versionado; el runner
-- también la crea de forma idempotente si no existe antes de aplicar migraciones.

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
