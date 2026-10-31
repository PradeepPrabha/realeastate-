import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '@/components/common'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import { RequireRole } from './guards'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lz = <M extends Record<string, ComponentType<any>>, K extends keyof M>(f: () => Promise<M>, k: K) => lazy(() => f().then((m) => ({ default: m[k] })))

const Home = lazy(() => import('@/pages/public/Home'))
const Listing = lazy(() => import('@/pages/public/PropertyListing'))
const PropertyDetail = lazy(() => import('@/pages/public/PropertyDetail'))
const Compare = lazy(() => import('@/pages/public/Compare'))
const Projects = lazy(() => import('@/pages/public/Projects'))
const ProjectDetail = lazy(() => import('@/pages/public/ProjectDetail'))
const Agents = lazy(() => import('@/pages/public/Agents'))
const AgentProfile = lazy(() => import('@/pages/public/AgentProfile'))
const Locations = lazy(() => import('@/pages/public/Locations'))
const About = lazy(() => import('@/pages/public/About'))
const Contact = lazy(() => import('@/pages/public/Contact'))
const Sell = lazy(() => import('@/pages/public/SellProperty'))
const Blog = lazy(() => import('@/pages/public/Blog'))
const BlogDetail = lazy(() => import('@/pages/public/BlogDetail'))
const FAQ = lazy(() => import('@/pages/public/FAQ'))
const Legal = lazy(() => import('@/pages/public/Legal'))
const NotFound = lazy(() => import('@/pages/public/NotFound'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Forgot = lazy(() => import('@/pages/auth/ForgotPassword'))
const Reset = lazy(() => import('@/pages/auth/ResetPassword'))

const C = (k: string) => lz(() => import('@/pages/customer/CustomerPages') as Promise<Record<string, ComponentType>>, k)
const A = (k: string) => lz(() => import('@/pages/agent/AgentPages') as Promise<Record<string, ComponentType>>, k)
const M = (k: string) => lz(() => import('@/pages/admin/AdminPages') as Promise<Record<string, ComponentType>>, k)
const Profile = lz(() => import('@/pages/customer/CustomerPages'), 'ProfileSettings')
const AgentLeads = lz(() => import('@/pages/agent/AgentPages'), 'AgentLeads')
const Notifications = C('NotificationsPage')

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner full />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="buy" element={<Listing preset="buy" />} />
          <Route path="rent" element={<Listing preset="rent" />} />
          <Route path="commercial" element={<Listing preset="commercial" />} />
          <Route path="land" element={<Listing preset="land" />} />
          <Route path="property/:slug" element={<PropertyDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:slug" element={<ProjectDetail />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agents/:id" element={<AgentProfile />} />
          <Route path="locations" element={<Locations />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="sell" element={<Sell />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="privacy" element={<Legal kind="privacy" />} />
          <Route path="terms" element={<Legal kind="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<Forgot />} />
        <Route path="reset-password" element={<Reset />} />

        <Route path="customer" element={<RequireRole role="customer" />}>
          <Route element={<DashboardLayout role="customer" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {(['dashboard:CustomerDashboard', 'favorites:CustomerFavorites', 'compare:CustomerCompare', 'enquiries:CustomerEnquiries', 'appointments:CustomerAppointments', 'alerts:CustomerAlerts', 'sell-requests:CustomerSellRequests', 'settings:CustomerSettings'] as const).map((s) => { const [p, k] = s.split(':'); const El = C(k); return <Route key={p} path={p} element={<El />} /> })}
            <Route path="profile" element={<Profile title="My Profile" />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route path="agent" element={<RequireRole role="agent" />}>
          <Route element={<DashboardLayout role="agent" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {(['dashboard:AgentDashboard', 'properties:AgentProperties', 'properties/new:AgentPropertyForm', 'properties/:id/edit:AgentPropertyForm', 'appointments:AgentAppointments', 'calendar:AgentCalendar', 'reports:AgentReports'] as const).map((s) => { const i = s.lastIndexOf(':'); const El = A(s.slice(i + 1)); return <Route key={s} path={s.slice(0, i)} element={<El />} /> })}
            <Route path="leads" element={<AgentLeads mode="leads" />} />
            <Route path="enquiries" element={<AgentLeads mode="enquiries" />} />
            <Route path="followups" element={<AgentLeads mode="followups" />} />
            <Route path="profile" element={<Profile title="Profile" />} />
            <Route path="settings" element={<AgentSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route path="admin" element={<RequireRole role="admin" />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {(['dashboard:AdminDashboard', 'properties:AdminProperties', 'properties/new:AdminPropertyForm', 'properties/:id/edit:AdminPropertyForm', 'categories:AdminCategories', 'locations:AdminLocations', 'projects:AdminProjects', 'agents:AdminAgents', 'users:AdminCustomers', 'enquiries:AdminEnquiries', 'leads:AdminLeads', 'appointments:AdminAppointments', 'sell-requests:AdminSellRequests', 'reviews:AdminReviews', 'blogs:AdminBlogs', 'banners:AdminBanners', 'media:AdminMedia', 'reports:AdminReports', 'notifications:AdminNotifications', 'payments:AdminPayments', 'settings:AdminSettings', 'roles:AdminRoles', 'audit-logs:AdminAuditLogs'] as const).map((s) => { const i = s.lastIndexOf(':'); const El = M(s.slice(i + 1)); return <Route key={s} path={s.slice(0, i)} element={<El />} /> })}
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
const AgentSettings = C('CustomerSettings')
