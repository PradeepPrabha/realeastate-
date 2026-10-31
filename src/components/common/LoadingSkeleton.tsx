import { cx } from '@/utils/format'

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('skeleton rounded-lg', className)} aria-hidden />
export function PropertyCardSkeleton({ list }: { list?: boolean }) {
  return (
    <div className={cx('card overflow-hidden', list && 'sm:flex')} aria-busy>
      <Skeleton className={cx('h-48 rounded-none', list && 'sm:h-auto sm:w-72')} />
      <div className="flex-1 space-y-3 p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /><div className="flex gap-2 pt-2"><Skeleton className="h-9 flex-1" /><Skeleton className="h-9 flex-1" /></div></div>
    </div>
  )
}
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return <div className="space-y-2 p-4" aria-busy>{Array.from({ length: rows }, (_, i) => <div key={i} className="flex gap-3">{Array.from({ length: cols }, (_, j) => <Skeleton key={j} className="h-9 flex-1" />)}</div>)}</div>
}
export const CardGridSkeleton = ({ count = 4 }: { count?: number }) => <>{Array.from({ length: count }, (_, i) => <PropertyCardSkeleton key={i} />)}</>
