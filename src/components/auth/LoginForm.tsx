import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

interface LoginResponse {
  user: { role: { name: string } };
  home: string;
}

interface Props {
  /** Ruta a la que redirigir tras el login (validada en el servidor). */
  redirectTo: string | null;
}

export default function LoginForm({ redirectTo }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setErrors({});

    try {
      const res = await postJson<LoginResponse>('/api/session', { email, password });
      // Navegación completa para que el servidor pinte el panel con la sesión.
      window.location.assign(redirectTo ?? res.home);
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
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
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex items-center justify-end">
        <a
          href="/auth/forgot-password"
          className="text-sm font-medium text-[#05003b] hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Iniciar sesión
      </Button>
    </form>
  );
}
