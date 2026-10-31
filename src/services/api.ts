import type {
  Agent, Appointment, AuthResponse, Banner, Blog, Category, Enquiry, Faq, Lead, Location, NotificationItem, Paginated, Project, Property, PropertyFilters, Review, SavedSearch, SellRentRequest, SiteSettings, User,
} from '@/types'
import { delData, getData, getPage, patchData, postData, putData } from './http'

type Q = Record<string, unknown>
const clean = (f: Q): Q => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]))

export const authApi = {
  register: (b: { name: string; email: string; phone?: string; password: string; whatsappConsent?: boolean }) => postData<AuthResponse>('/auth/register', b),
  login: (b: { email: string; password: string }) => postData<AuthResponse>('/auth/login', b),
  logout: () => postData<{ message: string }>('/auth/logout'),
  me: () => getData<User>('/auth/me'),
  forgot: (email: string) => postData<{ message: string; resetToken?: string }>('/auth/forgot-password', { email }),
  reset: (b: { token: string; password: string }) => postData<{ message: string }>('/auth/reset-password', b),
  updateProfile: (b: Partial<User>) => putData<User>('/auth/profile', b),
  changePassword: (b: { currentPassword: string; newPassword: string }) => putData<{ message: string }>('/auth/password', b),
}

export interface PropertyDetail { property: Property; similar: Property[]; agent?: Agent }
export const publicApi = {
  properties: (f: PropertyFilters) => getPage<Property>('/properties', clean({ ...f })),
  featured: () => getData<Property[]>('/properties/featured'),
  latest: () => getData<Property[]>('/properties/latest'),
  property: (slug: string) => getData<PropertyDetail>(`/properties/${slug}`),
  mapPoints: (f: PropertyFilters) => getData<{ id: number; slug: string; title: string; lat: number; lng: number; price: number; purpose: string }[]>('/properties/map', clean({ ...f })),
  compare: (ids: number[]) => postData<Property[]>('/properties/compare', { ids }),
  categories: () => getData<Category[]>('/categories'),
  locations: () => getData<Location[]>('/locations'),
  projects: (q?: Q) => getData<Project[]>('/projects', q),
  project: (slug: string) => getData<Project>(`/projects/${slug}`),
  agents: (q?: Q) => getData<Agent[]>('/agents', q),
  agent: (id: number | string) => getData<{ agent: Agent; properties: Property[] }>(`/agents/${id}`),
  blogs: (q?: Q) => getData<Blog[]>('/blogs', q),
  blog: (slug: string) => getData<{ blog: Blog; related: Blog[] }>(`/blogs/${slug}`),
  faqs: () => getData<Faq[]>('/faqs'),
  testimonials: () => getData<Review[]>('/testimonials'),
  banners: () => getData<Banner[]>('/banners'),
  settings: () => getData<SiteSettings>('/settings/public'),
  stats: () => getData<{ properties: number; agents: number; cities: number; customers: number; byCity: Record<string, number> }>('/stats'),
  contact: (b: Q) => postData<{ message: string }>('/contact', b),
  newsletter: (email: string) => postData<{ message: string }>('/newsletter', { email }),
  enquire: (b: Q) => postData<Enquiry>('/enquiries', b),
  sellRequest: (b: Q) => postData<SellRentRequest>('/sell-rent-requests', b),
}

export interface CustomerDashboard { totalEnquiries: number; savedProperties: number; upcomingAppointments: number; alerts: number; recent: { id: string; text: string; at: string }[] }
export const customerApi = {
  dashboard: () => getData<CustomerDashboard>('/customer/dashboard'),
  favorites: () => getData<Property[]>('/customer/favorites'),
  addFavorite: (propertyId: number) => postData<{ propertyId: number }>('/customer/favorites', { propertyId }),
  removeFavorite: (propertyId: number) => delData(`/customer/favorites/${propertyId}`),
  enquiries: () => getData<Enquiry[]>('/customer/enquiries'),
  enquire: (b: Q) => postData<Enquiry>('/customer/enquiries', b),
  appointments: () => getData<Appointment[]>('/customer/appointments'),
  book: (b: Q) => postData<Appointment>('/customer/appointments', b),
  cancelAppointment: (id: number) => patchData<Appointment>(`/customer/appointments/${id}`, { status: 'cancelled' }),
  sellRequests: () => getData<SellRentRequest[]>('/customer/sell-rent-requests'),
  sellRequest: (b: Q) => postData<SellRentRequest>('/customer/sell-rent-requests', b),
  alerts: () => getData<SavedSearch[]>('/customer/alerts'),
  addAlert: (b: Q) => postData<SavedSearch>('/customer/alerts', b),
  removeAlert: (id: number) => delData(`/customer/alerts/${id}`),
}
export const notificationApi = {
  list: () => getData<NotificationItem[]>('/notifications'),
  readAll: () => postData<{ message: string }>('/notifications/read-all'),
  read: (id: number) => patchData<NotificationItem>(`/notifications/${id}/read`),
}

