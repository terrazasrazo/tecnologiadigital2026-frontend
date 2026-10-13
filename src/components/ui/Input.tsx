import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { useId } from 'react';

interface BaseProps {
  label?: string;
  /** Mensaje de error bajo el campo. */
  error?: string | null;
  hint?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;

const fieldClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
  }`;

function FieldWrapper({
  id,
  label,
  error,
  hint,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function Input({ label, error, hint, className = '', id, ...rest }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint}>
      <input
        id={fieldId}
        className={`${fieldClass(Boolean(error))} ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
    </FieldWrapper>
  );
}

export function Textarea({ label, error, hint, className = '', id, ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint}>
      <textarea
        id={fieldId}
        className={`${fieldClass(Boolean(error))} min-h-24 ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
    </FieldWrapper>
  );
}

export function Select({ label, error, hint, className = '', id, children, ...rest }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint}>
      <select id={fieldId} className={`${fieldClass(Boolean(error))} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

export default Input;
