import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { Categoria, Etiqueta, Prioridad, Tarea, TareaInput } from '../types';
import { validarTitulo } from '../utils/validation';
import { ApiError } from '../api/client';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';

interface Props {
  abierto: boolean;
  tareaInicial: Tarea | null;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCerrar: () => void;
  onGuardar: (input: TareaInput) => Promise<void>;
}

const PRIORIDADES: Prioridad[] = ['baja', 'media', 'alta'];

function inputVacio(): TareaInput {
  return {
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    categoria_id: null,
    fecha_vencimiento: null,
    etiquetas: [],
  };
}

export function TaskFormModal({ abierto, tareaInicial, categorias, etiquetas, onCerrar, onGuardar }: Props) {
  const [form, setForm] = useState<TareaInput>(inputVacio());
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setErrorTitulo(null);
    setErrorServidor(null);
    if (tareaInicial) {
      setForm({
        titulo: tareaInicial.titulo,
        descripcion: tareaInicial.descripcion,
        prioridad: tareaInicial.prioridad,
        categoria_id: tareaInicial.categoria_id,
        fecha_vencimiento: tareaInicial.fecha_vencimiento?.slice(0, 10) ?? null,
        etiquetas: tareaInicial.etiquetas.map((e) => e.id),
      });
    } else {
      setForm(inputVacio());
    }
  }, [abierto, tareaInicial]);

  function toggleEtiqueta(id: string) {
    setForm((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(id) ? prev.etiquetas.filter((e) => e !== id) : [...prev.etiquetas, id],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validarTitulo(form.titulo);
    setErrorTitulo(error);
    if (error) return;

    setGuardando(true);
    setErrorServidor(null);
    try {
      await onGuardar(form);
      onCerrar();
    } catch (err) {
      setErrorServidor(err instanceof ApiError ? err.message : 'No se pudo guardar la tarea.');
    } finally {
      setGuardando(false);
    }
  }

  function onKeyDownForm(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tareaInicial ? 'Editar tarea' : 'Nueva tarea'}
      size="lg"
      id="task-form-modal"
      titleId="task-form-title"
      focoInicialRef={tituloRef}
      footer={
        <>
          <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={() => formRef.current?.requestSubmit()} loading={guardando}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onKeyDown={onKeyDownForm}
        className="flex flex-col gap-4"
        noValidate
      >
        {errorServidor && (
          <div className="flex items-start gap-2 rounded-field border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{errorServidor}</p>
          </div>
        )}

        <Field label="Título" htmlFor="tarea-titulo" error={errorTitulo}>
          <Input ref={tituloRef} value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
        </Field>

        <Field label="Descripción" htmlFor="tarea-descripcion">
          <Textarea
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prioridad" htmlFor="tarea-prioridad">
            <Select
              value={form.prioridad}
              onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as Prioridad }))}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Vence" htmlFor="tarea-vence">
            <Input
              type="date"
              value={form.fecha_vencimiento ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, fecha_vencimiento: e.target.value || null }))}
            />
          </Field>
        </div>

        <Field label="Categoría" htmlFor="tarea-categoria">
          <Select
            value={form.categoria_id ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value || null }))}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>

        {etiquetas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Etiquetas</span>
            <div className="flex flex-wrap gap-1.5">
              {etiquetas.map((etq) => {
                const activa = form.etiquetas.includes(etq.id);
                return (
                  <button
                    key={etq.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => toggleEtiqueta(etq.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors duration-120 ${
                      activa
                        ? 'border-brand-line bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    {activa && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}#{etq.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
