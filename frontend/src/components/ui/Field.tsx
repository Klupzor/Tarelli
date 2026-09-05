import { cloneElement, useId } from 'react';
import type { ReactElement } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactElement<Record<string, unknown>>;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, children, className = '' }: FieldProps) {
  const hintId = useId();
  const errorId = useId();
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = cloneElement(children, {
    id: htmlFor,
    invalid: Boolean(error),
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': describedBy,
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="text-[12.5px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12.5px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
