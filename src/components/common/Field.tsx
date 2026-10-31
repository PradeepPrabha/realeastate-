import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cx } from '@/utils/format'

interface Base { label?: string; error?: string; hint?: string; wrapperClassName?: string }
function Wrap({ label, error, hint, wrapperClassName, id, children, required }: Base & { id?: string; children: ReactNode; required?: boolean }) {
  return (
    <div className={wrapperClassName}>
      {label && <label htmlFor={id} className="label">{label}{required && <span className="text-red-500"> *</span>}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Base>(function Input({ label, error, hint, wrapperClassName, className, id, ...rest }, ref) {
  const fid = id ?? rest.name
  return <Wrap {...{ label, error, hint, wrapperClassName }} id={fid} required={rest.required}><input ref={ref} id={fid} aria-invalid={!!error} className={cx('input', error && '!border-red-500', className)} {...rest} /></Wrap>
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Base>(function Textarea({ label, error, hint, wrapperClassName, className, id, rows = 4, ...rest }, ref) {
  const fid = id ?? rest.name
  return <Wrap {...{ label, error, hint, wrapperClassName }} id={fid} required={rest.required}><textarea ref={ref} id={fid} rows={rows} aria-invalid={!!error} className={cx('input', error && '!border-red-500', className)} {...rest} /></Wrap>
})

interface Opt { value: string | number; label: string }
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Base & { options: (Opt | string)[]; placeholder?: string }>(function Select({ label, error, hint, wrapperClassName, className, id, options, placeholder, ...rest }, ref) {
  const fid = id ?? rest.name
  return (
    <Wrap {...{ label, error, hint, wrapperClassName }} id={fid} required={rest.required}>
      <select ref={ref} id={fid} aria-invalid={!!error} className={cx('input appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9', error && '!border-red-500', className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => { const op = typeof o === 'string' ? { value: o, label: o } : o; return <option key={op.value} value={op.value}>{op.label}</option> })}
      </select>
    </Wrap>
  )
})
