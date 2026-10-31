import { ChevronDown, LayoutDashboard, LogOut, Menu, Plus, User as UserIcon, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common'
import { homeFor, useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'
import { NAV_LINKS } from '@/utils/constants'
import { cx } from '@/utils/format'

export default function Header() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setOpen(false); setMenu(false) }, [loc.pathname])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const link = ({ isActive }: { isActive: boolean }) => cx('relative py-2 text-sm font-semibold transition hover:text-gold-300', isActive ? 'text-gold-300 after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-gold' : 'text-white')
  const langBtn = (
    <div className="flex items-center gap-1 text-xs font-semibold text-white" role="group" aria-label="Language">
      <button onClick={() => setLang('en')} className={cx('rounded px-1.5 py-1', lang === 'en' ? 'bg-white/20' : 'opacity-70 hover:opacity-100')} aria-pressed={lang === 'en'}>English</button>
      <span className="opacity-40">|</span>
      <button onClick={() => setLang('ta')} className={cx('rounded px-1.5 py-1', lang === 'ta' ? 'bg-white/20' : 'opacity-70 hover:opacity-100')} aria-pressed={lang === 'ta'}>தமிழ்</button>
    </div>
  )
  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={link}>{t(l.key)}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          {langBtn}
          {user ? (
            <div className="relative" ref={ref}>
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 text-sm font-semibold text-white" aria-haspopup="menu" aria-expanded={menu}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-xs font-bold">{user.name[0]}</span>{user.name.split(' ')[0]}<ChevronDown className="h-4 w-4" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl bg-white py-1 shadow-lift">
                  <Link role="menuitem" to={homeFor(user.role)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
                  <Link role="menuitem" to={user.role === 'customer' ? '/customer/profile' : `/${user.role}/${user.role === 'admin' ? 'settings' : 'profile'}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"><UserIcon className="h-4 w-4" />My Profile</Link>
                  <button role="menuitem" onClick={() => { void logout().then(() => nav('/')) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gold-300"><UserIcon className="h-4 w-4" />{t('login')}</Link>
          )}
          <Link to="/sell" className="btn-primary"><Plus className="h-4 w-4" />{t('list')}</Link>
        </div>
        <button className="rounded-lg p-2 text-white lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-navy lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {NAV_LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => cx('rounded-lg px-3 py-3 text-sm font-semibold', isActive ? 'bg-white/10 text-gold-300' : 'text-white')}>{t(l.key)}</NavLink>)}
            <div className="my-2 flex items-center justify-between px-3">{langBtn}</div>
            {user ? (
              <>
                <Link to={homeFor(user.role)} className="rounded-lg px-3 py-3 text-sm font-semibold text-white">Dashboard</Link>
                <button onClick={() => { void logout().then(() => nav('/')) }} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-300">Logout</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3 pt-1"><Link to="/login" className="btn-outline">Login</Link><Link to="/register" className="btn-navy border border-white/30">Register</Link></div>
            )}
            <Link to="/sell" className="btn-primary mx-3 mt-3"><Plus className="h-4 w-4" />{t('list')}</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
