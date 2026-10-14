import Badge, { type BadgeVariant } from '../ui/Badge';
import type { RegistrationStatus } from '../../lib/types';
import { REGISTRATION_STATUS_LABELS } from '../../lib/constants';

const VARIANT: Record<RegistrationStatus, BadgeVariant> = {
  registered: 'blue',
  attended: 'green',
  cancelled: 'slate',
};

interface Props {
  status: RegistrationStatus;
  className?: string;
}

/** Insignia de estado de inscripción: Inscrito / Asistió / Cancelado. */
export default function RegistrationStatus({ status, className }: Props) {
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {REGISTRATION_STATUS_LABELS[status]}
    </Badge>
  );
}
