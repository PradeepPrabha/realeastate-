import {
  BarChart3, Bell, BookOpen, Building2, CalendarCheck, CalendarDays, CreditCard, FolderKanban, Heart, Home, Image, Layers, LayoutDashboard, MapPin, MessageSquare, PlusSquare, ScrollText,
  Scale, Search, Settings, ShieldCheck, Star, TrendingUp, User, Users, UserCog, ClipboardList, Megaphone, ListChecks, type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }
export const NAV: Record<Role, { title: string; items: NavItem[] }> = {
  customer: {
    title: 'Customer Portal',
    items: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/customer/profile', label: 'My Profile', icon: User }, { to: '/customer/favorites', label: 'Saved Properties', icon: Heart },
      { to: '/customer/compare', label: 'Compare Properties', icon: Scale }, { to: '/customer/enquiries', label: 'My Enquiries', icon: MessageSquare }, { to: '/customer/appointments', label: 'Site Visits', icon: CalendarCheck },
      { to: '/customer/alerts', label: 'Property Alerts', icon: Search }, { to: '/customer/sell-requests', label: 'Sell / Rent Requests', icon: Building2 }, { to: '/customer/notifications', label: 'Notifications', icon: Bell },
      { to: '/customer/settings', label: 'Settings', icon: Settings },
    ],
  },
  agent: {
    title: 'Agent CRM',
    items: [
      { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/agent/properties', label: 'My Properties', icon: Building2, end: true }, { to: '/agent/properties/new', label: 'Add Property', icon: PlusSquare },
      { to: '/agent/leads', label: 'Assigned Leads', icon: Users }, { to: '/agent/enquiries', label: 'Enquiries', icon: MessageSquare }, { to: '/agent/followups', label: 'Follow-ups', icon: ListChecks },
      { to: '/agent/appointments', label: 'Site Visits', icon: CalendarCheck }, { to: '/agent/calendar', label: 'Calendar', icon: CalendarDays }, { to: '/agent/reports', label: 'Performance', icon: TrendingUp },
      { to: '/agent/profile', label: 'Profile', icon: User }, { to: '/agent/settings', label: 'Settings', icon: Settings },
    ],
  },
  admin: {
    title: 'Admin Console',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/admin/properties', label: 'Properties', icon: Building2, end: true }, { to: '/admin/properties/new', label: 'Add Property', icon: PlusSquare },
      { to: '/admin/categories', label: 'Property Categories', icon: Layers }, { to: '/admin/locations', label: 'Locations', icon: MapPin }, { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { to: '/admin/agents', label: 'Agents', icon: UserCog }, { to: '/admin/users', label: 'Customers', icon: Users }, { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
      { to: '/admin/leads', label: 'CRM and Leads', icon: ClipboardList }, { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck }, { to: '/admin/sell-requests', label: 'Sell/Rent Requests', icon: Home },
      { to: '/admin/reviews', label: 'Reviews', icon: Star }, { to: '/admin/blogs', label: 'Blog', icon: BookOpen }, { to: '/admin/banners', label: 'Banners', icon: Megaphone },
      { to: '/admin/media', label: 'Media Library', icon: Image }, { to: '/admin/reports', label: 'Reports', icon: BarChart3 }, { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard }, { to: '/admin/settings', label: 'Settings', icon: Settings }, { to: '/admin/roles', label: 'Roles and Permissions', icon: ShieldCheck },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
}
