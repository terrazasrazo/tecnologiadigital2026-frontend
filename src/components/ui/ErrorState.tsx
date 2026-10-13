import type { ReactNode } from 'react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Código del error de la API (ej. `TALK_NOT_FOUND`). */
  code?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

/** Mensaje de error reutilizable con reintento opcional. */
export default function ErrorState({
  title = 'Algo salió mal',
  description,
  code,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-red-800">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-red-700">{description ?? 'Inténtalo de nuevo.'}</p>
      {code && <p className="mt-2 font-mono text-xs text-red-500">{code}</p>}
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
