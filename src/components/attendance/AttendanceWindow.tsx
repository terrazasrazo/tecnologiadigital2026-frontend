import Badge, { type BadgeVariant } from '../ui/Badge';

interface Props {
  opensAt: string;
  closesAt: string;
  /** Fecha/hora de referencia (por defecto, ahora). */
  now?: Date;
  className?: string;
}

function localTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Estado de la ventana de asistencia de una ponencia:
 * `Próximamente` (antes de abrir) · `Abierta` · `Cerrada`.
 */
export default function AttendanceWindow({ opensAt, closesAt, now, className }: Props) {
  const reference = now ?? new Date();
  const open = reference >= new Date(opensAt) && reference <= new Date(closesAt);

  const variant: BadgeVariant = open ? 'green' : reference < new Date(opensAt) ? 'amber' : 'slate';
  const label = open
    ? 'Asistencia abierta'
    : reference < new Date(opensAt)
      ? `Abre a las ${localTime(opensAt)}`
      : 'Ventana cerrada';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Badge variant={variant}>{label}</Badge>
      <span className="text-xs text-slate-500">
        {localTime(opensAt)} – {localTime(closesAt)}
      </span>
    </div>
  );
}
