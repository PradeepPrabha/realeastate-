import { useQuery } from '@tanstack/react-query'
import { Bell, ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Logo } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import { notificationApi } from '@/services/api'
import type { Role } from '@/types'
import { cx } from '@/utils/format'
import { NAV } from './navConfig'

export default function DashboardLayout({ role }: { role: Role }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const cfg = NAV[role]
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [loc.pathname])
  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list, refetchInterval: 60000 })
  const unread = (notes.data ?? []).filter((n) => !n.read).length
  const current = cfg.items.filter((i) => loc.pathname === i.to || loc.pathname.startsWith(i.to + '/')).sort((a, b) => b.to.length - a.to.length)[0]

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-slate-200">
      <div className="flex h-16 shrink-0 items-center justify-between px-4"><Logo /><button className="rounded p-1 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
      <p className="px-5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">{cfg.title}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label={cfg.title}>
        {cfg.items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-gold text-white' : 'hover:bg-white/10')}>
            <Icon className="h-[18px] w-[18px] shrink-0" /><span className="truncate">{label}</span>
            {label === 'Notifications' && unread > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <button onClick={() => { void logout().then(() => nav('/login')) }} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-white/10"><LogOut className="h-[18px] w-[18px]" />Logout</button>
    </div>
  )
  return (
    <div className="min-h-screen bg-brand-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</aside></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <h1 className="truncate text-lg font-extrabold">{current?.label ?? cfg.title}</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link to="/" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-navy-500 hover:bg-navy-50 sm:flex"><ExternalLink className="h-4 w-4" />View site</Link>
            <Link to={`/${role}/notifications`} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative rounded-lg p-2 hover:bg-slate-100"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}</Link>
            {user && <div className="flex items-center gap-2"><Avatar name={user.name} className="h-9 w-9" /><div className="hidden leading-tight sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs capitalize text-slate-500">{user.role}</p></div></div>}
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
