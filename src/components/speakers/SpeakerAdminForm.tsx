import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import UserPicker, { type PickedUser } from '../users/UserPicker';
import { ClientApiError, sendForm } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

export interface SpeakerAdminInitial {
  name: string;
  academicDegree: string | null;
  institution: string | null;
  bio: string | null;
}

interface Props {
  /** Presente = edición; ausente = creación. */
  speakerId?: number;
  initial?: SpeakerAdminInitial;
  /** Usuario ya vinculado (solo edición, se muestra como texto). */
  linkedUser?: string | null;
}

/**
 * Alta/edición de ponentes para el organizador. El endpoint es
 * `multipart/form-data`, así que el formulario se envía como FormData.
 * La vinculación a un usuario solo existe al crear (`userId`), porque
 * `PATCH /api/speakers/:id` no admite cambiarlo.
 */
export default function SpeakerAdminForm({ speakerId, initial, linkedUser }: Props) {
  const isEdit = Boolean(speakerId);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    academicDegree: initial?.academicDegree ?? '',
    institution: initial?.institution ?? '',
    bio: initial?.bio ?? '',
  });
  const [picked, setPicked] = useState<PickedUser | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
    if (!isEdit && !picked) {
      setFormError('Selecciona el usuario al que se vincula este ponente.');
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
    if (!isEdit && picked) fd.set('userId', String(picked.id));

    try {
      if (isEdit) {
        await sendForm(`/api/speakers/${speakerId}`, 'PATCH', fd);
        window.location.reload();
      } else {
        const created = await sendForm<{ id: number }>('/api/speakers', 'POST', fd);
        window.location.assign(`/organizador/ponentes/${created.id}/editar`);
      }
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

      <Input
        label="Nombre completo"
        required
        value={form.name}
        error={errors.name}
        onChange={(e) => update('name', e.target.value)}
      />

      {isEdit ? (
        <div>
          <p className="mb-1 block text-sm font-medium text-slate-700">Usuario vinculado</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {linkedUser ?? 'Sin usuario vinculado'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Para cambiar el vínculo, crea un nuevo ponente con el usuario correcto.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-1 block text-sm font-medium text-slate-700">
            Usuario vinculado <span className="text-red-500">*</span>
          </p>
          <UserPicker role="ponente" value={picked} onChange={setPicked} />
        </div>
      )}

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
        rows={5}
        maxLength={5000}
        hint={`${form.bio.length}/5000 caracteres`}
        value={form.bio}
        error={errors.bio}
        onChange={(e) => update('bio', e.target.value)}
      />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Guardar cambios' : 'Crear ponente'}
        </Button>
        <a
          href="/organizador/ponentes"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
