import { Link } from 'react-router-dom'
import { cx } from '@/utils/format'

export default function Logo({ light = true, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="TN HOMES home" className={cx('flex items-center gap-2', className)}>
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden><path d="M6 24 24 8l18 16v16h-9V28H15v12H6z" fill="none" stroke="#C9962B" strokeWidth="3.5" strokeLinejoin="round" /><path d="M20 40V30h8v10" fill="none" stroke="#C9962B" strokeWidth="3" /></svg>
      <span className="leading-none"><span className={cx('block font-heading text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-navy')}>TN HOMES</span><span className="block text-[9px] font-medium tracking-wide text-gold-300">Properties for a Better Tomorrow</span></span>
    </Link>
  )
}
