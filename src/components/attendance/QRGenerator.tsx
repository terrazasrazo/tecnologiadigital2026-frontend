import { useState } from 'react';
import QRCode from 'qrcode';
import Button from '../ui/Button';
import { ClientApiError, getJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import { buildCheckInUrl } from '../../lib/utils';
import type { QRToken } from '../../lib/types';

interface Props {
  talkId: number;
}

function localTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Genera la imagen del QR de la ponencia a partir del token firmado del
 * backend (`GET /api/attendance/talks/:id/qr`), usando la librería `qrcode`.
 */
export default function QRGenerator({ talkId }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<QRToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const token = await getJson<QRToken>(`/api/attendance/talks/${talkId}/qr`);
      const url = await QRCode.toDataURL(
        buildCheckInUrl(window.location.origin, token.talkId, token.token),
        {
          width: 320,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        },
      );
      setQr(token);
      setDataUrl(url);
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button loading={loading} onClick={handleGenerate}>
          {dataUrl ? 'Actualizar QR' : 'Generar QR'}
        </Button>
        <p className="text-xs text-slate-500">
          Proyéctalo al finalizar la ponencia: los asistentes lo escanean con la cámara de su
          teléfono y confirman su asistencia.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {dataUrl && qr && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-start">
          <img
            src={dataUrl}
            alt="Código QR de asistencia de la ponencia"
            className="h-64 w-64 rounded-lg border border-slate-100"
          />
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Código de asistencia activo</p>
            <dl className="mt-2 space-y-1">
              <div className="flex gap-2">
                <dt className="text-slate-500">Abre:</dt>
                <dd className="font-medium text-slate-800">{localTime(qr.opensAt)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Cierra:</dt>
                <dd className="font-medium text-slate-800">{localTime(qr.closesAt)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              El QR es único para esta ponencia y solo se valida dentro de su ventana. Si la
              ventana ya cerró, genera la ponencia con anticipación o regístralos con el check-in
              manual.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
