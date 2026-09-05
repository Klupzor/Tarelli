-- 0007_create_activity_logs.sql
-- Historial funcional de una tarea (no es auditoría permanente ni observabilidad).
-- Se elimina en cascada junto con la tarea.

CREATE TABLE IF NOT EXISTS activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id        UUID NOT NULL REFERENCES tareas (id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    tipo_actividad  VARCHAR(20) NOT NULL
                        CONSTRAINT ck_activity_logs_tipo CHECK (
                            tipo_actividad IN (
                                'TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED',
                                'TASK_UNCOMPLETED', 'TASK_DELETED'
                            )
                        ),
    details         JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_activity_logs_tarea_id ON activity_logs (tarea_id);
CREATE INDEX IF NOT EXISTS ix_activity_logs_usuario_id ON activity_logs (usuario_id);
CREATE INDEX IF NOT EXISTS ix_activity_logs_creado_en ON activity_logs (creado_en);
