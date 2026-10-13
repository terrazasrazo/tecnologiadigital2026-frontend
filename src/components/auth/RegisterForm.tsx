import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';
import { STORAGE_KEYS } from '../../lib/constants';
import ResendVerification from './ResendVerification';

const EDUCATION_LEVELS = [
  'Estudiante',
  'Licenciatura',
  'Maestría',
  'Doctorado',
  'Docente',
  'Otro',
];

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    entity: '',
    educationLevel: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** Correo registrado: muestra la pantalla de "revisa tu correo". */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ingresa tu nombre.';
    if (!form.lastName.trim()) errs.lastName = 'Ingresa tu apellido.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Ingresa un correo válido.';
    if (form.password.length < 8 || form.password.length > 72)
      errs.password = 'La contraseña debe tener de 8 a 72 caracteres.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden.';
    return errs;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clientErrs = validate();
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});

    try {
      await postJson('/api/auth/register', {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.entity.trim() ? { entity: form.entity.trim() } : {}),
        ...(form.educationLevel ? { educationLevel: form.educationLevel } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      // Recordar el correo para poder reenviar la verificación.
      localStorage.setItem(STORAGE_KEYS.pendingEmail, form.email.trim());
      setRegisteredEmail(form.email.trim());
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

  if (registeredEmail) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">Cuenta creada</p>
          <p className="mt-1">
            Hemos enviado un enlace de verificación a{' '}
            <span className="font-medium">{registeredEmail}</span>. Activa tu cuenta desde ese
            correo para poder iniciar sesión.
          </p>
        </div>
        <ResendVerification initialEmail={registeredEmail} />
        <p className="text-center text-sm text-slate-500">
          <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
            Ya verifiqué mi correo, iniciar sesión
          </a>
        </p>
      </div>
    );
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          name="name"
          autoComplete="given-name"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => update('name', e.target.value)}
        />
        <Input
          label="Apellido"
          name="lastName"
          autoComplete="family-name"
          required
          value={form.lastName}
          error={errors.lastName}
          onChange={(e) => update('lastName', e.target.value)}
        />
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        required
        placeholder="tu@correo.com"
        value={form.email}
        error={errors.email}
        onChange={(e) => update('email', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          hint="Mínimo 8 caracteres"
          value={form.password}
          error={errors.password}
          onChange={(e) => update('password', e.target.value)}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos adicionales (opcional)
        </p>
        <div className="flex flex-col gap-4">
          <Input
            label="Institución u organización"
            name="entity"
            value={form.entity}
            error={errors.entity}
            onChange={(e) => update('entity', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Nivel educativo"
              name="educationLevel"
              value={form.educationLevel}
              error={errors.educationLevel}
              onChange={(e) => update('educationLevel', e.target.value)}
            >
              <option value="">Selecciona…</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
            <Input
              label="Teléfono"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Crear cuenta
      </Button>
    </form>
  );
}
