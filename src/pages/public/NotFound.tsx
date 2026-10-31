import { Link } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'

export default function NotFound({ forbidden }: { forbidden?: boolean }) {
  useSeo({ title: forbidden ? 'Access denied' : 'Page not found' })
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div><p className="font-heading text-7xl font-extrabold text-gold">{forbidden ? '403' : '404'}</p><h1 className="mt-2 text-2xl font-extrabold">{forbidden ? 'You do not have access to this page' : 'Page not found'}</h1><p className="mt-1 text-slate-600">{forbidden ? 'Your account does not have permission to view this area.' : 'The page you are looking for does not exist or has moved.'}</p><div className="mt-5 flex justify-center gap-2"><Link to="/" className="btn-primary">Go home</Link><Link to="/buy" className="btn-outline">Browse properties</Link></div></div>
    </div>
  )
}
