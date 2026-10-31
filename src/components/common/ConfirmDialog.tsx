import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

interface Props { open: boolean; title?: string; message: string; confirmLabel?: string; loading?: boolean; danger?: boolean; onConfirm: () => void; onCancel: () => void }
export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', loading, danger = true, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" footer={<><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className="flex gap-3"><AlertTriangle className={danger ? 'h-6 w-6 shrink-0 text-red-500' : 'h-6 w-6 shrink-0 text-gold'} /><p className="text-sm text-slate-600">{message}</p></div>
    </Modal>
  )
}
