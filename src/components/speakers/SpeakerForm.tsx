import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { ClientApiError, sendForm } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

export interface SpeakerFormInitial {
  id: number;
  name: string;
  academicDegree: string | null;
  institution: string | null;
  bio: string | null;
}

/**
 * Edición de los datos del perfil de ponente (semblanza, grado, institución).
 * Envía `multipart/form-data` porque así lo espera `PATCH /api/speakers/:id`.
 */
export default function SpeakerForm({ speaker }: { speaker: SpeakerFormInitial }) {
  const [form, setForm] = useState({
    name: speaker.name,
    academicDegree: speaker.academicDegree ?? '',
    institution: speaker.institution ?? '',
    bio: speaker.bio ?? '',
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
    if (!form.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio.' });
      return;
    }
    if (form.bio.length > 5000) {
      setErrors({ bio: 'La semblanza no puede superar 5000 caracteres.' });
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});

    const fd = new FormData();
    fd.set('name', form.name.trim());
    fd.set('academicDegree', form.academicDegree.trim());
    fd.set('institution', form.institution.trim());
    fd.set('bio', form.bio);

    try {
      await sendForm(`/api/speakers/${speaker.id}`, 'PATCH', fd);
      setSaved(true);
      // Refrescar para que la vista previa (SSR) muestre los nuevos datos.
      window.setTimeout(() => window.location.reload(), 900);
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
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}
      {saved && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Perfil actualizado correctamente.
        </div>
      )}

      <Input
        label="Nombre completo"
        required
        value={form.name}
        error={errors.name}
        onChange={(e) => update('name', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Grado académico"
          placeholder="Dra., Dr., M. en C.…"
          value={form.academicDegree}
          error={errors.academicDegree}
          onChange={(e) => update('academicDegree', e.target.value)}
        />
        <Input
          label="Institución"
          value={form.institution}
          error={errors.institution}
          onChange={(e) => update('institution', e.target.value)}
        />
      </div>

      <Textarea
        label="Semblanza"
        rows={6}
        maxLength={5000}
        hint={`${form.bio.length}/5000 caracteres`}
        placeholder="Breve biografía profesional que se mostrará en tu perfil público…"
        value={form.bio}
        error={errors.bio}
        onChange={(e) => update('bio', e.target.value)}
      />

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        Guardar cambios
      </Button>
    </form>
  );
}
