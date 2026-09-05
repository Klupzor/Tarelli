import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmTone = 'danger' | 'brand';

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  tono?: ConfirmTone;
  onConfirmar: () => void;
  onCancelar: () => void;
  cargando?: boolean;
}

export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  tono = 'danger',
  onConfirmar,
  onCancelar,
  cargando = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCancelar}
      titulo={titulo}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant={tono === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirmar} loading={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2">{descripcion}</p>
    </Modal>
  );
}
