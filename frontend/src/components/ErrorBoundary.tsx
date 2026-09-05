import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-ink">Algo salió mal</h1>
            <p className="mt-1 max-w-md text-sm text-ink-2">
              Ocurrió un error inesperado en la aplicación. Intenta recargar la página; si el problema persiste,
              contacta al soporte.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
