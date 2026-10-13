import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import { STORAGE_KEYS } from '../../lib/constants';

interface Props {
  /** Email a reenviar; si no se conoce, se pide en el formulario. */
  initialEmail?: string | null;
}

/** Reenvía el correo de verificación de cuenta. */
export default function ResendVerification({ initialEmail }: Props) {
  const [email, setEmail] = useState(
    () => initialEmail ?? (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.pendingEmail) : null) ?? '',
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Ingresa un correo válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await postJson('/api/auth/resend-verification', { email: email.trim() });
      setSent(true);
    } catch (err) {
      if (err instanceof ClientApiError) {
        if (err.code === 'VALIDATION_ERROR') setError('Ingresa un correo válido.');
        else setError(messageFor(err.code, err.message));
      } else {
        setError('Ocurrió un error inesperado.');
      }
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Si el correo existe, recibirás nuevamente el enlace de verificación.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" variant="secondary" loading={loading} className="w-full">
        Reenviar correo de verificación
      </Button>
    </form>
  );
}
