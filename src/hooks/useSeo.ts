import { useEffect } from 'react'

interface Seo { title: string; description?: string; image?: string; canonical?: string; jsonLd?: Record<string, unknown> }
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
export function useSeo({ title, description, image, canonical, jsonLd }: Seo) {
  useEffect(() => {
    const full = title.includes('TN HOMES') ? title : `${title} | TN HOMES`
    document.title = full
    const desc = description ?? 'Buy, rent and lease verified residential, commercial and land properties across Tamil Nadu.'
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', full); setMeta('property', 'og:description', desc); setMeta('property', 'og:type', 'website')
    if (image) setMeta('property', 'og:image', image.startsWith('http') ? image : window.location.origin + image)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = canonical ?? window.location.origin + window.location.pathname
    let script = document.getElementById('jsonld') as HTMLScriptElement | null
    if (jsonLd) {
      if (!script) { script = document.createElement('script'); script.id = 'jsonld'; script.type = 'application/ld+json'; document.head.appendChild(script) }
      script.textContent = JSON.stringify(jsonLd)
    } else script?.remove()
  }, [title, description, image, canonical, jsonLd])
}
