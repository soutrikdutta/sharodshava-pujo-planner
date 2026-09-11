export interface FestivalDay {
  id: string;
  name: string;
  bengaliName: string;
  dateStr: string;
  tithiInfo: string;
  rituals: string[];
  significance: string;
  colorTheme: string;
  pujaSpecial: string;
  ordinalLabel: string;
}

export interface PandalPlace {
  id: string;
  name: string;
  zone: 'North' | 'Central' | 'South';
  area: string;
  lat: number;
  lng: number;
  rating: number;
  photoUrl: string;
  crowdLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  isPopularTheme: boolean;
  bestTimeToVisit: string;
  nearbyMetro: string;
  nearestStation?: string;
  nearestStationDistance?: string;
  bengaliDescription: string;
}

export interface KolkataZoneInfo {
  id: 'north' | 'central' | 'south';
  name: string;
  bengaliName: string;
  description: string;
  vibe: string;
  color: string;
  accentGradient: string;
  pandalCount: number;
  highlights: string[];
  keyStreets: string[];
}

export interface FestivalConfig {
  year: number;
  theme: string;
  startDate: string;
  endDate: string;
  days: FestivalDay[];
  featuredPandals: PandalPlace[];
}

export const DURGA_PUJA_2026: FestivalConfig = {
  year: 2026,
  theme: "Sharodshav 2026",
  startDate: "2026-10-15",
  endDate: "2026-10-20",
  days: [
    {
      id: "shashti",
      name: "Maha Shashti",
      bengaliName: "মহা ষষ্ঠী",
      dateStr: "2026-10-16",
      tithiInfo: "Shukla Shashthi Tithi",
      rituals: ["Bodhon (Awakening)", "Amontron & Adhibash", "Unveiling of the Devi's Face"],
      significance: "Marks the awakening of Goddess Durga on Earth with joy and dhak beats.",
      colorTheme: "#f59e0b",
      pujaSpecial: "Grand pandal inaugurations across Kolkata.",
      ordinalLabel: "6th day of Durga Puja"
    },
    {
      id: "saptami",
      name: "Maha Saptami",
      bengaliName: "মহা সপ্তমী",
      dateStr: "2026-10-17",
      tithiInfo: "Shukla Saptami Tithi",
      rituals: ["Kola Bou Snan (Nabapatrika bath at Ganga)", "Prana Pratishtha", "Chokkhu Daan"],
      significance: "Invoking the divine life-force into the idol with sacred river water and plants.",
      colorTheme: "#ea580c",
      pujaSpecial: "Morning Pushpanjali and street hopping begin in full swing.",
      ordinalLabel: "7th day of Durga Puja"
    },
    {
      id: "ashtami",
      name: "Maha Ashtami",
      bengaliName: "মহা অষ্টমী",
      dateStr: "2026-10-18",
      tithiInfo: "Shukla Ashtami Tithi",
      rituals: ["Kumari Puja", "Sandhi Puja (108 Lotus & 108 Diyas)", "Pushpanjali in traditional attire"],
      significance: "The most sacred day celebrating the battle between Durga and Mahishasura.",
      colorTheme: "#dc2626",
      pujaSpecial: "Peak evening crowd, spectacular dhunuchi dance and bhog distribution.",
      ordinalLabel: "8th day of Durga Puja"
    },
    {
      id: "nabami",
      name: "Maha Nabami",
      bengaliName: "মহা নবমী",
      dateStr: "2026-10-19",
      tithiInfo: "Shukla Navami Tithi",
      rituals: ["Maha Aarti", "Navami Homa", "Dhunuchi Naach competitions"],
      significance: "Celebration of the victory over evil and ultimate triumph of goodness.",
      colorTheme: "#9333ea",
      pujaSpecial: "All-night pandal hopping and Kolkata street food feasts.",
      ordinalLabel: "9th day of Durga Puja"
    },
    {
      id: "dashami",
      name: "Bijoya Dashami",
      bengaliName: "বিজয়া দশমী",
      dateStr: "2026-10-20",
      tithiInfo: "Shukla Dashami Tithi",
      rituals: ["Sindoor Khela", "Devi Boron", "Bisarjan (Immersion in Ganges)"],
      significance: "Emotional farewell to Maa Durga with Shubho Bijoya sweets and blessings.",
      colorTheme: "#d97706",
      pujaSpecial: "Immersion carnival along Babughat, Prinsep Ghat, and sweet exchanges.",
      ordinalLabel: "10th day of Durga Puja"
    }
  ],
  featuredPandals: []
};

export const KOLKATA_ZONES: KolkataZoneInfo[] = [
  {
    id: 'north',
    name: 'North Kolkata',
    bengaliName: 'উত্তর কলকাতা',
    description: 'Heritage, Bonedi Bari traditions, artistic lighting, and classic old-world charm.',
    vibe: 'Heritage & Architectural Artistry',
    color: '#38bdf8',
    accentGradient: 'from-sky-500/20 via-sky-900/40 to-slate-900',
    pandalCount: 22,
    highlights: ['Bagbazar Sarbojanin', 'Kumartuli Park', 'Tala Prattoy', 'Sovabazar Rajbari', 'Hatibagan Sarbojanin'],
    keyStreets: ['Central Avenue', 'Bidhan Sarani', 'Bagbazar Street', 'Shyambazar Five-Point Crossing']
  },
  {
    id: 'central',
    name: 'Central Kolkata',
    bengaliName: 'মধ্য কলকাতা',
    description: 'Electrifying Chandannagar illuminations, historic community squares, and food streets.',
    vibe: 'Illumination & Legendary Crowds',
    color: '#eab308',
    accentGradient: 'from-yellow-500/20 via-amber-900/40 to-slate-900',
    pandalCount: 14,
    highlights: ['College Square', 'Santosh Mitra Square', 'Mohammad Ali Park', 'Janbazar Sarbojanin'],
    keyStreets: ['College Street', 'M.G. Road', 'Bowbazar Street', 'Chittaranjan Avenue']
  },
  {
    id: 'south',
    name: 'South Kolkata',
    bengaliName: 'দক্ষিণ কলকাতা',
    description: 'Modern conceptual themes, mega scale pandal architecture, and glamour.',
    vibe: 'Mega Scale & Modern Art',
    color: '#f43f5e',
    accentGradient: 'from-rose-500/20 via-red-950/40 to-slate-900',
    pandalCount: 38,
    highlights: ['Maddox Square', 'Ekdalia Evergreen', 'Suruchi Sangha', 'Tridhara Sammilani', 'Ballygunge Cultural', 'Deshapriya Park'],
    keyStreets: ['Gariahat Road', 'Rashbehari Avenue', 'Southern Avenue', 'Chetla Road']
  }
];

export interface FestivalStatus {
  status: 'BEFORE' | 'DURING' | 'AFTER';
  daysRemaining?: number;
  currentDay?: FestivalDay;
}

export function getFestivalStatus(currentDate: Date = new Date(), config: FestivalConfig = DURGA_PUJA_2026): FestivalStatus {
  const curStr = currentDate.toISOString().split('T')[0];
  const startStr = config.days[0].dateStr;
  const endStr = config.days[config.days.length - 1].dateStr;

  if (curStr < startStr) {
    const d1 = new Date(curStr);
    const d2 = new Date(startStr);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { status: 'BEFORE', daysRemaining };
  } else if (curStr > endStr) {
    return { status: 'AFTER' };
  } else {
    const matched = config.days.find(d => d.dateStr === curStr) || config.days[0];
    return { status: 'DURING', currentDay: matched };
  }
}
