import { useState } from 'react';
import Button from '../ui/Button';
import { ClientApiError, patchJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';
import type { UserStatus } from '../../lib/types';

interface Props {
  userId: number;
  /** Nombre completo, para el texto de confirmación. */
  name: string;
  status: UserStatus;
}

/**
 * Botón para activar/desactivar un usuario
 * (`PATCH /api/users/:id/status`): alterna entre `active` e `inactive`.
 */
export default function UserStatusToggle({ userId, name, status }: Props) {
  const target: UserStatus = status === 'active' ? 'inactive' : 'active';
  const label = target === 'active' ? 'Activar' : 'Desactivar';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const verb = target === 'active' ? 'activar' : 'desactivar';
    if (!window.confirm(`¿${verb[0].toUpperCase()}${verb.slice(1)} a ${name}?`)) return;
    setLoading(true);
    setError(null);
    try {
      await patchJson(`/api/users/${userId}/status`, { status: target });
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof ClientApiError ? messageFor(err.code, err.message) : 'Inténtalo de nuevo.',
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={target === 'active' ? 'primary' : 'secondary'}
        size="sm"
        loading={loading}
        onClick={handleClick}
      >
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
