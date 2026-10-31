import { cx, initials } from '@/utils/format'
export default function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  if (src) return <img src={src} alt={name} loading="lazy" className={cx('h-10 w-10 rounded-full object-cover', className)} />
  return <span aria-label={name} className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-500 text-sm font-bold text-white', className)}>{initials(name)}</span>
}
