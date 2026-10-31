import { Modal } from '@/components/common'
import type { Property } from '@/types'
import EnquiryForm from './EnquiryForm'

export default function EnquiryModal({ open, onClose, property }: { open: boolean; onClose: () => void; property?: Property }) {
  return <Modal open={open} onClose={onClose} title={property ? `Contact about ${property.title}` : 'Send an enquiry'}><EnquiryForm property={property} onDone={onClose} /></Modal>
}
