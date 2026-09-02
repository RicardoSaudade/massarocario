import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export function FormField({ label, error, hint, id, ...inputProps }: FormFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={error || hint ? messageId : undefined} {...inputProps} />
      {(error || hint) && <p id={messageId} className={error ? 'form-field__error' : 'form-field__hint'}>{error ?? hint}</p>}
    </div>
  )
}