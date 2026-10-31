import type { ReactNode } from 'react'
import { cx } from '@/utils/format'

interface Props { label: string; value: string | number; icon: ReactNode; tone?: 'navy' | 'gold' | 'green' | 'blue' | 'red'; hint?: string }
const tones = { navy: 'bg-navy-50 text-navy-600', gold: 'bg-gold-50 text-gold-600', green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600' }
export default function StatCard({ label, value, icon, tone = 'navy', hint }: Props) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-xl', tones[tone])}>{icon}</div>
      <div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="font-heading text-2xl font-extrabold text-navy">{value}</p>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
    </div>
  )
}
