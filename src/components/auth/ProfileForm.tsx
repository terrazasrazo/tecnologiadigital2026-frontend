import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ClientApiError, patchJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';
import { EDUCATION_LEVELS } from '../../lib/constants';

export interface ProfileInitial {
  name: string;
  lastName: string;
  email: string;
  entity: string | null;
  educationLevel: string | null;
  phone: string | null;
}

/** Edición de los datos personales (`PATCH /api/users/me`). */
export default function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [form, setForm] = useState({
    name: initial.name,
    lastName: initial.lastName,
    entity: initial.entity ?? '',
    educationLevel: initial.educationLevel ?? '',
    phone: initial.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) {
      setErrors({
        ...( !form.name.trim() ? { name: 'Ingresa tu nombre.' } : {}),
        ...( !form.lastName.trim() ? { lastName: 'Ingresa tu apellido.' } : {}),
      });
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});
    try {
      await patchJson('/api/users/me', {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        entity: form.entity.trim() || null,
        educationLevel: form.educationLevel || null,
        phone: form.phone.trim() || null,
      });
      setSaved(true);
      // Refrescar el layout (sidebar con el nombre actualizado).
      window.setTimeout(() => window.location.reload(), 1000);
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
          Datos actualizados correctamente.
        </div>
      )}

      <Input
        label="Correo electrónico"
        type="email"
        value={initial.email}
        disabled
        hint="El correo no se puede modificar desde aquí."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          value={form.name}
          error={errors.name}
          onChange={(e) => update('name', e.target.value)}
        />
        <Input
          label="Apellido"
          value={form.lastName}
          error={errors.lastName}
          onChange={(e) => update('lastName', e.target.value)}
        />
      </div>

      <Input
        label="Institución u organización"
        value={form.entity}
        error={errors.entity}
        onChange={(e) => update('entity', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Nivel educativo"
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
          type="tel"
          value={form.phone}
          error={errors.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        Guardar cambios
      </Button>
    </form>
  );
}
