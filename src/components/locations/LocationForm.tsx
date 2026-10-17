import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import { ClientApiError, patchJson, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';

export interface LocationFormInitial {
  name: string;
  building: string | null;
  capacity: number | null;
  address: string | null;
}

interface Props {
  /** Presente = edición; ausente = creación. */
  locationId?: number;
  initial?: LocationFormInitial;
}

/** Alta/edición de ubicaciones (`POST|PATCH /api/locations`). */
export default function LocationForm({ locationId, initial }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    building: initial?.building ?? '',
    capacity: initial?.capacity != null ? String(initial.capacity) : '',
    address: initial?.address ?? '',
  });
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
    if (form.capacity && (!/^\d+$/.test(form.capacity) || Number(form.capacity) <= 0)) {
      setErrors({ capacity: 'La capacidad debe ser un número entero positivo.' });
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      building: form.building.trim() || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      address: form.address.trim() || null,
    };

    try {
      if (locationId) {
        await patchJson(`/api/locations/${locationId}`, payload);
      } else {
        await postJson('/api/locations', payload);
      }
      window.location.assign('/organizador/ubicaciones');
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
        label="Nombre"
        required
        placeholder="Auditorio A"
        value={form.name}
        error={errors.name}
        onChange={(e) => update('name', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Edificio"
          placeholder="Edificio de Ingeniería"
          value={form.building}
          error={errors.building}
          onChange={(e) => update('building', e.target.value)}
        />
        <Input
          label="Capacidad"
          type="number"
          min={1}
          placeholder="120"
          value={form.capacity}
          error={errors.capacity}
          onChange={(e) => update('capacity', e.target.value)}
        />
      </div>

      <Textarea
        label="Dirección o referencia"
        rows={2}
        placeholder="Campus central, piso 1…"
        value={form.address}
        error={errors.address}
        onChange={(e) => update('address', e.target.value)}
      />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {locationId ? 'Guardar cambios' : 'Crear ubicación'}
        </Button>
        <a
          href="/organizador/ubicaciones"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
