import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import UserPicker, { type PickedUser } from '../users/UserPicker';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import type { Certificate } from '../../lib/types';

/**
 * Emisión de constancias a nombre de otro usuario
 * (`POST /api/certificates/users/:userId`), con búsqueda del usuario
 * asistente mediante `UserPicker`.
 */
export default function IssueCertificate() {
  const [picked, setPicked] = useState<PickedUser | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!picked) {
      setError('Selecciona el usuario que recibirá la constancia.');
      return;
    }
    setLoading(true);
    setError(null);
    setCertificate(null);
    try {
      const cert = await postJson<Certificate>(`/api/certificates/users/${picked.id}`, {
        sendEmail,
      });
      setCertificate(cert);
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <p className="mb-1 block text-sm font-medium text-slate-700">
          Usuario <span className="text-red-500">*</span>
        </p>
        <UserPicker role="asistente" value={picked} onChange={setPicked} />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#05003b] focus:ring-blue-500"
        />
        Enviar también por correo
      </label>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {certificate && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <p>
            <span className="font-semibold">Constancia emitida</span> · Código{' '}
            <span className="font-mono font-semibold">{certificate.code}</span> ·{' '}
            {certificate.talksCount} ponencia{certificate.talksCount === 1 ? '' : 's'} ·{' '}
            {certificate.hoursTotal} h
          </p>
          <a
            href={`/api/certificates/${certificate.id}/download`}
            className="font-semibold text-emerald-700 underline hover:text-emerald-900"
          >
            Descargar PDF
          </a>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading} disabled={!picked}>
          Emitir constancia
        </Button>
        <a
          href="/organizador/constancias"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          Volver al listado
        </a>
      </div>
    </form>
  );
}
