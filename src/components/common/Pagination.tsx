import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '@/utils/format'

interface Props { page: number; lastPage: number; onChange: (p: number) => void; className?: string }
export default function Pagination({ page, lastPage, onChange, className }: Props) {
  if (lastPage <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= lastPage; i++) if (i === 1 || i === lastPage || Math.abs(i - page) <= 1) pages.push(i); else if (pages[pages.length - 1] !== '…') pages.push('…')
  const base = 'grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium transition'
  return (
    <nav aria-label="Pagination" className={cx('flex flex-wrap items-center justify-center gap-1.5', className)}>
      <button aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cx(base, 'border-slate-300 bg-white hover:bg-navy-50 disabled:opacity-40')}><ChevronLeft className="h-4 w-4" /></button>
      {pages.map((p, i) => p === '…' ? <span key={`e${i}`} className="px-1 text-slate-400">…</span> : (
        <button key={p} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)} className={cx(base, p === page ? 'border-gold bg-gold text-white' : 'border-slate-300 bg-white hover:bg-navy-50')}>{p}</button>
      ))}
      <button aria-label="Next page" disabled={page >= lastPage} onClick={() => onChange(page + 1)} className={cx(base, 'border-slate-300 bg-white hover:bg-navy-50 disabled:opacity-40')}><ChevronRight className="h-4 w-4" /></button>
    </nav>
  )
}
