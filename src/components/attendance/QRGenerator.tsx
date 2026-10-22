import { useState } from 'react';
import QRCode from 'qrcode';
import Button from '../ui/Button';
import { ClientApiError, getJson, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import { buildCheckInUrl } from '../../lib/utils';
import { formatClock, type TimeFormat } from '../../lib/format';
import type { QRToken } from '../../lib/types';

interface Props {
  talkId: number;
  /** Formato de hora (default 24 h; lo pasa la página desde la cookie). */
  format?: TimeFormat;
}

/**
 * Genera la imagen del QR de la ponencia a partir del token firmado del
 * backend (`GET /api/attendance/talks/:id/qr`), usando la librería `qrcode`.
 */
export default function QRGenerator({ talkId, format = '24h' }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<QRToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

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

  /** Descarga el PNG del QR generado (la imagen ya está en el navegador). */
  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-asistencia-ponencia-${talkId}.png`;
    link.click();
  }

  /** Pide al backend que envíe el QR por correo a los ponentes asociados. */
  async function handleEmail() {
    setEmailBusy(true);
    setEmailMsg(null);
    setEmailError(null);
    try {
      const result = await postJson<{ sent: number; recipients: number }>(
        `/api/attendance/talks/${talkId}/qr/email`,
      );
      setEmailMsg(`Correo enviado a ${result.sent} de ${result.recipients} ponente(s).`);
    } catch (err) {
      setEmailError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button loading={loading} onClick={handleGenerate}>
          {dataUrl ? 'Actualizar QR' : 'Generar QR'}
        </Button>
        <Button variant="secondary" onClick={handleDownload} disabled={!dataUrl}>
          Descargar PNG
        </Button>
        <Button variant="secondary" loading={emailBusy} onClick={handleEmail}>
          Enviar por correo a los ponentes
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
      {emailError && (
        <p role="alert" className="text-sm text-red-600">
          {emailError}
        </p>
      )}
      {emailMsg && (
        <p role="status" className="text-sm text-emerald-700">
          {emailMsg}
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
                <dd className="font-medium text-slate-800">{formatClock(qr.opensAt, format)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Cierra:</dt>
                <dd className="font-medium text-slate-800">{formatClock(qr.closesAt, format)}</dd>
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
