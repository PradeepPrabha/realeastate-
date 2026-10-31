import type {
  Agent, Appointment, AuditLog, Banner, Blog, Category, Enquiry, Faq, Lead, Location, MediaFile, NotificationItem,
  Payment, Project, Property, Review, RoleDef, SavedSearch, SellRentRequest, SiteSettings, User,
} from '@/types'

/* Deterministic RNG so demo data is stable between reloads */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261030)
const pick = <T,>(a: T[]): T => a[Math.floor(rand() * a.length)]
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1))
const NOW = new Date('2026-10-30T09:00:00+05:30').getTime()
const daysAgo = (d: number) => new Date(NOW - d * 86400000).toISOString()
const daysAhead = (d: number) => new Date(NOW + d * 86400000).toISOString().slice(0, 10)
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/* ---------- Locations ---------- */
const CITY_DATA: { city: string; district: string; lat: number; lng: number; pin: string; localities: string[] }[] = [
  { city: 'Chennai', district: 'Chennai', lat: 13.0827, lng: 80.2707, pin: '600001', localities: ['Thoraipakkam', 'Navallur', 'ECR', 'Madipakkam', 'T. Nagar', 'OMR', 'Adyar'] },
  { city: 'Coimbatore', district: 'Coimbatore', lat: 11.0168, lng: 76.9558, pin: '641001', localities: ['Saravanampatti', 'Avinashi Road', 'Singanallur', 'Gandhipuram', 'Sirumugai', 'RS Puram', 'Peelamedu'] },
  { city: 'Madurai', district: 'Madurai', lat: 9.9252, lng: 78.1198, pin: '625001', localities: ['KK Nagar', 'Anna Nagar', 'Thirunagar', 'Goripalayam'] },
  { city: 'Tiruchirappalli', district: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, pin: '620001', localities: ['Srirangam', 'Thillai Nagar', 'Woraiyur'] },
  { city: 'Salem', district: 'Salem', lat: 11.6643, lng: 78.146, pin: '636001', localities: ['Fairlands', 'Hasthampatti', 'Alagapuram'] },
  { city: 'Tiruppur', district: 'Tiruppur', lat: 11.1085, lng: 77.3411, pin: '641601', localities: ['Kangeyam Road', 'Avinashi', 'Palladam Road'] },
  { city: 'Erode', district: 'Erode', lat: 11.341, lng: 77.7172, pin: '638001', localities: ['Perundurai Road', 'Surampatti', 'Brough Road'] },
  { city: 'Hosur', district: 'Krishnagiri', lat: 12.7409, lng: 77.8253, pin: '635109', localities: ['Mathigiri', 'Bagalur Road', 'SIPCOT'] },
  { city: 'Thanjavur', district: 'Thanjavur', lat: 10.787, lng: 79.1378, pin: '613001', localities: ['Medical College Road', 'Vallam'] },
  { city: 'Vellore', district: 'Vellore', lat: 12.9165, lng: 79.1325, pin: '632001', localities: ['Katpadi', 'Sathuvachari'] },
  { city: 'Dindigul', district: 'Dindigul', lat: 10.3673, lng: 77.9803, pin: '624001', localities: ['Palani Road', 'Nagal Nagar'] },
  { city: 'Tirunelveli', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567, pin: '627001', localities: ['Palayamkottai', 'Melapalayam'] },
]
export const SEED_LOCATIONS: Location[] = (() => {
  const out: Location[] = [{ id: 1, name: 'Tamil Nadu', nameTa: 'தமிழ்நாடு', type: 'state', parentId: null, active: true }]
  let id = 2
  const districtIds = new Map<string, number>()
  for (const c of CITY_DATA) {
    if (!districtIds.has(c.district)) {
      districtIds.set(c.district, id)
      out.push({ id: id++, name: c.district, type: 'district', parentId: 1, active: true })
    }
    const cityId = id++
    out.push({ id: cityId, name: c.city, type: 'city', parentId: districtIds.get(c.district)!, pincode: c.pin, active: true })
    for (const l of c.localities) out.push({ id: id++, name: l, type: 'locality', parentId: cityId, pincode: c.pin, active: true })
  }
  return out
})()

