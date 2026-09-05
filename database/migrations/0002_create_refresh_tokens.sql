-- 0002_create_refresh_tokens.sql
-- Refresh tokens: nunca se guarda el token crudo, solo un hash. Soporta rotación y
-- detección de reutilización mediante la cadena reemplazado_por.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_en       TIMESTAMPTZ NOT NULL,
    revocado_en     TIMESTAMPTZ NULL,
    reemplazado_por UUID NULL REFERENCES refresh_tokens (id) ON DELETE SET NULL,
    ultimo_uso_en   TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_usuario_id ON refresh_tokens (usuario_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expira_en ON refresh_tokens (expira_en);
-- Acelera la búsqueda de tokens activos (no revocados) de un usuario.
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_usuario_activos
    ON refresh_tokens (usuario_id)
    WHERE revocado_en IS NULL;
