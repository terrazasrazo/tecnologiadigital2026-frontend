import Badge, { type BadgeVariant } from '../ui/Badge';
import { formatClock, type TimeFormat } from '../../lib/format';

interface Props {
  opensAt: string;
  closesAt: string;
  /** Formato de hora (default 24 h; lo pasa la página desde la cookie). */
  format?: TimeFormat;
  /** Fecha/hora de referencia (por defecto, ahora). */
  now?: Date;
  className?: string;
}

/**
 * Estado de la ventana de asistencia de una ponencia:
 * `Próximamente` (antes de abrir) · `Abierta` · `Cerrada`.
 */
export default function AttendanceWindow({ opensAt, closesAt, format = '24h', now, className }: Props) {
  const reference = now ?? new Date();
  const open = reference >= new Date(opensAt) && reference <= new Date(closesAt);

  const variant: BadgeVariant = open ? 'green' : reference < new Date(opensAt) ? 'amber' : 'slate';
  const label = open
    ? 'Asistencia abierta'
    : reference < new Date(opensAt)
      ? `Abre a las ${formatClock(opensAt, format)}`
      : 'Ventana cerrada';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Badge variant={variant}>{label}</Badge>
      <span className="text-xs text-slate-500">
        {formatClock(opensAt, format)} – {formatClock(closesAt, format)}
      </span>
    </div>
  );
}
