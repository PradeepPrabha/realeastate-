import type { ReactNode } from 'react'
import { cx } from '@/utils/format'
import { EmptyState } from './EmptyState'
import { TableSkeleton } from './LoadingSkeleton'
import Pagination from './Pagination'

export interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode; className?: string }
interface Props<T> {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string | number; loading?: boolean; emptyTitle?: string; emptyMessage?: string
  meta?: { page: number; lastPage: number; total: number; perPage: number }; onPage?: (p: number) => void; onRowClick?: (r: T) => void
}
export default function DataTable<T>({ columns, rows, rowKey, loading, emptyTitle = 'No records found', emptyMessage = 'Try changing your search or filters.', meta, onPage, onRowClick }: Props<T>) {
  if (loading) return <div className="card"><TableSkeleton cols={Math.min(columns.length, 6)} /></div>
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-navy-50 text-xs uppercase tracking-wide text-navy-600"><tr>{columns.map((c) => <th key={c.key} className={cx('px-4 py-3 font-semibold', c.className)}>{c.header}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('hover:bg-slate-50', onRowClick && 'cursor-pointer')}>
                {columns.map((c) => <td key={c.key} className={cx('px-4 py-3 align-middle', c.className)}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta && onPage && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">Showing {(meta.page - 1) * meta.perPage + 1}–{Math.min(meta.page * meta.perPage, meta.total)} of {meta.total}</p>
          <Pagination page={meta.page} lastPage={meta.lastPage} onChange={onPage} />
        </div>
      )}
    </div>
  )
}
