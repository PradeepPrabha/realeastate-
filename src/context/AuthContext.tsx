import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role, User } from '@/types'
import { authApi } from '@/services/api'
import { TOKEN_KEY } from '@/services/http'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (b: { name: string; email: string; phone?: string; password: string; whatsappConsent?: boolean }) => Promise<User>
  logout: () => Promise<void>
  setUser: (u: User) => void
  hasRole: (...roles: Role[]) => boolean
}
const Ctx = createContext<AuthState | null>(null)
export const homeFor = (role: Role) => `/${role}/dashboard`

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    authApi.me().then(setUser).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('tnh:unauthorized', onUnauthorized)
    return () => window.removeEventListener('tnh:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login({ email, password })
    localStorage.setItem(TOKEN_KEY, r.token); setUser(r.user); return r.user
  }, [])
  const register = useCallback(async (b: Parameters<AuthState['register']>[0]) => {
    const r = await authApi.register(b)
    localStorage.setItem(TOKEN_KEY, r.token); setUser(r.user); return r.user
  }, [])
  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY); setUser(null)
  }, [])

  const value = useMemo<AuthState>(() => ({ user, loading, login, register, logout, setUser, hasRole: (...roles) => !!user && roles.includes(user.role) }), [user, loading, login, register, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
