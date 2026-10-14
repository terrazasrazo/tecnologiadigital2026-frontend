import { useState } from 'react';
import Button from '../ui/Button';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

interface Props {
  /** true si ya existe una constancia (etiqueta "Regenerar"). */
  hasCertificate: boolean;
}

/** Genera (o regenera) la constancia en el servidor y recarga la página. */
export default function CertificateDownload({ hasCertificate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await postJson('/api/certificates', { sendEmail: true });
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
      <Button loading={loading} onClick={handleClick} size="lg" className="w-full sm:w-auto">
        {hasCertificate ? 'Regenerar constancia' : 'Generar mi constancia'}
      </Button>
      <p className="text-xs text-slate-500">
        Se generará el PDF y se enviará una copia a tu correo.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