/* ---------- Categories ---------- */
export const SEED_CATEGORIES: Category[] = [
  { id: 1, name: 'Apartment', slug: 'apartment', group: 'residential', description: 'Modern apartments for every lifestyle', image: '/images/ph-apartment.svg', active: true },
  { id: 2, name: 'Independent House', slug: 'independent-house', group: 'residential', description: 'Spacious homes for your family', image: '/images/ph-house.svg', active: true },
  { id: 3, name: 'Villa', slug: 'villa', group: 'residential', description: 'Premium villas with modern amenities', image: '/images/ph-villa.svg', active: true },
  { id: 4, name: 'Residential Plot', slug: 'residential-plot', group: 'land', description: 'Build your dream home', image: '/images/ph-plot.svg', active: true },
  { id: 5, name: 'Agricultural Land', slug: 'agricultural-land', group: 'land', description: 'Fertile land for better opportunities', image: '/images/ph-agri.svg', active: true },
  { id: 6, name: 'Commercial Property', slug: 'commercial-property', group: 'commercial', description: 'Office, retail & business spaces', image: '/images/ph-commercial.svg', active: true },
  { id: 7, name: 'Office Space', slug: 'office-space', group: 'commercial', description: 'Spaces for growing businesses', image: '/images/ph-office.svg', active: true },
  { id: 8, name: 'Shop / Warehouse', slug: 'shop-warehouse', group: 'commercial', description: 'Retail and storage solutions', image: '/images/ph-shop.svg', active: true },
]
const TYPE_GROUP: Record<string, Property['group']> = Object.fromEntries(SEED_CATEGORIES.map((c) => [c.name, c.group]))
const TYPE_IMG: Record<string, string[]> = {
  Apartment: ['/images/ph-apartment.svg', '/images/villa-blue.webp'],
  'Independent House': ['/images/villa-sunset.webp', '/images/ph-house.svg'],
  Villa: ['/images/villa-blue.webp', '/images/villa-sunset.webp', '/images/ph-villa.svg'],
  'Residential Plot': ['/images/ph-plot.svg'],
  'Agricultural Land': ['/images/ph-agri.svg'],
  'Commercial Property': ['/images/ph-commercial.svg'],
  'Office Space': ['/images/ph-office.svg'],
  'Shop / Warehouse': ['/images/ph-shop.svg'],
}

/* ---------- Users & agents ---------- */
const AGENT_NAMES = [
  ['Karthik Raman', 'Chennai', 'Premium apartments & villas'], ['Meena Sundaram', 'Coimbatore', 'Independent houses & plots'],
  ['Vignesh Palani', 'Madurai', 'Commercial & retail spaces'], ['Divya Lakshmi', 'Tiruchirappalli', 'Residential rentals'],
  ['Senthil Kumar', 'Salem', 'Agricultural land & farmhouses'], ['Priya Nataraj', 'Tiruppur', 'Warehouses & industrial'],
]
export const SEED_USERS: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@tnhomes.in', phone: '+91 98765 43210', role: 'admin', status: 'active', city: 'Coimbatore', createdAt: daysAgo(400) },
  ...AGENT_NAMES.map(([name], i): User => ({ id: 2 + i, name, email: i === 0 ? 'agent@tnhomes.in' : `${kebab(name)}@tnhomes.in`, phone: `+91 9${between(100000000, 999999999)}`, role: 'agent', status: 'active', city: AGENT_NAMES[i][1], createdAt: daysAgo(300 - i * 20) })),
  { id: 8, name: 'Arun Kumar', email: 'customer@tnhomes.in', phone: '+91 98430 11223', role: 'customer', status: 'active', city: 'Coimbatore', whatsappConsent: true, emailConsent: true, createdAt: daysAgo(120) },
  { id: 9, name: 'Lakshmi Narayanan', email: 'lakshmi@example.com', phone: '+91 97890 55667', role: 'customer', status: 'active', city: 'Chennai', createdAt: daysAgo(90) },
  { id: 10, name: 'Suresh Babu', email: 'suresh@example.com', phone: '+91 99440 88776', role: 'customer', status: 'active', city: 'Madurai', createdAt: daysAgo(60) },
  { id: 11, name: 'Nithya Prakash', email: 'nithya@example.com', phone: '+91 90030 44521', role: 'customer', status: 'active', city: 'Salem', createdAt: daysAgo(30) },
  { id: 12, name: 'Ramesh Iyer', email: 'ramesh@example.com', phone: '+91 94430 77812', role: 'customer', status: 'blocked', city: 'Tiruppur', createdAt: daysAgo(15) },
]
export const SEED_PASSWORDS: Record<string, string> = { 'admin@tnhomes.in': 'Admin@123', 'agent@tnhomes.in': 'Agent@123', 'customer@tnhomes.in': 'Customer@123' }

