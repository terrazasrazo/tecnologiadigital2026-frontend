import { useRef, useState, type ChangeEvent } from 'react';
import Button from '../ui/Button';
import { ClientApiError, deleteJson, sendForm } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

interface Props {
  speakerId: number;
  /** Nombre del ponente (para las iniciales del placeholder). */
  name: string;
  /** URL ya resuelta de la foto actual (`publicUrl()`), o `null`. */
  photo: string | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Subida y eliminación de la fotografía del perfil de ponente. */
export default function PhotoUpload({ speakerId, name, photo }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photo);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setError(null);
    if (!picked) {
      setFile(null);
      setPreview(photo);
      return;
    }
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError('Formato de imagen no permitido (usa JPG, PNG o WEBP).');
      event.target.value = '';
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError('La imagen no puede superar 5 MB.');
      event.target.value = '';
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('photo', file);
    try {
      await sendForm(`/api/speakers/${speakerId}`, 'PATCH', fd);
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar la fotografía actual?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteJson(`/api/speakers/${speakerId}/photo`);
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        {preview ? (
          <img
            src={preview}
            alt="Vista previa de la fotografía"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl font-bold text-blue-400">
            {initialsOf(name)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePick}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="text-xs text-slate-500">JPG, PNG o WEBP · máximo 5 MB.</p>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="sm" loading={busy} disabled={!file} onClick={upload}>
            Subir fotografía
          </Button>
          {photo && (
            <Button size="sm" variant="secondary" loading={busy} onClick={remove}>
              Eliminar fotografía
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
