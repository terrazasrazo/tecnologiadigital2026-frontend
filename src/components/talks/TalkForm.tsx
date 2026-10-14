import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';
import { toLocalInputValue } from '../../lib/utils';
import type { Location, Speaker, Talk, TalkStatus } from '../../lib/types';

interface Props {
  /** Presente = edición; ausente = creación. */
  talk?: Talk;
  locations: Location[];
  speakers: Speaker[];
}

interface FormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  status: TalkStatus;
  attendanceOpensAt: string;
  attendanceClosesAt: string;
}

/** Alta/edición de ponencias (`POST|PATCH /api/talks`). */
export default function TalkForm({ talk, locations, speakers }: Props) {
  const isEdit = Boolean(talk);
  const [form, setForm] = useState<FormState>({
    title: talk?.title ?? '',
    description: talk?.description ?? '',
    date: talk?.date ?? '',
    startTime: (talk?.startTime ?? '').slice(0, 5),
    endTime: (talk?.endTime ?? '').slice(0, 5),
    locationId: talk?.location ? String(talk.location.id) : '',
    status: talk?.status ?? 'scheduled',
    attendanceOpensAt: talk?.attendanceWindow?.opensAt
      ? toLocalInputValue(talk.attendanceWindow.opensAt)
      : '',
    attendanceClosesAt: talk?.attendanceWindow?.closesAt
      ? toLocalInputValue(talk.attendanceWindow.closesAt)
      : '',
  });
  const [speakerIds, setSpeakerIds] = useState<number[]>(
    talk?.speakers?.map((s) => s.id) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSpeaker(id: number) {
    setSpeakerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientErrs: Record<string, string> = {};
    if (!form.title.trim()) clientErrs.title = 'El título es obligatorio.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) clientErrs.date = 'Selecciona una fecha.';
    if (!form.startTime) clientErrs.startTime = 'Indica la hora de inicio.';
    if (!form.endTime) clientErrs.endTime = 'Indica la hora de fin.';
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: form.status,
      locationId: form.locationId ? Number(form.locationId) : undefined,
      speakerIds: speakerIds.length > 0 ? speakerIds : undefined,
      attendanceOpensAt: form.attendanceOpensAt || undefined,
      attendanceClosesAt: form.attendanceClosesAt || undefined,
    };

    try {
      if (talk) {
        await postJson(`/api/talks/${talk.id}`, payload);
        window.location.reload();
      } else {
        await postJson('/api/talks', payload);
        window.location.assign('/organizador/ponencias');
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
        label="Título"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => update('title', e.target.value)}
      />

      <Textarea
        label="Descripción"
        rows={4}
        maxLength={5000}
        value={form.description}
        error={errors.description}
        onChange={(e) => update('description', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Fecha"
          type="date"
          required
          value={form.date}
          error={errors.date}
          onChange={(e) => update('date', e.target.value)}
        />
        <Input
          label="Inicio"
          type="time"
          required
          value={form.startTime}
          error={errors.startTime}
          onChange={(e) => update('startTime', e.target.value)}
        />
        <Input
          label="Fin"
          type="time"
          required
          value={form.endTime}
          error={errors.endTime}
          onChange={(e) => update('endTime', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Ubicación"
          value={form.locationId}
          error={errors.locationId}
          onChange={(e) => update('locationId', e.target.value)}
        >
          <option value="">Sin ubicación</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
              {loc.building ? ` — ${loc.building}` : ''}
            </option>
          ))}
        </Select>
        <Select
          label="Estado"
          value={form.status}
          error={errors.status}
          onChange={(e) => update('status', e.target.value as TalkStatus)}
        >
          <option value="scheduled">Programada</option>
          <option value="cancelled">Cancelada</option>
        </Select>
      </div>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-slate-700">Ponentes</legend>
        {speakers.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay ponentes registrados.{' '}
            <a href="/organizador/ponentes/nuevo" className="font-medium text-blue-600 hover:text-blue-700">
              Crea uno
            </a>
            .
          </p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {speakers.map((speaker) => (
              <label key={speaker.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={speakerIds.includes(speaker.id)}
                  onChange={() => toggleSpeaker(speaker.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {speaker.name}
                {speaker.institution && (
                  <span className="text-xs text-slate-400">· {speaker.institution}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">
          Ventana de asistencia (opcional)
        </p>
        <p className="mb-2 text-xs text-slate-500">
          Si la dejas vacía, el backend la calcula automáticamente alrededor del horario de la
          ponencia.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Abre"
            type="datetime-local"
            value={form.attendanceOpensAt}
            error={errors.attendanceOpensAt}
            onChange={(e) => update('attendanceOpensAt', e.target.value)}
          />
          <Input
            label="Cierra"
            type="datetime-local"
            value={form.attendanceClosesAt}
            error={errors.attendanceClosesAt}
            onChange={(e) => update('attendanceClosesAt', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {talk ? 'Guardar cambios' : 'Crear ponencia'}
        </Button>
        <a
          href="/organizador/ponencias"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
