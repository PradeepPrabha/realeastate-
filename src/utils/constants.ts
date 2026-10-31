export const NAV_LINKS = [
  { to: '/', key: 'home', label: 'Home' },
  { to: '/buy', key: 'buy', label: 'Buy' },
  { to: '/rent', key: 'rent', label: 'Rent' },
  { to: '/commercial', key: 'commercial', label: 'Commercial' },
  { to: '/land', key: 'land', label: 'Land & Plots' },
  { to: '/projects', key: 'projects', label: 'Projects' },
  { to: '/agents', key: 'agents', label: 'Agents' },
] as const

export const PROPERTY_TYPES = ['Apartment', 'Independent House', 'Villa', 'Residential Plot', 'Agricultural Land', 'Commercial Property', 'Office Space', 'Shop / Warehouse']
export const TYPE_GROUP: Record<string, 'residential' | 'commercial' | 'land'> = {
  Apartment: 'residential', 'Independent House': 'residential', Villa: 'residential', 'Residential Plot': 'land', 'Agricultural Land': 'land',
  'Commercial Property': 'commercial', 'Office Space': 'commercial', 'Shop / Warehouse': 'commercial',
}
export const FACINGS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West']
export const FURNISHINGS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished']
export const AMENITY_LIST = ['Car Parking', 'Lift', 'Power Backup', '24x7 Security', 'Swimming Pool', 'Gym', "Children's Play Area", 'Club House', 'Garden', 'CCTV', 'Water Supply', 'Gated Community', 'Vastu Compliant']
export const CONSTRUCTION_OPTIONS = [{ value: 'ready', label: 'Ready to Move' }, { value: 'under_construction', label: 'Under Construction' }, { value: 'new_launch', label: 'New Launch' }]
export const AREA_UNIT_OPTIONS = [{ value: 'sqft', label: 'Square feet' }, { value: 'sqm', label: 'Square metres' }, { value: 'cent', label: 'Cent' }, { value: 'acre', label: 'Acre' }, { value: 'ground', label: 'Ground' }]
export const LEAD_STATUSES = [
  { value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'interested', label: 'Interested' }, { value: 'site_visit', label: 'Site Visit Scheduled' },
  { value: 'negotiation', label: 'Negotiation' }, { value: 'converted', label: 'Converted' }, { value: 'lost', label: 'Lost' },
]
export const SORT_OPTIONS = [{ value: 'latest', label: 'Latest Listings' }, { value: 'price_asc', label: 'Price: Low to High' }, { value: 'price_desc', label: 'Price: High to Low' }, { value: 'area_desc', label: 'Area: Largest' }]

export const SALE_BUDGETS = [
  { label: 'Under ₹ 25 Lakh', min: 0, max: 2500000 }, { label: '₹ 25 - 50 Lakh', min: 2500000, max: 5000000 }, { label: '₹ 50 Lakh - 1 Cr', min: 5000000, max: 10000000 },
  { label: '₹ 1 - 2 Cr', min: 10000000, max: 20000000 }, { label: 'Above ₹ 2 Cr', min: 20000000, max: 0 },
]
export const RENT_BUDGETS = [
  { label: 'Under ₹ 15,000', min: 0, max: 15000 }, { label: '₹ 15,000 - 30,000', min: 15000, max: 30000 }, { label: '₹ 30,000 - 60,000', min: 30000, max: 60000 }, { label: 'Above ₹ 60,000', min: 60000, max: 0 },
]
export const CITY_IMAGES: Record<string, string> = {}
export const TAMIL_NADU_BOUNDS = { minLat: 8, maxLat: 13.6, minLng: 76.2, maxLng: 80.4 }
