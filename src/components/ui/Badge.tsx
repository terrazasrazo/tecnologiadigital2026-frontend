import type { ReactNode } from 'react';

export type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'slate';

const VARIANTS: Record<BadgeVariant, string> = {
  blue: 'bg-blue-50 text-[#05003b]',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/** Etiqueta compacta para estados (rol, status, etc.). */
export default function Badge({ variant = 'slate', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