export const SEED_AGENTS: Agent[] = AGENT_NAMES.map(([name, city, spec], i) => ({
  id: i + 1, userId: 2 + i, name, email: SEED_USERS[1 + i].email, phone: SEED_USERS[1 + i].phone, whatsapp: SEED_USERS[1 + i].phone.replace(/\D/g, ''),
  bio: `${name} has helped hundreds of families and investors find the right property in ${city}. Known for transparent pricing, thorough document verification and responsive follow-ups.`,
  specialization: spec, city, experienceYears: 4 + i * 2, languages: ['Tamil', 'English', i % 2 ? 'Hindi' : 'Telugu'], reraId: `TN/AG/2024/${1200 + i * 37}`,
  rating: Number((4.4 + (i % 5) * 0.12).toFixed(1)), status: 'active',
}))

/* ---------- Properties ---------- */
const AMENITIES = ['Car Parking', 'Lift', 'Power Backup', '24x7 Security', 'Swimming Pool', 'Gym', "Children's Play Area", 'Club House', 'Garden', 'CCTV', 'Water Supply', 'Gated Community', 'Vastu Compliant']
export const ALL_AMENITIES = AMENITIES
const TYPES = Object.keys(TYPE_GROUP)

function makeProperty(id: number): Property {
  const type = TYPES[(id * 3 + Math.floor(rand() * 3)) % TYPES.length]
  const group = TYPE_GROUP[type]
  const c = CITY_DATA[(id * 5 + between(0, 2)) % CITY_DATA.length]
  const locality = pick(c.localities)
  const purpose: Property['purpose'] = group === 'land' ? (rand() < 0.95 ? 'sale' : 'lease') : rand() < 0.6 ? 'sale' : rand() < 0.8 ? 'rent' : 'lease'
  const beds = type === 'Apartment' ? between(1, 4) : type === 'Independent House' ? between(2, 5) : type === 'Villa' ? between(3, 6) : 0
  const baths = beds ? Math.max(1, beds - between(0, 1)) : group === 'commercial' ? between(1, 4) : 0
  let area = 0, unit: Property['areaUnit'] = 'sqft', price = 0
  const lakh = 100000
  if (type === 'Apartment') { area = 450 * beds + between(0, 300); price = area * between(5200, 9500) }
  else if (type === 'Independent House') { area = 900 * (beds - 1) + between(900, 1500); price = area * between(6500, 11000) }
  else if (type === 'Villa') { area = 1500 * (beds - 2) + between(1800, 2600); price = area * between(9000, 14500) }
  else if (type === 'Residential Plot') { area = pick([1200, 1500, 2400, 3000, 4000]); price = area * between(1200, 4800) }
  else if (type === 'Agricultural Land') { area = between(1, 9) + (rand() < 0.5 ? 0.5 : 0); unit = 'acre'; price = Math.round(area * between(18, 60)) * lakh }
  else if (type === 'Office Space') { area = pick([600, 1000, 1500, 2500, 4000]); price = area * between(7000, 12000) }
  else if (type === 'Shop / Warehouse') { area = pick([300, 600, 1200, 5000, 10000]); price = area * between(4500, 11000) }
  else { area = pick([2000, 3500, 5000, 8000]); price = area * between(8000, 15000) }
  price = Math.round(price / 5000) * 5000
  const rent = purpose !== 'sale' ? Math.round((price * (type === 'Apartment' ? 0.0035 : 0.004)) / 500) * 500 : undefined
  const title = beds ? `${beds} BHK ${type}` : type === 'Residential Plot' ? `${area} sq ft Residential Plot` : type === 'Agricultural Land' ? `${area} Acre Agricultural Land` : type === 'Shop / Warehouse' ? `${area} sq ft Shop / Warehouse` : `${area} sq ft ${type}`
  const imgs = TYPE_IMG[type]
  const images = [imgs[0], ...imgs.slice(1), ...(imgs.length < 3 ? [pick(['/images/villa-blue.webp', '/images/villa-sunset.webp'])] : [])].slice(0, 4)
  const construction: Property['construction'] = rand() < 0.65 ? 'ready' : rand() < 0.7 ? 'under_construction' : 'new_launch'
  const verified = rand() < 0.82
  const listing: Property['listing'] = id > 54 ? 'draft' : id % 17 === 0 ? 'sold' : id % 13 === 0 ? 'inactive' : 'active'
  const verification: Property['verification'] = id > 56 ? 'pending' : id === 58 ? 'rejected' : verified ? 'verified' : 'pending'
  return {
    id, code: `TNH-${String(1000 + id).padStart(6, '0')}`, slug: kebab(`${title} ${locality} ${c.city} ${id}`), title,
    description: `${title} in ${locality}, ${c.city}. A well-located ${type.toLowerCase()} with clear title, excellent connectivity to schools, hospitals and IT parks, and all essential amenities close by. Ideal for ${purpose === 'sale' ? 'end-users and investors' : 'families and professionals'} looking for a reliable address in Tamil Nadu.`,
    purpose, group, type, price, rent, deposit: rent ? rent * between(3, 10) : undefined,
    district: c.district, city: c.city, locality, address: `${between(1, 240)}, ${locality} Main Road, ${c.city}`, pincode: c.pin,
    lat: c.lat + (rand() - 0.5) * 0.08, lng: c.lng + (rand() - 0.5) * 0.08,
    bedrooms: beds, bathrooms: baths, builtUpArea: area, plotArea: group === 'land' ? area : beds ? Math.round(area * 1.4) : undefined, areaUnit: unit,
    facing: pick(['East', 'West', 'North', 'South', 'North-East', 'South-East']), furnishing: group === 'land' ? 'Unfurnished' : pick(['Unfurnished', 'Semi-Furnished', 'Fully Furnished']),
    floor: type === 'Apartment' ? between(0, 14) : undefined, totalFloors: type === 'Apartment' ? between(5, 18) : beds ? between(1, 3) : undefined,
    parking: group === 'land' ? 0 : between(0, 3), ageYears: construction === 'ready' ? between(0, 12) : 0, construction,
    amenities: group === 'land' ? ['Water Supply', 'Gated Community', 'Vastu Compliant'].slice(0, between(1, 3)) : AMENITIES.filter(() => rand() < 0.5),
    images, videoUrl: id % 6 === 0 ? 'https://www.youtube.com/embed/aqz-KE-bpKQ' : undefined, tourUrl: id % 9 === 0 ? 'https://example.com/360-tour' : undefined,
    floorPlans: beds ? ['/images/ph-apartment.svg'] : [], rera: group !== 'land' && construction !== 'ready' ? `TN/${between(1, 29)}/2026/${between(1000, 9999)}` : group === 'residential' && rand() < 0.4 ? `TN/${between(1, 29)}/2025/${between(1000, 9999)}` : undefined,
    featured: id % 4 === 1, isNew: id > 44, verification, listing, agentId: (CITY_DATA.indexOf(c) % 6) + 1, ownerId: undefined,
    views: between(40, 2400), seoTitle: `${title} for ${purpose} in ${locality}, ${c.city} | TN HOMES`, seoDescription: `Explore this ${title} in ${locality}, ${c.city}. Verified details, photos and contact.`, createdAt: daysAgo(between(1, 160)),
  }
}
export const SEED_PROPERTIES: Property[] = Array.from({ length: 60 }, (_, i) => makeProperty(i + 1))

