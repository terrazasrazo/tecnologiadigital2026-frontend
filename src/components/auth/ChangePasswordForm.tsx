import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

/** Cambio de contraseña (`POST /api/users/me/change-password`). */
export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clientErrs: Record<string, string> = {};
    if (!form.currentPassword) clientErrs.currentPassword = 'Ingresa tu contraseña actual.';
    if (form.newPassword.length < 8 || form.newPassword.length > 72)
      clientErrs.newPassword = 'La contraseña debe tener de 8 a 72 caracteres.';
    if (form.newPassword !== form.confirm) clientErrs.confirm = 'Las contraseñas no coinciden.';
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});
    try {
      await postJson('/api/users/me/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setSaved(true);
    } catch (err) {
      if (err instanceof ClientApiError) {
        const fieldErrs = fieldErrors(err.details);
        if (err.code === 'VALIDATION_ERROR' && Object.keys(fieldErrs).length > 0) {
          setErrors(fieldErrs);
        } else {
          setFormError(messageFor(err.code, err.message));
        }
      } else {
        setFormError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Contraseña actualizada.
        </div>
      )}

      <Input
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        value={form.currentPassword}
        error={errors.currentPassword}
        onChange={(e) => update('currentPassword', e.target.value)}
      />
      <Input
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres"
        value={form.newPassword}
        error={errors.newPassword}
        onChange={(e) => update('newPassword', e.target.value)}
      />
      <Input
        label="Confirmar nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        value={form.confirm}
        error={errors.confirm}
        onChange={(e) => update('confirm', e.target.value)}
      />

      <Button type="submit" variant="secondary" loading={loading} className="w-full sm:w-auto">
        Cambiar contraseña
      </Button>
    </form>
  );
}
