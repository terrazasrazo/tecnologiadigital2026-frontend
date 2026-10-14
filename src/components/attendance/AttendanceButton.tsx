import { useState } from 'react';
import Button from '../ui/Button';
import { ClientApiError, deleteJson, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

interface Props {
  talkId: number;
  /** true = ya inscrito (muestra "Cancelar"); false = disponible (muestra "Inscribirme"). */
  registered: boolean;
  /** Ponencia cancelada: el botón queda deshabilitado. */
  talkCancelled?: boolean;
}

/** Botón de inscripción/cancelación en una ponencia. */
export default function AttendanceButton({ talkId, registered, talkCancelled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (talkCancelled) {
    return (
      <span className="text-sm font-medium text-slate-400">Ponencia cancelada</span>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      if (registered) {
        await deleteJson(`/api/attendance/talks/${talkId}/register`);
      } else {
        await postJson(`/api/attendance/talks/${talkId}/register`);
      }
      // SSR: recargar para que el servidor repinte listas y estados.
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={registered ? 'secondary' : 'primary'}
        loading={loading}
        onClick={handleClick}
        className="w-full sm:w-auto"
      >
        {registered ? 'Cancelar inscripción' : 'Inscribirme'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