/* ---------- Projects ---------- */
const PROJ = [
  ['Prestige Green Meadows', 'Prestige Group', 'Chennai', 'Sholinganallur', 'New Launch', 6500000, '2, 3 BHK Apartments', 'Under Construction'],
  ['Casagrand Next Town', 'Casagrand Builders', 'Coimbatore', 'Saravanampatti', 'Featured', 5000000, '2, 3 BHK Apartments', 'Under Construction'],
  ['Sree Daksha Avenue', 'Sree Daksha', 'Coimbatore', 'Avinashi Road', 'Popular', 4000000, '2, 3 BHK Apartments', 'Ready to Move'],
  ['Radiance Regal', 'Radiance Realty', 'Chennai', 'OMR', 'Premium', 8500000, '3, 4 BHK Apartments', 'Under Construction'],
  ['Lake View Villas', 'GreenNest Developers', 'Madurai', 'KK Nagar', 'Featured', 7200000, '3, 4 BHK Villas', 'New Launch'],
  ['Cauvery Heights', 'Cauvery Homes', 'Tiruchirappalli', 'Srirangam', 'Popular', 3800000, '2, 3 BHK Apartments', 'Ready to Move'],
  ['Hills Plots Phase II', 'Nilgiri Estates', 'Hosur', 'Mathigiri', 'New Launch', 1800000, 'DTCP Approved Plots', 'New Launch'],
  ['Techpark Business Hub', 'Orbit Spaces', 'Coimbatore', 'Peelamedu', 'Premium', 12000000, 'Office Suites', 'Under Construction'],
] as const
export const SEED_PROJECTS: Project[] = PROJ.map(([name, builder, city, locality, tag, startingPrice, configurations, status], i) => ({
  id: i + 1, slug: kebab(name), name, builder, city, locality, tag, startingPrice, configurations, status, rera: `TN/01/2026/${1200 + i * 111}`,
  possession: status === 'Ready to Move' ? 'Immediate' : `${['Mar', 'Jun', 'Sep', 'Dec'][i % 4]} ${2027 + (i % 2)}`,
  description: `${name} by ${builder} is a thoughtfully planned development in ${locality}, ${city}, offering ${configurations.toLowerCase()} with modern amenities, strong connectivity and RERA-registered transparency.`,
  image: i % 3 === 0 ? '/images/villa-blue.webp' : i % 3 === 1 ? '/images/ph-apartment.svg' : '/images/villa-sunset.webp',
  gallery: ['/images/villa-blue.webp', '/images/villa-sunset.webp', '/images/ph-apartment.svg'], amenities: AMENITIES.slice(0, 8 + (i % 4)),
  units: configurations.includes('Plots') ? [{ type: '1200 sq ft Plot', area: '1200 sq ft', price: startingPrice }, { type: '2400 sq ft Plot', area: '2400 sq ft', price: startingPrice * 2 }]
    : [{ type: '2 BHK', area: '1050 sq ft', price: startingPrice }, { type: '3 BHK', area: '1480 sq ft', price: Math.round(startingPrice * 1.45) }],
  active: true,
}))

