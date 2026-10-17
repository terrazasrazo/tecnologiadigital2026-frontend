import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

/** Formulario de recuperación de contraseña (paso 1: enviar correo). */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
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
      await postJson('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      if (err instanceof ClientApiError) {
        if (err.code === 'VALIDATION_ERROR') setError('Ingresa un correo válido.');
        else setError(messageFor(err.code, err.message));
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <p className="font-semibold">Correo enviado</p>
        <p className="mt-1">
          Si <span className="font-medium">{email.trim()}</span> tiene una cuenta, recibirás un
          enlace para restablecer tu contraseña.
        </p>
        <a
          href="/auth/login"
          className="mt-3 inline-block font-medium text-[#05003b] hover:underline"
        >
          Volver a iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
        placeholder="tu@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Enviar enlace de recuperación
      </Button>
      <p className="text-center text-sm text-slate-500">
        <a href="/auth/login" className="font-medium text-[#05003b] hover:underline">
          Volver a iniciar sesión
        </a>
      </p>
    </form>
  );
}
