import { useState } from 'react';
import Button from '../ui/Button';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

/** Borra una URL vía DELETE (mismo patrón que postJson). */
async function deleteJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    throw new ClientApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ClientApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? 'Error', undefined);
  }
  return data;
}

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
