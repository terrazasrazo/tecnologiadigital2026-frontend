import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { Select } from '../ui/Input';
import { TIME_FORMAT_COOKIE, type TimeFormat } from '../../lib/format';

/** Guarda la preferencia de formato de hora en la cookie y recarga la página. */
export default function TimeFormatSetting() {
  // El SSR no conoce la cookie dentro del estado de React; se ajusta al hidratar.
  const [value, setValue] = useState<TimeFormat>('24h');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TIME_FORMAT_COOKIE}=(\\w+)`));
    if (match?.[1] === '12h') setValue('12h');
  }, []);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    document.cookie = `${TIME_FORMAT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    setSaved(true);
    // La página se sirve desde el servidor leyendo la cookie: recargar aplica
    // el nuevo formato en todos los bloques (agenda, asistencia, check-in…).
    window.setTimeout(() => window.location.reload(), 800);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
      <Select
        label="Formato de hora"
        value={value}
        onChange={(e) => setValue(e.target.value as TimeFormat)}
      >
        <option value="24h">24 horas (14:30)</option>
        <option value="12h">12 horas (2:30 PM)</option>
      </Select>
      <Button type="submit">Guardar preferencia</Button>
      {saved && (
        <p role="status" className="pb-2 text-sm text-emerald-700">
          Preferencia guardada; recargando…
        </p>
      )}
    </form>
  );
}
