import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import type { Registration } from '../../lib/types';

interface Props {
  talkId: number;
}

/**
 * Check-in manual por el organizador (`POST /api/attendance/talks/:id/attendance`):
 * marca al usuario como asistido por su id, creando la inscripción si no existe.
 */
export default function ManualCheckIn({ talkId }: Props) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d+$/.test(userId.trim())) {
      setError('Ingresa un id de usuario numérico.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const reg = await postJson<Registration>(`/api/attendance/talks/${talkId}/attendance`, {
        userId: Number(userId.trim()),
        attended: true,
      });
      setResult(reg);
      setUserId('');
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-900">Check-in manual</p>
      <p className="text-xs text-slate-500">
        Para quien no pudo escanear el QR: marca al asistente por su id de usuario. Si aún no
        estaba inscrito, se crea la inscripción y se registra la asistencia.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Input
            label="Id de usuario"
            type="number"
            min={1}
            required
            value={userId}
            placeholder="101"
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" loading={loading}>
          Registrar asistencia
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {result && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Asistencia registrada para el usuario #{result.userId} (inscripción #{result.id}, estado
          “{result.status}”).
        </div>
      )}
    </form>
  );
}
