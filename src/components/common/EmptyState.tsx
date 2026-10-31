import { AlertCircle, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import Button from './Button'

export function EmptyState({ title = 'Nothing here yet', message, action, icon }: { title?: string; message?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-navy-50 text-navy-500">{icon ?? <SearchX className="h-7 w-7" />}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function ErrorState({ message = 'We could not load this data.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
