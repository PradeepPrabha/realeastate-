import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { customerApi } from '@/services/api'
import { parseApiError } from '@/services/http'

export function useFavorites() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const nav = useNavigate()
  const loc = useLocation()
  const enabled = user?.role === 'customer'
  const q = useQuery({ queryKey: ['favorites'], queryFn: customerApi.favorites, enabled })
  const ids = new Set((q.data ?? []).map((p) => p.id))
  const m = useMutation({
    mutationFn: async (id: number) => (ids.has(id) ? customerApi.removeFavorite(id) : customerApi.addFavorite(id)),
    onSuccess: (_d, id) => { toast.success(ids.has(id) ? 'Removed from saved properties' : 'Saved to your favorites'); void qc.invalidateQueries({ queryKey: ['favorites'] }); void qc.invalidateQueries({ queryKey: ['customer-dashboard'] }) },
    onError: (e) => toast.error(parseApiError(e).message),
  })
  const toggle = (id: number) => {
    if (!user) { toast('Please log in to save properties'); nav('/login', { state: { from: loc.pathname + loc.search } }); return }
    if (user.role !== 'customer') { toast.error('Only customer accounts can save properties'); return }
    m.mutate(id)
  }
  return { isFavorite: (id: number) => ids.has(id), toggle, favorites: q.data ?? [], loading: q.isLoading }
}
