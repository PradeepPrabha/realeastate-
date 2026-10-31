import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/format'

type Variant = 'primary' | 'navy' | 'outline' | 'ghost' | 'danger'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; loading?: boolean; icon?: ReactNode; full?: boolean; size?: 'sm' | 'md' | 'lg' }
const sizes = { sm: '!px-3 !py-1.5 !text-xs', md: '', lg: '!px-6 !py-3 !text-base' }

export default function Button({ variant = 'primary', loading, icon, full, size = 'md', className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button type={type} disabled={disabled || loading} className={cx(`btn-${variant}`, sizes[size], full && 'w-full', className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}
