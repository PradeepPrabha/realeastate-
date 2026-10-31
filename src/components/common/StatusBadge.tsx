import { cx, titleCase } from '@/utils/format'

const tones: Record<string, string> = {
  verified: 'bg-green-100 text-green-700', active: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700', confirmed: 'bg-green-100 text-green-700', converted: 'bg-green-100 text-green-700', approved: 'bg-green-100 text-green-700', published: 'bg-green-100 text-green-700', completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700', draft: 'bg-slate-100 text-slate-600', new: 'bg-blue-100 text-blue-700', open: 'bg-blue-100 text-blue-700', reviewing: 'bg-amber-100 text-amber-700', contacted: 'bg-sky-100 text-sky-700',
  interested: 'bg-indigo-100 text-indigo-700', site_visit: 'bg-violet-100 text-violet-700', negotiation: 'bg-orange-100 text-orange-700', assigned: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700', lost: 'bg-red-100 text-red-700', cancelled: 'bg-red-100 text-red-700', failed: 'bg-red-100 text-red-700', blocked: 'bg-red-100 text-red-700', hidden: 'bg-slate-100 text-slate-600',
  inactive: 'bg-slate-100 text-slate-600', sold: 'bg-purple-100 text-purple-700', rented: 'bg-purple-100 text-purple-700', expired: 'bg-slate-200 text-slate-600', closed: 'bg-slate-200 text-slate-600', refunded: 'bg-slate-200 text-slate-600',
  high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600',
}
export default function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[status] ?? 'bg-slate-100 text-slate-600', className)}>{label ?? (status === 'site_visit' ? 'Site Visit' : titleCase(status))}</span>
}
