import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-800">Algo salió mal</h1>
          <p className="max-w-md text-sm text-slate-600">
            Ocurrió un error inesperado en la aplicación. Intenta recargar la página; si el
            problema persiste, contacta al soporte.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