/* ---------- CRM ---------- */
const FIRST = ['Anand', 'Bhavani', 'Chitra', 'Dinesh', 'Elango', 'Fathima', 'Gokul', 'Hema', 'Ilango', 'Janani', 'Kumaran', 'Latha', 'Mohan', 'Nandhini', 'Om Prakash', 'Poongodi', 'Rajesh', 'Saranya']
const SOURCES = ['Website', 'WhatsApp', 'Phone Call', 'Referral', 'Walk-in', 'Property Portal']
const LEAD_STATUSES: Lead['status'][] = ['new', 'contacted', 'interested', 'site_visit', 'negotiation', 'converted', 'lost']
export const SEED_ENQUIRIES: Enquiry[] = Array.from({ length: 30 }, (_, i) => {
  const p = SEED_PROPERTIES[(i * 2) % 50]
  return { id: i + 1, code: `ENQ-${2000 + i}`, propertyId: p.id, propertyTitle: p.title, userId: i % 4 === 0 ? 8 : undefined, name: i % 4 === 0 ? 'Arun Kumar' : FIRST[i % FIRST.length], phone: `+91 9${between(100000000, 999999999)}`, email: `${kebab(FIRST[i % FIRST.length])}${i}@example.com`, message: `I am interested in ${p.title} at ${p.locality}. Please share more details and available visiting slots.`, budget: p.price, source: SOURCES[i % SOURCES.length], assignedAgentId: i < 24 ? p.agentId : undefined, status: i < 24 ? 'assigned' : 'open', createdAt: daysAgo(i + 1) }
})
export const SEED_LEADS: Lead[] = SEED_ENQUIRIES.slice(0, 24).map((e, i) => ({
  id: i + 1, code: `LD-${3000 + i}`, enquiryId: e.id, name: e.name, phone: e.phone, email: e.email, propertyId: e.propertyId, propertyTitle: e.propertyTitle, budget: e.budget ?? 0, source: e.source,
  agentId: e.assignedAgentId ?? null, status: LEAD_STATUSES[i % LEAD_STATUSES.length], priority: (['high', 'medium', 'low'] as const)[i % 3], nextFollowUp: i % 7 === 6 ? undefined : daysAhead((i % 6) - 1), notes: 'Customer prefers weekend visits. Budget is flexible for the right location.',
  activities: [{ id: 1, type: 'note', text: 'Lead created from website enquiry.', by: 'System', createdAt: e.createdAt }], createdAt: e.createdAt,
}))
export const SEED_APPOINTMENTS: Appointment[] = Array.from({ length: 12 }, (_, i) => {
  const p = SEED_PROPERTIES[(i * 3) % 40]
  return { id: i + 1, code: `VIS-${4000 + i}`, propertyId: p.id, propertyTitle: p.title, userId: i % 2 ? 8 : 9 + (i % 3), customerName: i % 2 ? 'Arun Kumar' : SEED_USERS[8 + (i % 3)].name, phone: '+91 98430 11223', agentId: p.agentId, date: daysAhead(i - 3), time: pick(['10:00 AM', '11:30 AM', '03:00 PM', '04:30 PM']), status: i < 3 ? 'completed' : i % 5 === 0 ? 'cancelled' : i % 2 ? 'confirmed' : 'pending', createdAt: daysAgo(i + 2) }
})
export const SEED_SELL_REQUESTS: SellRentRequest[] = [
  { id: 1, code: 'SR-5001', userId: 8, name: 'Arun Kumar', phone: '+91 98430 11223', email: 'customer@tnhomes.in', purpose: 'sale', type: 'Independent House', city: 'Coimbatore', locality: 'Saravanampatti', expectedPrice: 8500000, description: '3 BHK independent house, east facing, 2 years old.', status: 'reviewing', createdAt: daysAgo(6) },
  { id: 2, code: 'SR-5002', name: 'Geetha Rani', phone: '+91 97000 12345', email: 'geetha@example.com', purpose: 'rent', type: 'Apartment', city: 'Chennai', locality: 'Adyar', expectedPrice: 32000, description: '2 BHK semi-furnished flat near the beach.', status: 'new', createdAt: daysAgo(2) },
  { id: 3, code: 'SR-5003', name: 'Murugan S', phone: '+91 98945 67890', email: 'murugan@example.com', purpose: 'sale', type: 'Agricultural Land', city: 'Erode', locality: 'Perundurai Road', expectedPrice: 12000000, description: '4 acre land with bore well and coconut trees.', status: 'approved', createdAt: daysAgo(14) },
]
export const SEED_REVIEWS: Review[] = [
  { id: 1, name: 'Arun Kumar', city: 'Coimbatore', rating: 5, text: 'Found my dream home in Coimbatore through this platform. The process was smooth and professional.', status: 'published' },
  { id: 2, name: 'Lakshmi Narayanan', city: 'Chennai', rating: 5, text: 'Verified listings saved me weeks of searching. The agent was responsive and honest about pricing.', status: 'published' },
  { id: 3, name: 'Suresh Babu', city: 'Madurai', rating: 4, text: 'Great experience renting a shop in KK Nagar. Site visit booking was very convenient.', status: 'published' },
  { id: 4, name: 'Nithya Prakash', city: 'Salem', rating: 5, text: 'Bought a DTCP-approved plot with complete document support. Highly recommended.', status: 'published' },
  { id: 5, name: 'Ramesh Iyer', city: 'Tiruppur', rating: 3, text: 'Good listings, would like more filters for land.', status: 'pending' },
]
const BLOG_BODY = (t: string) => `${t} is a topic many Tamil Nadu buyers ask us about.\n\nTamil Nadu's real estate market continues to evolve with new infrastructure, metro expansion and growing IT corridors in Chennai, Coimbatore and Madurai. Buyers are paying closer attention to RERA registration, title clarity and connectivity.\n\nBefore you decide, verify the patta and chitta, check the encumbrance certificate for at least 30 years, confirm DTCP or CMDA approval, and visit the location at different times of day.\n\nOur verified listings and local agents can help you shortlist, negotiate and complete the paperwork with confidence.`
export const SEED_BLOGS: Blog[] = [
  ['Tamil Nadu Real Estate Market Trends in 2026', 'Market'], ['Top 5 Areas to Buy a Home in Coimbatore', 'Guides'], ['Why Land Investment is Growing in Tamil Nadu', 'Investment'],
  ['Understanding Patta, Chitta and Encumbrance Certificates', 'Legal'], ['Home Loan Tips for First-time Buyers', 'Finance'], ['Rent vs Buy: What Makes Sense in Chennai?', 'Guides'],
].map(([title, category], i) => ({ id: i + 1, slug: kebab(title), title, excerpt: `${title} - key insights, practical tips and what to watch out for in the year ahead.`, content: BLOG_BODY(title), category, image: ['/images/ph-commercial.svg', '/images/villa-sunset.webp', '/images/ph-agri.svg', '/images/ph-house.svg', '/images/villa-blue.webp', '/images/ph-apartment.svg'][i], author: 'TN HOMES Editorial', published: i !== 5, createdAt: daysAgo(5 + i * 9) }))
export const SEED_BANNERS: Banner[] = [
  { id: 1, title: 'Premium Villas in Coimbatore', subtitle: 'Modern Living, Better Tomorrow', image: '/images/villa-blue.webp', link: '/buy?type=Villa&city=Coimbatore', active: true },
  { id: 2, title: 'DTCP Approved Plots', subtitle: 'Build your dream home on a secure plot', image: '/images/villa-sunset.webp', link: '/land', active: true },
]
export const SEED_FAQS: Faq[] = [
  ['General', 'What is TN HOMES?', 'TN HOMES is a Tamil Nadu focused real estate platform to buy, sell, rent and lease residential, commercial and land properties with verified listings.'],
  ['General', 'Is it free to search for properties?', 'Yes. Searching, saving properties, comparing and enquiring are free for customers.'],
  ['Buying', 'What does the Verified badge mean?', 'Our team has checked ownership documents and basic details of the listing. Always do your own legal due diligence before purchase.'],
  ['Buying', 'Can I schedule a site visit online?', 'Yes. Open any property, click Schedule Site Visit and pick a date and time. The agent will confirm it.'],
  ['Buying', 'Which documents should I verify before buying land?', 'Verify patta, chitta, FMB sketch, encumbrance certificate, parent documents and DTCP/CMDA approval.'],
  ['Renting', 'How is the security deposit decided?', 'Deposit terms are set by the owner and shown on the property page. Typical deposits range from 3 to 10 months of rent.'],
  ['Selling', 'How do I list my property?', 'Use the Sell / Rent Your Property form. Our team reviews it and an agent will contact you within one working day.'],
  ['Selling', 'Do you charge listing fees?', 'Basic listing review is free. Premium promotion packages are optional.'],
  ['Account', 'How do I reset my password?', 'Use Forgot Password on the login page and follow the link sent to your email.'],
  ['Account', 'Can I delete my account?', 'Yes. Contact support and we will remove your personal data as per our Privacy Policy.'],
  ['Agents', 'How do I become an agent?', 'Contact us with your RERA agent registration and experience details. Admin approves agent accounts.'],
  ['Payments', 'Which payment methods are supported?', 'Online payments for premium services are processed securely through Razorpay (UPI, cards, net banking).'],
].map(([category, question, answer], i) => ({ id: i + 1, category, question, answer }))
export const SEED_PAYMENTS: Payment[] = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, code: `PAY-${6000 + i}`, userName: SEED_USERS[7 + (i % 4)].name, purpose: ['Featured Listing', 'Premium Package', 'Site Visit Assistance'][i % 3], amount: [1999, 4999, 999][i % 3], method: ['UPI', 'Card', 'Net Banking'][i % 3], status: i % 7 === 6 ? 'failed' : i % 5 === 4 ? 'pending' : 'paid', createdAt: daysAgo(i * 3) }))
export const SEED_AUDIT: AuditLog[] = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, actor: i % 3 ? 'Admin User' : 'Karthik Raman', action: ['property.approved', 'property.created', 'lead.assigned', 'user.updated', 'settings.updated', 'property.rejected'][i % 6], entity: ['Property', 'Property', 'Lead', 'User', 'Settings', 'Property'][i % 6], entityId: i + 3, ip: `103.21.${between(1, 250)}.${between(1, 250)}`, createdAt: daysAgo(i * 0.6) }))
export const SEED_ROLES: RoleDef[] = [
  { id: 1, name: 'Admin', permissions: ['properties.*', 'users.*', 'agents.*', 'leads.*', 'cms.*', 'settings.*', 'reports.view', 'audit.view'] },
  { id: 2, name: 'Agent', permissions: ['properties.create', 'properties.update.own', 'leads.view.own', 'leads.update.own', 'appointments.manage.own'] },
  { id: 3, name: 'Customer', permissions: ['favorites.manage', 'enquiries.create', 'appointments.create', 'sell_requests.create'] },
]
export const SEED_MEDIA: MediaFile[] = ['villa-blue.webp', 'villa-sunset.webp', 'ph-apartment.svg', 'ph-house.svg', 'ph-villa.svg', 'ph-plot.svg', 'ph-agri.svg', 'ph-commercial.svg'].map((n, i) => ({ id: i + 1, name: n, url: `/images/${n}`, size: 120000 + i * 40000, type: n.endsWith('svg') ? 'image/svg+xml' : 'image/webp', createdAt: daysAgo(i * 4) }))
export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, userId: 8, title: 'Site visit confirmed', body: 'Your visit to 3 BHK Villa is confirmed for tomorrow at 11:30 AM.', read: false, createdAt: daysAgo(0.3) },
  { id: 2, userId: 8, title: 'Enquiry received', body: 'Your enquiry was assigned to an agent. They will contact you shortly.', read: false, createdAt: daysAgo(1) },
  { id: 3, userId: 8, title: 'Price drop alert', body: 'A property matching your saved search has a new price.', read: true, createdAt: daysAgo(4) },
  { id: 4, userId: 2, title: 'New lead assigned', body: 'A new lead has been assigned to you.', read: false, createdAt: daysAgo(0.2) },
  { id: 5, userId: 2, title: 'Property approved', body: 'Your listing was verified and is now live.', read: true, createdAt: daysAgo(3) },
  { id: 6, userId: 1, title: 'New sell request', body: 'A new sell/rent request needs review.', read: false, createdAt: daysAgo(0.5) },
]
export const SEED_SAVED_SEARCHES: SavedSearch[] = [{ id: 1, userId: 8, label: '3 BHK in Coimbatore under 1.2 Cr', query: 'purpose=sale&city=Coimbatore&bedrooms=3&maxPrice=12000000', frequency: 'daily', createdAt: daysAgo(10) }]
export const SEED_FAVORITES = [{ id: 1, userId: 8, propertyId: 2 }, { id: 2, userId: 8, propertyId: 5 }, { id: 3, userId: 8, propertyId: 9 }]
export const SEED_SETTINGS: SiteSettings = {
  siteName: 'TN HOMES', tagline: 'Properties for a Better Tomorrow', email: 'support@tnhomes.in', phone: '+91 98765 43210', whatsapp: '919876543210', address: 'Coimbatore, Tamil Nadu, India', hours: 'Mon - Sat, 9:00 AM - 6:00 PM',
  requireVerification: true, autoApproveAgentListings: false, listingExpiryDays: 90, gaId: '', mapsKey: '', social: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', youtube: 'https://youtube.com', linkedin: 'https://linkedin.com' },
}

export type SiteSettingsRef = SiteSettings
