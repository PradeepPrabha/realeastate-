export type Role = 'admin' | 'agent' | 'customer'
export type Purpose = 'sale' | 'rent' | 'lease'
export type CategoryGroup = 'residential' | 'commercial' | 'land'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ListingStatus = 'draft' | 'active' | 'inactive' | 'sold' | 'rented' | 'expired'
export type ConstructionStatus = 'ready' | 'under_construction' | 'new_launch'
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'site_visit' | 'negotiation' | 'converted' | 'lost'
export type Priority = 'low' | 'medium' | 'high'
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: Role
  avatar?: string
  city?: string
  address?: string
  status: 'active' | 'blocked'
  whatsappConsent?: boolean
  emailConsent?: boolean
  createdAt: string
}

export interface Location {
  id: number
  name: string
  nameTa?: string
  type: 'state' | 'district' | 'city' | 'town' | 'locality'
  parentId: number | null
  pincode?: string
  image?: string
  active: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  group: CategoryGroup
  description: string
  image: string
  active: boolean
}

export interface Agent {
  id: number
  userId: number
  name: string
  email: string
  phone: string
  whatsapp: string
  photo?: string
  bio: string
  specialization: string
  city: string
  experienceYears: number
  languages: string[]
  reraId?: string
  rating: number
  status: 'active' | 'inactive'
}

export interface Property {
  id: number
  code: string
  slug: string
  title: string
  description: string
  purpose: Purpose
  group: CategoryGroup
  type: string
  price: number
  rent?: number
  deposit?: number
  district: string
  city: string
  locality: string
  address: string
  pincode: string
  lat: number
  lng: number
  bedrooms: number
  bathrooms: number
  builtUpArea: number
  plotArea?: number
  areaUnit: 'sqft' | 'sqm' | 'cent' | 'acre' | 'ground'
  facing: string
  furnishing: string
  floor?: number
  totalFloors?: number
  parking: number
  ageYears: number
  construction: ConstructionStatus
  amenities: string[]
  images: string[]
  videoUrl?: string
  tourUrl?: string
  floorPlans: string[]
  rera?: string
  featured: boolean
  isNew?: boolean
  verification: VerificationStatus
  listing: ListingStatus
  agentId: number
  ownerId?: number
  views: number
  seoTitle?: string
  seoDescription?: string
  createdAt: string
}

export interface Project {
  id: number
  slug: string
  name: string
  builder: string
  city: string
  locality: string
  tag: 'New Launch' | 'Featured' | 'Popular' | 'Premium'
  startingPrice: number
  configurations: string
  status: 'Under Construction' | 'Ready to Move' | 'New Launch'
  rera: string
  possession: string
  description: string
  image: string
  gallery: string[]
  amenities: string[]
  units: { type: string; area: string; price: number }[]
  active: boolean
}

export interface Enquiry {
  id: number
  code: string
  propertyId?: number
  propertyTitle?: string
  userId?: number
  name: string
  phone: string
  email: string
  message: string
  budget?: number
  source: string
  assignedAgentId?: number
  status: 'open' | 'assigned' | 'closed'
  createdAt: string
}

export interface LeadActivity {
  id: number
  type: 'note' | 'call' | 'email' | 'status' | 'visit'
  text: string
  by: string
  createdAt: string
}

export interface Lead {
  id: number
  code: string
  enquiryId?: number
  name: string
  phone: string
  email: string
  propertyId?: number
  propertyTitle?: string
  budget: number
  source: string
  agentId: number | null
  status: LeadStatus
  priority: Priority
  nextFollowUp?: string
  notes: string
  activities: LeadActivity[]
  createdAt: string
}

export interface Appointment {
  id: number
  code: string
  propertyId: number
  propertyTitle: string
  userId: number
  customerName: string
  phone: string
  agentId: number
  date: string
  time: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}

export interface SellRentRequest {
  id: number
  code: string
  userId?: number
  name: string
  phone: string
  email: string
  purpose: Purpose
  type: string
  city: string
  locality: string
  expectedPrice: number
  description: string
  status: 'new' | 'reviewing' | 'approved' | 'rejected'
  createdAt: string
}

export interface Review {
  id: number
  name: string
  city: string
  rating: number
  text: string
  avatar?: string
  status: 'pending' | 'published' | 'hidden'
}

export interface Blog {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  author: string
  published: boolean
  createdAt: string
}

export interface Banner {
  id: number
  title: string
  subtitle: string
  image: string
  link: string
  active: boolean
}

export interface Faq {
  id: number
  category: string
  question: string
  answer: string
}

export interface NotificationItem {
  id: number
  userId: number
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface SavedSearch {
  id: number
  userId: number
  label: string
  query: string
  frequency: 'instant' | 'daily' | 'weekly'
  createdAt: string
}

export interface Payment {
  id: number
  code: string
  userName: string
  purpose: string
  amount: number
  method: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  createdAt: string
}

export interface AuditLog {
  id: number
  actor: string
  action: string
  entity: string
  entityId?: number
  ip: string
  createdAt: string
}

export interface RoleDef {
  id: number
  name: string
  permissions: string[]
}

export interface MediaFile {
  id: number
  name: string
  url: string
  size: number
  type: string
  createdAt: string
}

export interface SiteSettings {
  siteName: string
  tagline: string
  email: string
  phone: string
  whatsapp: string
  address: string
  hours: string
  requireVerification: boolean
  autoApproveAgentListings: boolean
  listingExpiryDays: number
  gaId: string
  mapsKey: string
  social: { facebook: string; instagram: string; youtube: string; linkedin: string }
}

export interface Paginated<T> {
  data: T[]
  meta: { page: number; perPage: number; total: number; lastPage: number; facets?: Record<string, Record<string, number>> }
}

export interface PropertyFilters {
  purpose?: Purpose
  group?: CategoryGroup
  type?: string[]
  city?: string
  district?: string
  locality?: string
  q?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  facing?: string
  furnishing?: string
  construction?: string[]
  amenities?: string[]
  rera?: boolean
  featured?: boolean
  verified?: boolean
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'area_desc'
  page?: number
  perPage?: number
}

export interface AuthResponse {
  token: string
  user: User
}
