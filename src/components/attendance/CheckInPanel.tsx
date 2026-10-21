import { useEffect, useState, type FormEvent } from 'react';
import AttendanceWindow from './AttendanceWindow';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import { parseQrContent } from '../../lib/utils';
import type { CheckinResponse } from '../../lib/types';

export interface CheckInTalk {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  opensAt: string;
  closesAt: string;
}

interface Props {
  /** Ponencias inscritas con su ventana de asistencia. */
  talks: CheckInTalk[];
}

type Result =
  | { kind: 'success'; talkTitle: string; already: boolean }
  | { kind: 'error'; message: string; code?: string };

/** Panel de check-in: ingreso manual + ventanas de asistencia. */
export default function CheckInPanel({ talks }: Props) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [attendedIds, setAttendedIds] = useState<number[]>([]);
  const [now, setNow] = useState(() => new Date());

  // Reloj para que el estado de las ventanas se mantenga fresco.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  async function submitToken(raw: string) {
    setBusy(true);
    setManualError(null);
    setResult(null);

    const parsed = parseQrContent(raw);
    if (!parsed) {
      setResult({
        kind: 'error',
        message: 'El contenido escaneado no es un código QR de asistencia válido.',
        code: 'INVALID_QR',
      });
      setBusy(false);
      return;
    }

    try {
      const res = await postJson<CheckinResponse>(
        `/api/attendance/talks/${parsed.talkId}/checkin`,
        { token: parsed.token },
      );
      const talk = talks.find((t) => t.id === parsed.talkId);
      const title = talk?.title ?? 'Ponencia';
      setResult({ kind: 'success', talkTitle: title, already: res.alreadyAttended });
      if (!res.alreadyAttended) {
        setAttendedIds((prev) => [...prev, parsed.talkId]);
      }
    } catch (err) {
      setResult({
        kind: 'error',
        message:
          err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
        code: err instanceof ClientApiError ? err.code : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  function handleManual(event: FormEvent) {
    event.preventDefault();
    if (!manual.trim()) {
      setManualError('Pega el contenido del QR.');
      return;
    }
    void submitToken(manual);
  }

  const ordered = [...talks].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Ingreso manual */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleManual} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Ingreso manual</p>
          <p className="text-xs text-slate-500">
            Si no pudiste escanear con la cámara de tu teléfono, pega aquí el contenido del QR.
          </p>
          <Input
            label="Contenido del QR"
            name="token"
            value={manual}
            placeholder="eyJhbGciOi…"
            error={manualError}
            onChange={(e) => setManual(e.target.value)}
          />
          <Button type="submit" loading={busy} className="w-full">
            Registrar asistencia
          </Button>
        </form>

        {/* Resultado */}
        {result?.kind === 'success' && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4"
          >
            <p className="font-semibold text-emerald-900">
              {result.already ? 'Asistencia ya registrada' : '¡Asistencia registrada!'}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              {result.already
                ? `Ya habías registrado tu asistencia en "${result.talkTitle}".`
                : `Tu asistencia en "${result.talkTitle}" quedó registrada.`}
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-3 text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
            >
              Escanear otro código
            </button>
          </div>
        )}

        {result?.kind === 'error' && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
            <p className="font-semibold text-red-800">No se pudo registrar</p>
            <p className="mt-1 text-sm text-red-700">{result.message}</p>
            {result.code && <p className="mt-1 font-mono text-xs text-red-500">{result.code}</p>}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Ventanas de asistencia */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Tus ponencias y ventanas de asistencia</h2>
        <p className="mt-1 text-xs text-slate-500">
          El QR lo proyecta el organizador al finalizar la ponencia.
        </p>

        {ordered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Todavía no estás inscrito en ninguna ponencia.{' '}
            <a href="/agenda" className="font-medium text-[#05003b] hover:underline">
              Revisa la agenda
            </a>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {ordered.map((talk) => {
              const attended = attendedIds.includes(talk.id);
              return (
                <li key={talk.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        <a href={`/agenda/${talk.id}`} className="hover:underline">
                          {talk.title}
                        </a>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {talk.date} · {talk.startTime} – {talk.endTime}
                      </p>
                    </div>
                    {attended && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Asistió
                      </span>
                    )}
                  </div>
                  <AttendanceWindow
                    className="mt-2"
                    opensAt={talk.opensAt}
                    closesAt={talk.closesAt}
                    now={now}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
