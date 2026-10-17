import { useEffect, useRef, useState } from 'react';
import { ClientApiError, getJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import type { Paginated, RoleName, User } from '../../lib/types';

export interface PickedUser {
  id: number;
  label: string;
}

interface Props {
  /** Rol que se busca (por defecto, asistente). */
  role?: RoleName;
  /** Usuario ya vinculado (se muestra como chip inamovible en edición). */
  current?: PickedUser | null;
  /** Selección actual controlada por el formulario padre. */
  value: PickedUser | null;
  onChange: (user: PickedUser | null) => void;
}

function labelOf(user: User): string {
  return `${user.name} ${user.lastName} (${user.email})`;
}

/**
 * Buscador de usuarios para vincular a un registro (p. ej. un usuario existente
 * como ponente). Consulta `GET /api/users?search=&role=` con debounce.
 */
export default function UserPicker({ role = 'asistente', current, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    timerRef.current = window.setTimeout(() => {
      getJson<Paginated<User>>(`/api/users?search=${encodeURIComponent(term)}&role=${role}&pageSize=6`)
        .then((res) => setResults(res.data))
        .catch((err) => {
          setResults([]);
          setError(err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Error de búsqueda.');
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [query, role]);

  const selected = value ?? current ?? null;

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#05003b]">{selected.label}</p>
          {!value && (
            <p className="text-xs text-[#05003b]">Usuario vinculado actualmente</p>
          )}
        </div>
        {!current && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-sm font-medium text-[#05003b] underline hover:no-underline"
          >
            Quitar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={query}
        placeholder="Buscar por nombre o correo…"
        aria-label="Buscar usuario"
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <p className="text-xs text-slate-500">Buscando…</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ id: user.id, label: labelOf(user) });
                  setQuery('');
                  setResults([]);
                }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  {user.name} {user.lastName}
                </span>
                <span className="block text-xs text-slate-500">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="text-xs text-slate-500">Sin resultados para “{query.trim()}”.</p>
      )}
      {query.trim().length < 2 && (
        <p className="text-xs text-slate-500">
          Escribe al menos 2 letras para buscar un usuario {role}.
        </p>
      )}
    </div>
  );
}
