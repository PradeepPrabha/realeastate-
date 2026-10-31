import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { tr, type Lang } from '@/utils/i18n'

interface LangState { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }
const Ctx = createContext<LangState | null>(null)
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('tnh_lang') === 'ta' ? 'ta' : 'en'))
  const value = useMemo<LangState>(() => ({ lang, setLang: (l) => { localStorage.setItem('tnh_lang', l); setLangState(l); document.documentElement.lang = l }, t: (k) => tr(k, lang) }), [lang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useLang() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang must be used within LangProvider')
  return c
}
