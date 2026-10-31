export type Lang = 'en' | 'ta'
const dict: Record<string, { en: string; ta: string }> = {
  home: { en: 'Home', ta: 'முகப்பு' }, buy: { en: 'Buy', ta: 'வாங்க' }, rent: { en: 'Rent', ta: 'வாடகை' }, commercial: { en: 'Commercial', ta: 'வணிகம்' },
  land: { en: 'Land & Plots', ta: 'நிலம் & மனை' }, projects: { en: 'Projects', ta: 'திட்டங்கள்' }, agents: { en: 'Agents', ta: 'முகவர்கள்' },
  login: { en: 'Login / Register', ta: 'உள்நுழை / பதிவு' }, list: { en: 'List Your Property', ta: 'சொத்தை பட்டியலிடுங்கள்' },
  heroTitle: { en: 'Find a Place You’ll Love to Call Home', ta: 'நீங்கள் வீடு என்று அழைக்க விரும்பும் இடத்தைக் கண்டறியுங்கள்' },
  heroSub: { en: 'Discover residential, commercial, and land properties across Tamil Nadu.', ta: 'தமிழ்நாடு முழுவதும் குடியிருப்பு, வணிக மற்றும் நிலச் சொத்துகளைக் கண்டறியுங்கள்.' },
  search: { en: 'Search', ta: 'தேடு' },
}
export const tr = (key: string, lang: Lang) => dict[key]?.[lang] ?? dict[key]?.en ?? key