export interface AgentDashboard { properties: number; leads: number; newEnquiries: number; contacted: number; upcomingVisits: number; converted: number; funnel: { status: string; count: number }[]; followUps: Lead[] }
export interface AgentReport { conversionRate: number; totalViews: number; totalLeads: number; funnel: { status: string; count: number }[]; topProperties: { title: string; views: number; city: string }[]; monthly: { month: string; leads: number; converted: number }[] }
export const agentApi = {
  dashboard: () => getData<AgentDashboard>('/agent/dashboard'),
  properties: (q?: Q) => getPage<Property>('/agent/properties', q),
  createProperty: (b: Q) => postData<Property>('/agent/properties', b),
  updateProperty: (id: number, b: Q) => putData<Property>(`/agent/properties/${id}`, b),
  leads: (q?: Q) => getData<Lead[]>('/agent/leads', q),
  setLeadStatus: (id: number, b: Q) => patchData<Lead>(`/agent/leads/${id}/status`, b),
  addActivity: (id: number, b: Q) => postData<Lead>(`/agent/leads/${id}/activities`, b),
  appointments: () => getData<Appointment[]>('/agent/appointments'),
  updateAppointment: (id: number, b: Q) => patchData<Appointment>(`/agent/appointments/${id}`, b),
  schedule: (b: Q) => postData<Appointment>('/agent/appointments', b),
  reports: () => getData<AgentReport>('/agent/reports'),
}

export interface AdminDashboard {
  totalProperties: number; activeProperties: number; pendingApproval: number; agents: number; customers: number; enquiries: number; openEnquiries: number; appointments: number; converted: number; revenue: number
  monthly: { month: string; enquiries: number; properties: number; visits: number }[]; recentEnquiries: Enquiry[]; pending: Property[]
}
export interface AdminReport {
  monthly: { month: string; views: number; enquiries: number; appointments: number; conversions: number }[]
  byCity: { name: string; value: number }[]; byType: { name: string; value: number }[]; byStatus: { name: string; value: number }[]; leadFunnel: { name: string; value: number }[]
  topProperties: { id: number; code: string; title: string; city: string; views: number }[]; agentPerformance: { name: string; leads: number; converted: number }[]
}
export const adminApi = {
  dashboard: () => getData<AdminDashboard>('/admin/dashboard'),
  reports: () => getData<AdminReport>('/admin/reports'),
  settings: () => getData<SiteSettings>('/admin/settings'),
  saveSettings: (b: Partial<SiteSettings>) => putData<SiteSettings>('/admin/settings', b),
  properties: (q?: Q) => getPage<Property>('/admin/properties', q),
  property: (id: number) => getData<Property>(`/admin/properties/${id}`),
  createProperty: (b: Q) => postData<Property>('/admin/properties', b),
  updateProperty: (id: number, b: Q) => putData<Property>(`/admin/properties/${id}`, b),
  deleteProperty: (id: number) => delData(`/admin/properties/${id}`),
  approve: (id: number) => postData<Property>(`/admin/properties/${id}/approve`),
  reject: (id: number, reason: string) => postData<Property>(`/admin/properties/${id}/reject`, { reason }),
  assignEnquiry: (id: number, agentId: number) => postData<Enquiry>(`/admin/enquiries/${id}/assign`, { agentId }),
  assignLead: (id: number, agentId: number) => postData<Lead>(`/admin/leads/${id}/assign`, { agentId }),
  createAgent: (b: Q) => postData<Agent>('/admin/agents', b),
  resetDemo: () => postData<{ message: string }>('/admin/reset-demo'),
  list: <T,>(resource: string, q?: Q) => getPage<T>(`/admin/${resource}`, q),
  create: <T,>(resource: string, b: Q) => postData<T>(`/admin/${resource}`, b),
  update: <T,>(resource: string, id: number, b: Q) => putData<T>(`/admin/${resource}/${id}`, b),
  remove: (resource: string, id: number) => delData(`/admin/${resource}/${id}`),
}
export type { Paginated }
