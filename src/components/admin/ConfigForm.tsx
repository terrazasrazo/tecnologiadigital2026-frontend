import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';
import type { CertificateSettings } from '../../lib/types';

interface Props {
  initial: CertificateSettings;
}

const METRIC_LABELS: Record<CertificateSettings['metric'], string> = {
  talks: 'Ponencias asistidas',
  hours: 'Horas acumuladas',
  both: 'Ponencias y horas',
};

/** Edición del umbral de constancias (`PATCH /api/settings`). */
export default function ConfigForm({ initial }: Props) {
  const [form, setForm] = useState({
    metric: initial.metric,
    minTalks: String(initial.minTalks),
    minHours: String(initial.minHours),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientErrs: Record<string, string> = {};
    if (!/^\d+$/.test(form.minTalks)) clientErrs.minTalks = 'Debe ser un entero >= 0.';
    if (!/^\d+$/.test(form.minHours)) clientErrs.minHours = 'Debe ser un entero >= 0.';
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});
    setSaved(false);

    try {
      const res = await postJson<{ certificate: CertificateSettings }>('/api/settings', {
        metric: form.metric,
        minTalks: Number(form.minTalks),
        minHours: Number(form.minHours),
      });
      setForm({
        metric: res.certificate.metric,
        minTalks: String(res.certificate.minTalks),
        minHours: String(res.certificate.minHours),
      });
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
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <Select
        label="Métrica de elegibilidad"
        value={form.metric}
        error={errors.metric}
        onChange={(e) => update('metric', e.target.value)}
      >
        {(Object.keys(METRIC_LABELS) as Array<CertificateSettings['metric']>).map((key) => (
          <option key={key} value={key}>
            {METRIC_LABELS[key]}
          </option>
        ))}
      </Select>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Ponencias mínimas (minTalks)"
          type="number"
          min={0}
          required
          value={form.minTalks}
          error={errors.minTalks}
          onChange={(e) => update('minTalks', e.target.value)}
        />
        <Input
          label="Horas mínimas (minHours)"
          type="number"
          min={0}
          required
          value={form.minHours}
          error={errors.minHours}
          onChange={(e) => update('minHours', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          Guardar configuración
        </Button>
        {saved && (
          <p role="status" className="text-sm font-medium text-emerald-600">
            Guardado. El nuevo umbral ya se aplica a las constancias.
          </p>
        )}
      </div>
    </form>
  );
}
