import { useState } from 'react';
import Button from '../ui/Button';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import type { CheckinResponse } from '../../lib/types';

interface Props {
  talkId: number;
  token: string;
  /** Título de la ponencia, ya resuelto en el servidor. */
  talkTitle: string;
}

type State =
  | { kind: 'idle' }
  | { kind: 'success'; already: boolean }
  | { kind: 'error'; message: string; code?: string };

/**
 * Confirmación de asistencia a la que llega el enlace del QR.
 *
 * El enlace lo abre la cámara nativa del teléfono; aquí el asistente confirma
 * con un toque y se registra la asistencia con el usuario de su sesión.
 * Nada se registra por el simple hecho de abrir el enlace.
 */
export default function CheckInConfirm({ talkId, token, talkTitle }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setState({ kind: 'idle' });
    try {
      const res = await postJson<CheckinResponse>(`/api/attendance/talks/${talkId}/checkin`, {
        token,
      });
      setState({ kind: 'success', already: res.alreadyAttended });
    } catch (err) {
      setState({
        kind: 'error',
        message:
          err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
        code: err instanceof ClientApiError ? err.code : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === 'success') {
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6">
        <p className="text-lg font-semibold text-emerald-900">
          {state.already ? 'Asistencia ya registrada' : '¡Asistencia registrada!'}
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          {state.already
            ? `Ya habías registrado tu asistencia en "${talkTitle}".`
            : `Tu asistencia en "${talkTitle}" quedó registrada.`}
        </p>
        <a
          href="/app/checkin"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
        >
          Ver mis ponencias
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">Vas a registrar tu asistencia en</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{talkTitle}</p>

      {state.kind === 'error' && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{state.message}</p>
          {state.code && <p className="mt-1 font-mono text-xs text-red-500">{state.code}</p>}
        </div>
      )}

      <Button onClick={confirm} loading={busy} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
        {state.kind === 'error' ? 'Reintentar' : 'Confirmar asistencia'}
      </Button>
      <p className="mt-3 text-center text-xs text-slate-500">
        Solo se registra si confirmas. El enlace no registra nada por sí solo.
      </p>
    </div>
  );
}
