import { useState, type FormEvent } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { fieldErrors, messageFor } from '../../lib/errorMessages';
import { EDUCATION_LEVELS, ROLE_LABELS, USER_STATUS_LABELS } from '../../lib/constants';
import type { RoleName, UserStatus } from '../../lib/types';

export interface UserFormInitial {
  name: string;
  lastName: string;
  email: string;
  entity: string | null;
  educationLevel: string | null;
  phone: string | null;
}

interface Props {
  /** Presente = edición; ausente = creación. */
  userId?: number;
  initial?: UserFormInitial;
  initialRole?: RoleName;
  initialStatus?: UserStatus;
}

const ROLES = Object.keys(ROLE_LABELS) as RoleName[];
const STATUSES = Object.keys(USER_STATUS_LABELS) as UserStatus[];

/** Alta/edición de usuarios (`POST|PATCH /api/users`). */
export default function UserForm({ userId, initial, initialRole, initialStatus }: Props) {
  const isEdit = Boolean(userId);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    password: '',
    role: initialRole ?? ('asistente' as RoleName),
    status: initialStatus ?? ('pending' as UserStatus),
    entity: initial?.entity ?? '',
    educationLevel: initial?.educationLevel ?? '',
    phone: initial?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientErrs: Record<string, string> = {};
    if (!form.name.trim()) clientErrs.name = 'El nombre es obligatorio.';
    if (!form.lastName.trim()) clientErrs.lastName = 'El apellido es obligatorio.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) clientErrs.email = 'Correo electrónico inválido.';
    if (!isEdit && form.password.length < 8)
      clientErrs.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    setFormError(null);
    setErrors({});

    try {
      if (isEdit) {
        await postJson(`/api/users/${userId}`, {
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          status: form.status,
          entity: form.entity.trim() || null,
          educationLevel: form.educationLevel || null,
          phone: form.phone.trim() || null,
        });
        window.location.reload();
      } else {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          status: form.status,
        };
        if (form.entity.trim()) payload.entity = form.entity.trim();
        if (form.educationLevel) payload.educationLevel = form.educationLevel;
        if (form.phone.trim()) payload.phone = form.phone.trim();
        await postJson('/api/users', payload);
        window.location.assign('/admin/usuarios');
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => update('name', e.target.value)}
        />
        <Input
          label="Apellido"
          required
          value={form.lastName}
          error={errors.lastName}
          onChange={(e) => update('lastName', e.target.value)}
        />
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        required
        value={form.email}
        error={errors.email}
        onChange={(e) => update('email', e.target.value)}
      />

      {!isEdit && (
        <Input
          label="Contraseña"
          type="password"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          value={form.password}
          error={errors.password}
          onChange={(e) => update('password', e.target.value)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Rol"
          value={form.role}
          error={errors.role}
          onChange={(e) => update('role', e.target.value)}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        <Select
          label="Estado"
          value={form.status}
          error={errors.status}
          onChange={(e) => update('status', e.target.value)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {USER_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Entidad"
          placeholder="Universidad / empresa"
          value={form.entity}
          error={errors.entity}
          onChange={(e) => update('entity', e.target.value)}
        />
        <Select
          label="Nivel educativo"
          value={form.educationLevel}
          error={errors.educationLevel}
          onChange={(e) => update('educationLevel', e.target.value)}
        >
          <option value="">Sin especificar</option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Teléfono"
        value={form.phone}
        error={errors.phone}
        onChange={(e) => update('phone', e.target.value)}
      />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
        <a
          href="/admin/usuarios"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
