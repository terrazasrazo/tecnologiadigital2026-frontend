import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

interface Props {
  /** Token de recuperación recibido en la URL. */
  token: string;
}

/** Formulario de recuperación de contraseña (paso 2: nueva contraseña). */
export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clientErrs: Record<string, string> = {};
    if (password.length < 8 || password.length > 72)
      clientErrs.password = 'La contraseña debe tener de 8 a 72 caracteres.';
    if (password !== confirm) clientErrs.confirm = 'Las contraseñas no coinciden.';
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});
    try {
      await postJson('/api/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      if (err instanceof ClientApiError) {
        const fieldErrs = fieldErrors(err.details);
        if (err.code === 'VALIDATION_ERROR' && Object.keys(fieldErrs).length > 0) {
          setErrors(fieldErrs);
        } else {
          setFormError(messageFor(err.code, err.message));
        }
      } else {
        setFormError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <p className="font-semibold">Contraseña actualizada</p>
        <p className="mt-1">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <a
          href="/auth/login"
          className="mt-3 inline-block font-medium text-blue-600 hover:text-blue-700"
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}
      <Input
        label="Nueva contraseña"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirm}
        error={errors.confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Restablecer contraseña
      </Button>
    </form>
  );
}
