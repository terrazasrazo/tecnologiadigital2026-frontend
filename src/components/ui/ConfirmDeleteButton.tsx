import { useState } from 'react';
import Button from './Button';
import { ClientApiError, deleteJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

interface Props {
  /** Endpoint propio que reenvía el DELETE al backend, p. ej. `/api/talks/5`. */
  url: string;
  /** Texto de la confirmación. */
  confirmText: string;
  /** Etiqueta del botón (por defecto, "Eliminar"). */
  label?: string;
  /** A dónde ir tras eliminar (por defecto, recargar la página). */
  redirect?: string;
}

/** Botón de eliminación con confirmación y manejo de errores. */
export default function ConfirmDeleteButton({
  url,
  confirmText,
  label = 'Eliminar',
  redirect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(confirmText)) return;
    setLoading(true);
    setError(null);
    try {
      await deleteJson(url);
      if (redirect) window.location.assign(redirect);
      else window.location.reload();
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="danger" size="sm" loading={loading} onClick={handleClick}>
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
