import { Breadcrumbs } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'
import PageHero from './PageHero'

const PRIVACY: [string, string][] = [
  ['Information we collect', 'We collect the details you provide when you register, enquire about a property, book a site visit or submit a sell/rent request — such as your name, phone number, email address and preferences — along with basic usage data (pages viewed, device type) to improve the service.'],
  ['How we use your information', 'We use your information to show relevant properties, connect you with agents, send enquiry and appointment updates, prevent fraud and improve TN HOMES. We contact you by email, phone or WhatsApp only where you have given consent.'],
  ['Sharing', 'Your enquiry details are shared with the agent or owner of the property you contacted. We do not sell personal data. We may share data with service providers (email, SMS/WhatsApp, hosting) under confidentiality obligations, or where required by law.'],
  ['Documents and security', 'Supporting property documents are stored privately and are visible only to authorised administrators. Passwords are stored using strong one-way hashing and traffic is encrypted with HTTPS.'],
  ['Cookies and analytics', 'We use cookies and tools such as Google Analytics to understand how the site is used. You can control cookies through your browser settings.'],
  ['Your rights', 'You can view and update your profile, withdraw communication consent, or ask us to delete your account and personal data by contacting us.'],
]
const TERMS: [string, string][] = [
  ['Use of the platform', 'TN HOMES is an online marketplace that helps users discover and enquire about properties. By using the site you agree to provide accurate information and to use it only for lawful purposes.'],
  ['Listings and verification', 'Listings are submitted by owners, builders and agents. The Verified badge indicates that our team has reviewed basic ownership documents and details, but it is not a legal opinion. Buyers should perform independent legal due diligence before any transaction.'],
  ['Accounts', 'You are responsible for keeping your login credentials confidential and for all activity under your account. We may suspend accounts that violate these terms.'],
  ['Fees and payments', 'Searching and enquiring are free. Optional paid services are charged as displayed at the time of purchase and processed through secure payment partners.'],
  ['Limitation of liability', 'TN HOMES is not a party to transactions between users and does not guarantee the accuracy of listing content supplied by third parties, to the extent permitted by law.'],
  ['Governing law', 'These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts in Coimbatore, Tamil Nadu.'],
]
export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const s = useSettings()
  const isP = kind === 'privacy'
  const title = isP ? 'Privacy Policy' : 'Terms and Conditions'
  useSeo({ title, description: isP ? 'How TN HOMES collects, uses and protects your information.' : 'Terms of use for the TN HOMES platform.' })
  return (
    <>
      <PageHero title={title} sub={`Last updated: ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`} />
      <div className="container-page max-w-3xl py-8"><Breadcrumbs items={[{ label: title }]} />
        <div className="card mt-5 space-y-6 p-6">{(isP ? PRIVACY : TERMS).map(([h, t], i) => <section key={h}><h2 className="text-lg font-bold">{i + 1}. {h}</h2><p className="mt-1 text-sm leading-relaxed text-slate-700">{t}</p></section>)}<p className="border-t pt-4 text-sm text-slate-600">Questions? Email <a className="font-semibold text-gold-600" href={`mailto:${s.email}`}>{s.email}</a>.</p></div>
      </div>
    </>
  )
}
