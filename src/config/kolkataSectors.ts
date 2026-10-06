import type { PandalPlace } from './festivalConfig';

export interface SubSectorInfo {
  id: string;
  code: string; // e.g. "NW", "NC", "NE", "CW", "C", "CE", "SW", "SC", "SE"
  title: string; // e.g. "North West", "Central", "South Central"
  zone: 'north' | 'central' | 'south';
  areas: string[];
  vibe: string;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  pandals: PandalPlace[];
}

export interface ZoneSectorsGroup {
  zoneKey: 'north' | 'central' | 'south';
  zoneName: string;
  bengaliName: string;
  accentColor: string;
  badgeColor: string;
  borderColor: string;
  sectors: SubSectorInfo[];
}

export const KOLKATA_SECTORS_DATA: ZoneSectorsGroup[] = [
  {
    zoneKey: 'north',
    zoneName: 'North Kolkata',
    bengaliName: 'উত্তর কলকাতা',
    accentColor: 'text-sky-400',
    badgeColor: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    borderColor: 'border-sky-500/20',
    sectors: [
      {
        id: 'north-kolkata-all',
        code: 'NK',
        title: 'North Kolkata Pandals',
        zone: 'north',
        areas: ['Shyambazar', 'Bagbazar', 'Kumartuli', 'Hatibagan', 'Tala', 'Dum Dum', 'Salt Lake', 'New Town'],
        vibe: 'Centenary Sabeki Ekchala heritage, world-class contemporary art installations & bustling North alleys',
        accentColor: 'text-sky-300',
        badgeBg: 'bg-sky-500/20',
        borderColor: 'border-sky-400/40',
        pandals: [
          {
                    "name": "Tala Barowari",
                    "zone": "North Kolkata",
                    "vibe": "Historic North heritage barowari known for grand traditional idol & community fervor",
                    "lat": 22.6052,
                    "lng": 88.3758,
                    "address": "Tala Park, Shyambazar, Kolkata"
          },
          {
                    "name": "Kumartuli Park Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Sacred idol artisans' hub with magnificent sculptured pandal and divine clay artistry",
                    "lat": 22.5995,
                    "lng": 88.3653,
                    "address": "8/B Abhay Mitra St, Kumartuli, Kolkata"
          },
          {
                    "name": "Kumartuli Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Centuries-old legacy puja situated in the core lane of Kolkata's legendary potters",
                    "lat": 22.5988,
                    "lng": 88.3645,
                    "address": "Kumartuli Lane, Sovabazar, Kolkata"
          },
          {
                    "name": "Jagat Mukherjee Park",
                    "zone": "North Kolkata",
                    "vibe": "Famous for innovative technological illumination, moving thematic models and heritage",
                    "lat": 22.5985,
                    "lng": 88.3702,
                    "address": "Jagat Mukherjee Park, Jatindra Mohan Ave, Kolkata"
          },
          {
                    "name": "Ahiritola Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Iconic riverside community heritage with deeply moving socially conscious themes",
                    "lat": 22.5928,
                    "lng": 88.3586,
                    "address": "133 BK Paul Ave, Ahiritola, Kolkata"
          },
          {
                    "name": "Ahiritola Yubakbrinda Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Youthful energetic festival spirit with creative pandal architecture and festive lights",
                    "lat": 22.5935,
                    "lng": 88.3592,
                    "address": "Ahiritola Ghat Rd, Ahiritola, Kolkata"
          },
          {
                    "name": "Hatibagan Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Historic centenary tradition, authentic North ethos and cultural fervor",
                    "lat": 22.595,
                    "lng": 88.3715,
                    "address": "Hatibagan Crossing, Shyambazar, Kolkata"
          },
          {
                    "name": "Hatibagan Nabin Pally",
                    "zone": "North Kolkata",
                    "vibe": "Pioneering eco-friendly and conceptual art installations with huge public footfall",
                    "lat": 22.5962,
                    "lng": 88.3728,
                    "address": "Nabin Pally, Hatibagan, Kolkata"
          },
          {
                    "name": "Nalin Sarkar Street Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Intricate Bengali folk craftsmanship and traditional indigenous artistic elements",
                    "lat": 22.5965,
                    "lng": 88.3745,
                    "address": "Nalin Sarkar St, Shyambazar, Kolkata"
          },
          {
                    "name": "Kashi Bose Lane",
                    "zone": "North Kolkata",
                    "vibe": "Perennial award-winning architectural wonder with soul-stirring environmental themes",
                    "lat": 22.5915,
                    "lng": 88.3725,
                    "address": "Kashi Bose Lane, Maniktala, Kolkata"
          },
          {
                    "name": "Telengabagan",
                    "zone": "North Kolkata",
                    "vibe": "Pioneering thematic storytelling and intricately carved natural textures",
                    "lat": 22.5912,
                    "lng": 88.3895,
                    "address": "Ultadanga Main Rd, Telengabagan, Kolkata"
          },
          {
                    "name": "Ultadanga Bidhan Sangha",
                    "zone": "North Kolkata",
                    "vibe": "Lively neighborhood celebration with colorful illuminations and joyous dhaak beats",
                    "lat": 22.5898,
                    "lng": 88.386,
                    "address": "Bidhan Sangha, Ultadanga, Kolkata"
          },
          {
                    "name": "Shobhabazar Rajbari (Bonedi)",
                    "zone": "North Kolkata",
                    "vibe": "Aristocratic 1757 royal legacy puja with traditional thakur dalan and cannon firing",
                    "lat": 22.5975,
                    "lng": 88.3662,
                    "address": "36 Raja Nabakrishna St, Sovabazar, Kolkata"
          },
          {
                    "name": "Sikdar Bagan Sadharan",
                    "zone": "North Kolkata",
                    "vibe": "Classic 100-year-old North Kolkata puja known for breathtaking traditional pratima",
                    "lat": 22.5952,
                    "lng": 88.3702,
                    "address": "Sikdar Bagan St, Hatibagan, Kolkata"
          },
          {
                    "name": "Jorasanko Sadharan / 7 Palli",
                    "zone": "North Kolkata",
                    "vibe": "Historic Tagore neighborhood community puja steeped in old Calcutta lore",
                    "lat": 22.5848,
                    "lng": 88.3595,
                    "address": "Jorasanko, Rabindra Sarani, Kolkata"
          },
          {
                    "name": "Simla Byayam Samity",
                    "zone": "North Kolkata",
                    "vibe": "Swadeshi-era freedom fighter legacy with giant warrior Durga idol standing victorious",
                    "lat": 22.5872,
                    "lng": 88.3638,
                    "address": "Simla St, Vivekananda Rd, Kolkata"
          },
          {
                    "name": "Darjipara Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Heritage North Calcutta community puja celebrated with authentic warmth",
                    "lat": 22.5902,
                    "lng": 88.3658,
                    "address": "Darjipara, Beadon St, Kolkata"
          },
          {
                    "name": "Bagbazar Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Centenary traditional pride, iconic Sabeki Ekchala Pratima and immersion carnival",
                    "lat": 22.6035,
                    "lng": 88.3685,
                    "address": "7 Bagbazar St, Baghbazar, Kolkata"
          },
          {
                    "name": "Tala Prattoy",
                    "zone": "North Kolkata",
                    "vibe": "World-renowned contemporary architectural installation designed by leading artists",
                    "lat": 22.6074,
                    "lng": 88.3792,
                    "address": "Tala, Shyambazar, Kolkata"
          },
          {
                    "name": "Belgachia Sadharan",
                    "zone": "North Kolkata",
                    "vibe": "Vibrant neighborhood community puja with colorful arches and authentic bhog",
                    "lat": 22.6022,
                    "lng": 88.3842,
                    "address": "Belgachia Rd, Milk Colony, Kolkata"
          },
          {
                    "name": "BK Pal Park",
                    "zone": "North Kolkata",
                    "vibe": "Riverside park gathering with classic idol artistry and glittering lighting towers",
                    "lat": 22.5955,
                    "lng": 88.361,
                    "address": "BK Pal Ave, Sovabazar, Kolkata"
          },
          {
                    "name": "Darpanarayan Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Traditional merchant district puja renowned for warm hospitalities",
                    "lat": 22.5905,
                    "lng": 88.358,
                    "address": "Darpanarayan Tagore St, Ahiritola, Kolkata"
          },
          {
                    "name": "Vivekananda Sporting Club",
                    "zone": "North Kolkata",
                    "vibe": "Energetic sports club festival celebration with innovative pandal decor",
                    "lat": 22.5882,
                    "lng": 88.368,
                    "address": "Vivekananda Rd, Maniktala, Kolkata"
          },
          {
                    "name": "Hatkhola Gosaipara",
                    "zone": "North Kolkata",
                    "vibe": "Ancient Ganges bank heritage puja with peaceful devotion and authentic sabeki idol",
                    "lat": 22.597,
                    "lng": 88.3615,
                    "address": "Hatkhola Gosaipara, Sovabazar, Kolkata"
          },
          {
                    "name": "Beniatola Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Classic North Kolkata heritage puja celebrated with historic brass instruments",
                    "lat": 22.596,
                    "lng": 88.3598,
                    "address": "Beniatola Ln, Sovabazar, Kolkata"
          },
          {
                    "name": "Chorbagan Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Critically acclaimed thematic installations highlighting Indian cultural roots",
                    "lat": 22.584,
                    "lng": 88.3648,
                    "address": "Chorbagan, Chittaranjan Ave, Kolkata"
          },
          {
                    "name": "Pathuriaghata Pancher Pally",
                    "zone": "North Kolkata",
                    "vibe": "Historic merchant enclave puja blending royal heritage with modern craft",
                    "lat": 22.5885,
                    "lng": 88.3562,
                    "address": "Pathuriaghata St, Kolkata"
          },
          {
                    "name": "Sreebhumi Sporting Club",
                    "zone": "North Kolkata",
                    "vibe": "Sensational palace replicas, diamond jewelry idols and world-famous light displays",
                    "lat": 22.5982,
                    "lng": 88.4015,
                    "address": "Sreebhumi, VIP Rd, Lake Town, Kolkata"
          },
          {
                    "name": "Dum Dum Park Tarun Sangha",
                    "zone": "North Kolkata",
                    "vibe": "Aesthetic design masterpiece with mesmerizing natural materials and lighting",
                    "lat": 22.6092,
                    "lng": 88.411,
                    "address": "Dum Dum Park, VIP Rd, Kolkata"
          },
          {
                    "name": "Dum Dum Park Bharat Chakra",
                    "zone": "North Kolkata",
                    "vibe": "Spectacular thematic narrative showcasing folk traditions and village life",
                    "lat": 22.6105,
                    "lng": 88.4125,
                    "address": "Bharat Chakra, Dum Dum Park, Kolkata"
          },
          {
                    "name": "Dum Dum Tarun Dal",
                    "zone": "North Kolkata",
                    "vibe": "Dynamic contemporary concepts and grand artistic idols drawing huge crowds",
                    "lat": 22.612,
                    "lng": 88.414,
                    "address": "Tarun Dal, Dum Dum Park, Kolkata"
          },
          {
                    "name": "Dum Dum Park Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Historic park puja with authentic traditional values and cultural programs",
                    "lat": 22.608,
                    "lng": 88.4095,
                    "address": "Tank No 3, Dum Dum Park, Kolkata"
          },
          {
                    "name": "Dum Dum Park Yuvak Brinda",
                    "zone": "North Kolkata",
                    "vibe": "Vibrant festive youth adda and vibrant thematic decorations",
                    "lat": 22.6098,
                    "lng": 88.4105,
                    "address": "Yuvak Brinda, Dum Dum Park, Kolkata"
          },
          {
                    "name": "Keshtopur Prafulla Kanan Paschim",
                    "zone": "North Kolkata",
                    "vibe": "Immense architectural pandal along canal road with grand illumination",
                    "lat": 22.5925,
                    "lng": 88.423,
                    "address": "Prafulla Kanan West, Keshtopur, Kolkata"
          },
          {
                    "name": "Yuba Sangha Telipukur & Nursery",
                    "zone": "North Kolkata",
                    "vibe": "Traditional community celebration with serene garden settings and festive crowds",
                    "lat": 22.6185,
                    "lng": 88.421,
                    "address": "Telipukur, Dum Dum, Kolkata"
          },
          {
                    "name": "New Town Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Modern planned city mega-carnival, solar powered pandal and eco-conscious puja",
                    "lat": 22.5835,
                    "lng": 88.468,
                    "address": "City Centre 2 / Action Area 1, New Town, Kolkata"
          },
          {
                    "name": "Salt Lake FD Block",
                    "zone": "North Kolkata",
                    "vibe": "Legendary massive fantasy castles and global wonder replicas on open green lawns",
                    "lat": 22.5892,
                    "lng": 88.412,
                    "address": "FD Block Park, Sector III, Salt Lake, Kolkata"
          },
          {
                    "name": "Salt Lake BJ Block",
                    "zone": "North Kolkata",
                    "vibe": "Architectural marvel with exquisite craft, wide walking avenues and royal idol",
                    "lat": 22.587,
                    "lng": 88.4172,
                    "address": "BJ Block Park, Sector II, Salt Lake, Kolkata"
          },
          {
                    "name": "Salt Lake AK Block",
                    "zone": "North Kolkata",
                    "vibe": "Thought-provoking social themes created with meticulous handmade artifacts",
                    "lat": 22.5832,
                    "lng": 88.4105,
                    "address": "AK Block Park, Sector II, Salt Lake, Kolkata"
          },
          {
                    "name": "Salt Lake AE Block (Part 1 & 2)",
                    "zone": "North Kolkata",
                    "vibe": "Cozy twin community park pujos with peaceful family adda and artistic pandals",
                    "lat": 22.5935,
                    "lng": 88.4085,
                    "address": "AE Block Park, Sector I, Salt Lake, Kolkata"
          },
          {
                    "name": "Salt Lake EC Block",
                    "zone": "North Kolkata",
                    "vibe": "Traditional Sabeki Pratima surrounded by warm neighborhood music and dhunuchi dance",
                    "lat": 22.582,
                    "lng": 88.415,
                    "address": "EC Block Park, Sector I, Salt Lake, Kolkata"
          },
          {
                    "name": "Salt Lake BC, CK-CL, DL, AD, GD, HB, IA, CA, AG, AH, FE, BL, AJ Blocks",
                    "zone": "North Kolkata",
                    "vibe": "Famous Salt Lake residential sector block hopping circuit with community celebrations",
                    "lat": 22.586,
                    "lng": 88.4135,
                    "address": "Bidhannagar Salt Lake Blocks Circuit, Kolkata"
          },
          {
                    "name": "Labony Estate",
                    "zone": "North Kolkata",
                    "vibe": "One of Salt Lake's oldest and most prestigious high-rise housing complex pujos",
                    "lat": 22.5902,
                    "lng": 88.4185,
                    "address": "Labony Estate, Sector I, Salt Lake, Kolkata"
          },
          {
                    "name": "Dakshineswar Dolpere Adi",
                    "zone": "North Kolkata",
                    "vibe": "Historic temple town legacy puja blessed by the divine ambiance of Mother Kali",
                    "lat": 22.655,
                    "lng": 88.3582,
                    "address": "Dolpere, Dakshineswar, Kolkata"
          },
          {
                    "name": "Milangarh & Motijheel Sarbojanin",
                    "zone": "North Kolkata",
                    "vibe": "Historic North suburb community festival celebrated with deep devotion",
                    "lat": 22.621,
                    "lng": 88.3985,
                    "address": "Motijheel, Dum Dum, Kolkata"
          },
          {
                    "name": "CIT Sarbojanin / Satadal",
                    "zone": "North Kolkata",
                    "vibe": "Urban housing collective puja with vibrant cultural festivities and food stalls",
                    "lat": 22.594,
                    "lng": 88.392,
                    "address": "CIT Scheme, Ultadanga, Kolkata"
          },
          {
                    "name": "Naba Baghbazar",
                    "zone": "North Kolkata",
                    "vibe": "Contemporary extension of Bagbazar's festive heritage with creative touches",
                    "lat": 22.6045,
                    "lng": 88.3695,
                    "address": "Baghbazar Circular Canal, Kolkata"
          },
          {
                    "name": "Bangur Avenue Protirodh Bahini",
                    "zone": "North Kolkata",
                    "vibe": "Grand illuminated entrance gates along VIP corridor and majestic pandal craft",
                    "lat": 22.6062,
                    "lng": 88.4055,
                    "address": "Bangur Ave, VIP Rd, Kolkata"
          },
          {
                    "name": "Lalabagan Nabankur",
                    "zone": "North Kolkata",
                    "vibe": "Pioneering eco-friendly living plant pandals and inspiring environmental themes",
                    "lat": 22.5865,
                    "lng": 88.3855,
                    "address": "Lalabagan, Maniktala Main Rd, Kolkata"
          },
          {
                    "name": "Kankurgachi Jubak Brinda & Mitali",
                    "zone": "North Kolkata",
                    "vibe": "Celebrated youth collective creating viral thematic installations and grand lighting",
                    "lat": 22.5768,
                    "lng": 88.3912,
                    "address": "P-17 CIT Rd, Kankurgachi, Kolkata"
          },
          {
                    "name": "Swapnar Bagan Yubak Brinda",
                    "zone": "North Kolkata",
                    "vibe": "Creative residential puja famous for miniature hand-carved terracotta models",
                    "lat": 22.5805,
                    "lng": 88.388,
                    "address": "Swapnar Bagan, Kankurgachi, Kolkata"
          },
          {
                    "name": "Heritage Bonedi Baris (Laha Family, Chhatu Babu Latu Babu, Pathuriaghata Khelat Ghosh, Nilmani Sen, Shib Krishna Daw)",
                    "zone": "North Kolkata",
                    "vibe": "The legendary 200+ year Bonedi aristocratic family palaces of North Calcutta",
                    "lat": 22.5875,
                    "lng": 88.3615,
                    "address": "Bidhan Sarani / Beadon St Bonedi Heritage Trail, Kolkata"
          }
]
      }
    ]
  },
  {
    zoneKey: 'central',
    zoneName: 'Central Kolkata',
    bengaliName: 'মধ্য কলকাতা',
    accentColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    borderColor: 'border-emerald-500/20',
    sectors: [
      {
        id: 'central-kolkata-all',
        code: 'CK',
        title: 'Central Kolkata Pandals',
        zone: 'central',
        areas: ['College Street', 'Bowbazar', 'Beleghata', 'Entally', 'Sealdah', 'Janbazar'],
        vibe: 'Iconic water tank illuminations, record-setting architectural replicas & historic collegiate squares',
        accentColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/20',
        borderColor: 'border-emerald-400/40',
        pandals: [
          {
                    "name": "College Square Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Legendary luminous water reflection shimmering across the historic college lake",
                    "lat": 22.5739,
                    "lng": 88.3639,
                    "address": "College St, Bowbazar, Kolkata"
          },
          {
                    "name": "Santosh Mitra Square",
                    "zone": "Central Kolkata",
                    "vibe": "Record-shattering architectural spectacles, laser shows and awe-inspiring lighting",
                    "lat": 22.5684,
                    "lng": 88.3662,
                    "address": "Lebutala, Bowbazar, Kolkata"
          },
          {
                    "name": "Mohammad Ali Park",
                    "zone": "Central Kolkata",
                    "vibe": "Monumental classical Indian architecture replica and dazzling illuminated gates",
                    "lat": 22.5797,
                    "lng": 88.3615,
                    "address": "Chittaranjan Ave, Bowbazar, Kolkata"
          },
          {
                    "name": "Beleghata 33 Pally",
                    "zone": "Central Kolkata",
                    "vibe": "Pioneering contemporary thematic art capturing old Kolkata tram and heritage nostalgia",
                    "lat": 22.5662,
                    "lng": 88.3885,
                    "address": "Subhas Sarobar vicinity, Beleghata, Kolkata"
          },
          {
                    "name": "Chaltabagan Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Famed glass chandeliers, thunderous Dhunuchi Naach and star-studded VIP gatherings",
                    "lat": 22.5878,
                    "lng": 88.3705,
                    "address": "Raja Rammohan Roy Sarani, Maniktala, Kolkata"
          },
          {
                    "name": "14 Pally Udayan Sangha",
                    "zone": "Central Kolkata",
                    "vibe": "Heritage neighborhood festival with authentic local pride and artistic idol",
                    "lat": 22.571,
                    "lng": 88.3725,
                    "address": "14 Pally, Sealdah, Kolkata"
          },
          {
                    "name": "37 Pally Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Community celebration known for innovative pandal decor and cultural performances",
                    "lat": 22.565,
                    "lng": 88.384,
                    "address": "37 Pally, Beleghata Main Rd, Kolkata"
          },
          {
                    "name": "47 Pally Jubak Brinda",
                    "zone": "Central Kolkata",
                    "vibe": "Vibrant youth-led pandal with lively atmosphere and traditional Bengali rituals",
                    "lat": 22.562,
                    "lng": 88.382,
                    "address": "47 Pally, Beleghata, Kolkata"
          },
          {
                    "name": "Central Calcutta Youth Association",
                    "zone": "Central Kolkata",
                    "vibe": "Heart of central Kolkata festivities with historic urban charm",
                    "lat": 22.5702,
                    "lng": 88.3605,
                    "address": "Central Ave corridor, Bowbazar, Kolkata"
          },
          {
                    "name": "Entally Matribhumi & Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Historic harmony puja in Entally known for warmth and inclusive devotion",
                    "lat": 22.5535,
                    "lng": 88.3712,
                    "address": "Convent Rd, Entally, Kolkata"
          },
          {
                    "name": "Taltala Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Centuries-old cosmopolitan quarter puja steeped in tradition",
                    "lat": 22.5582,
                    "lng": 88.3615,
                    "address": "Taltala Ln, Dharmatala, Kolkata"
          },
          {
                    "name": "Interact Club of Chowringhee",
                    "zone": "Central Kolkata",
                    "vibe": "Social welfare and philanthropic puja celebration in the business heartland",
                    "lat": 22.554,
                    "lng": 88.353,
                    "address": "Chowringhee Rd, Kolkata"
          },
          {
                    "name": "Kanai Dhar Lane Adhibasi Brinda",
                    "zone": "Central Kolkata",
                    "vibe": "Cozy heritage alleyway celebration with intricate clay work and sabeki pratima",
                    "lat": 22.5725,
                    "lng": 88.3648,
                    "address": "Kanai Dhar Ln, Bowbazar, Kolkata"
          },
          {
                    "name": "Machua Bazar Sarbajanik",
                    "zone": "Central Kolkata",
                    "vibe": "Bustling wholesale merchant district puja with grand golden jewelry ornaments",
                    "lat": 22.581,
                    "lng": 88.362,
                    "address": "Madan Mohan Burman St, Machua, Kolkata"
          },
          {
                    "name": "New Market Sarbojanin",
                    "zone": "Central Kolkata",
                    "vibe": "Historic shopping quarter celebration glowing amidst festive market crowds",
                    "lat": 22.5605,
                    "lng": 88.3525,
                    "address": "Lindsay St, New Market, Kolkata"
          },
          {
                    "name": "Pallir Yubak Brinda",
                    "zone": "Central Kolkata",
                    "vibe": "Classic community adda hub with festive music, traditional food and cultural events",
                    "lat": 22.5635,
                    "lng": 88.3685,
                    "address": "Sealdah vicinity, Kolkata"
          },
          {
                    "name": "Wellington Nagarik Kalyan",
                    "zone": "Central Kolkata",
                    "vibe": "Historic Subodh Mallick square vicinity puja with royal illumination",
                    "lat": 22.563,
                    "lng": 88.3618,
                    "address": "Wellington Square, Dharmatala, Kolkata"
          },
          {
                    "name": "Sealdah Athletic Club",
                    "zone": "Central Kolkata",
                    "vibe": "Major railway hub transit landmark puja greeting thousands of arriving commuters",
                    "lat": 22.567,
                    "lng": 88.371,
                    "address": "Sealdah Railway Court, Kolkata"
          },
          {
                    "name": "Subodh Mallick Square",
                    "zone": "Central Kolkata",
                    "vibe": "Park-side traditional gathering with lovely sabeki ekchala idol and evening arti",
                    "lat": 22.5645,
                    "lng": 88.361,
                    "address": "Raja Subodh Mallick Square, Bowbazar, Kolkata"
          },
          {
                    "name": "Kapalitola Sarbajanin",
                    "zone": "Central Kolkata",
                    "vibe": "Historic central Calcutta puja with old-world charm and authentic devotional fervor",
                    "lat": 22.568,
                    "lng": 88.359,
                    "address": "Kapalitola Ln, Bowbazar, Kolkata"
          },
          {
                    "name": "Janbazar Rajbari",
                    "zone": "Central Kolkata",
                    "vibe": "Legendary Rani Rashmoni family heritage palace puja dating back to the 18th century",
                    "lat": 22.5618,
                    "lng": 88.3565,
                    "address": "SN Banerjee Rd, Janbazar, Kolkata"
          },
          {
                    "name": "Beleghata Sarkar Bazar & Sandhani",
                    "zone": "Central Kolkata",
                    "vibe": "Prominent canal market puja celebrated with festive grandeur and colorful street arches",
                    "lat": 22.5685,
                    "lng": 88.3895,
                    "address": "Sarkar Bazar, Beleghata Main Rd, Kolkata"
          },
          {
                    "name": "Phoolbagan 98 Pally / Sura Yubak",
                    "zone": "Central Kolkata",
                    "vibe": "Vibrant junction puja with artistic theme and dazzling electronic light gates",
                    "lat": 22.572,
                    "lng": 88.393,
                    "address": "Phoolbagan Crossing, Kolkata"
          },
          {
                    "name": "Purba Kalikata Chatra Samity",
                    "zone": "Central Kolkata",
                    "vibe": "Student youth guild celebration fostering cultural performances and social welfare",
                    "lat": 22.5675,
                    "lng": 88.386,
                    "address": "Beleghata CIT Rd, Kolkata"
          },
          {
                    "name": "Beleghata Nabamilan & Santi Sangha",
                    "zone": "Central Kolkata",
                    "vibe": "Peace and unity community puja surrounded by traditional brass bells and flowers",
                    "lat": 22.5655,
                    "lng": 88.3872,
                    "address": "Nabamilan, Beleghata, Kolkata"
          },
          {
                    "name": "Agrani Beleghata & Mitra Sangha",
                    "zone": "Central Kolkata",
                    "vibe": "Warm neighborhood celebration known for grand bhog distribution on Ashtami",
                    "lat": 22.564,
                    "lng": 88.385,
                    "address": "Mitra Sangha, Beleghata, Kolkata"
          },
          {
                    "name": "Dhiren Charu & Shramapally",
                    "zone": "Central Kolkata",
                    "vibe": "Historic labor and artisan quarter puja with authentic community bond",
                    "lat": 22.5615,
                    "lng": 88.3835,
                    "address": "Shramapally, Beleghata, Kolkata"
          },
          {
                    "name": "Beleghata Balakbrinda",
                    "zone": "Central Kolkata",
                    "vibe": "Longstanding neighborhood children's and youth organization puja",
                    "lat": 22.563,
                    "lng": 88.3865,
                    "address": "Balakbrinda, Beleghata, Kolkata"
          },
          {
                    "name": "Kishore Sangha & Purbanchal",
                    "zone": "Central Kolkata",
                    "vibe": "Eastern Kolkata sports association puja with traditional sabeki idol",
                    "lat": 22.5595,
                    "lng": 88.385,
                    "address": "Purbanchal, Beleghata, Kolkata"
          },
          {
                    "name": "Tangra Hari Sabha & Gholpara",
                    "zone": "Central Kolkata",
                    "vibe": "Historic Chinatown perimeter festival blending diverse communities and devotion",
                    "lat": 22.5485,
                    "lng": 88.388,
                    "address": "Tangra Hari Sabha, Tangra, Kolkata"
          },
          {
                    "name": "Kacharipara Durga Sporting",
                    "zone": "Central Kolkata",
                    "vibe": "Old sports club festival celebration with joyous dhaaki procession",
                    "lat": 22.551,
                    "lng": 88.3895,
                    "address": "Kacharipara, Tangra, Kolkata"
          },
          {
                    "name": "Brindaban Matri Mandir / Karbagan",
                    "zone": "Central Kolkata",
                    "vibe": "Devotional shrine puja celebrated with solemn Vedic chants and exquisite floral decor",
                    "lat": 22.582,
                    "lng": 88.373,
                    "address": "Karbagan, Maniktala, Kolkata"
          }
]
      }
    ]
  },
  {
    zoneKey: 'south',
    zoneName: 'South Kolkata',
    bengaliName: 'দক্ষিণ কলকাতা',
    accentColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    borderColor: 'border-amber-500/20',
    sectors: [
      {
        id: 'south-kolkata-all',
        code: 'SK',
        title: 'South Kolkata Pandals',
        zone: 'south',
        areas: ['Ballygunge', 'Gariahat', 'Kalighat', 'Alipore', 'Behala', 'Jodhpur Park', 'Kasba', 'Garia'],
        vibe: 'Majestic open adda lawns, German chandeliers, avant-garde thematic sculptures & cosmopolitan festival energy',
        accentColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/20',
        borderColor: 'border-amber-400/40',
        pandals: [
          {
                    "name": "Badamtala Ashar Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Avant-garde artistic craftsmanship and pioneering themes in South Kolkata heartland",
                    "lat": 22.521,
                    "lng": 88.3475,
                    "address": "Nepal Bhattacharya St, Kalighat, Kolkata"
          },
          {
                    "name": "Ballygunge Cultural Association",
                    "zone": "South Kolkata",
                    "vibe": "Subtle artistic elegance, serene traditional vibes and breathtaking lighting displays",
                    "lat": 22.5234,
                    "lng": 88.3667,
                    "address": "57 Jatin Das Rd, Lake Terrace, Kolkata"
          },
          {
                    "name": "Deshapriya Park",
                    "zone": "South Kolkata",
                    "vibe": "Grand mega-scale park installation renowned for world-record spectacle and massive crowds",
                    "lat": 22.518,
                    "lng": 88.356,
                    "address": "Deshapriya Park, Rashbehari Ave, Kolkata"
          },
          {
                    "name": "Suruchi Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Celebrated pan-Indian cultural representations and exquisite artisanal craft",
                    "lat": 22.5085,
                    "lng": 88.334,
                    "address": "New Alipore, Kolkata"
          },
          {
                    "name": "Ekdalia Evergreen Club",
                    "zone": "South Kolkata",
                    "vibe": "Dazzling German chandeliers, classic golden Sabeki Pratima and royal lighting arches",
                    "lat": 22.5218,
                    "lng": 88.367,
                    "address": "15 Ekdalia Rd, Gariahat, Kolkata"
          },
          {
                    "name": "Jodhpur Park",
                    "zone": "South Kolkata",
                    "vibe": "Cosmopolitan festival epicenter with majestic pandal architecture and cultural evenings",
                    "lat": 22.503,
                    "lng": 88.362,
                    "address": "Jodhpur Park, Kolkata"
          },
          {
                    "name": "Bosepukur Sitala Mandir",
                    "zone": "South Kolkata",
                    "vibe": "Pioneers of theme puja utilizing indigenous natural materials like clay, jute and bamboo",
                    "lat": 22.515,
                    "lng": 88.389,
                    "address": "Bosepukur, Kasba, Kolkata"
          },
          {
                    "name": "Tridhara Sammilani",
                    "zone": "South Kolkata",
                    "vibe": "Intersection of heritage, culture and avant-garde sculpture attracting millions",
                    "lat": 22.5175,
                    "lng": 88.357,
                    "address": "Manoharpukur Rd, Rashbehari, Kolkata"
          },
          {
                    "name": "Mudiali Club",
                    "zone": "South Kolkata",
                    "vibe": "Hypnotic traditional craftsmanship, intricate wooden fretwork and classic sabeki pratima",
                    "lat": 22.512,
                    "lng": 88.35,
                    "address": "Mudiali, Rajani Sen Rd, Kolkata"
          },
          {
                    "name": "Shibmandir",
                    "zone": "South Kolkata",
                    "vibe": "Lakeside artistic marvel with innovative conceptual idols and moving lighting",
                    "lat": 22.5105,
                    "lng": 88.3515,
                    "address": "Lake Temple Rd, Rabindra Sarobar, Kolkata"
          },
          {
                    "name": "Singhi Park Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Monumental temple replicas, authentic golden jewelry and royal Chandannagar illumination",
                    "lat": 22.522,
                    "lng": 88.364,
                    "address": "Singhi Park, Dover Ln, Gariahat, Kolkata"
          },
          {
                    "name": "Maddox Square",
                    "zone": "South Kolkata",
                    "vibe": "The legendary open green adda lawn, youth carnival, food stalls and lifelong memories",
                    "lat": 22.5312,
                    "lng": 88.3582,
                    "address": "Pritam Mookerjee Rd, Ballygunge, Kolkata"
          },
          {
                    "name": "Samaj Sebi Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Deeply humanitarian themes promoting inclusivity, social awareness and traditional art",
                    "lat": 22.519,
                    "lng": 88.358,
                    "address": "Lake View Rd, Sarat Bose Rd, Kolkata"
          },
          {
                    "name": "Hindustan Park Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Elegantly refined artistic decor, calm courtyard ambiance and traditional pratima",
                    "lat": 22.5202,
                    "lng": 88.361,
                    "address": "Hindustan Park, Gariahat, Kolkata"
          },
          {
                    "name": "Naktala Udayan Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Colossal artistic landmark with bold sculptural installations and golden grandeur",
                    "lat": 22.476,
                    "lng": 88.363,
                    "address": "Naktala, Tollygunge / NSC Bose Rd, Kolkata"
          },
          {
                    "name": "Rajdanga Naba Uday Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Vibrant craft extravaganza using brass, handlooms and authentic rural Bengali art",
                    "lat": 22.514,
                    "lng": 88.391,
                    "address": "Rajdanga Main Rd, Kasba, Kolkata"
          },
          {
                    "name": "66 Pally",
                    "zone": "South Kolkata",
                    "vibe": "Heritage neighborhood festival in Kalighat with unique artist interpretations",
                    "lat": 22.5195,
                    "lng": 88.349,
                    "address": "66 Pally, Nepal Bhattacharya St, Kolkata"
          },
          {
                    "name": "Abasar Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Warm community puja near Bhowanipore with traditional warmth and serene bhog",
                    "lat": 22.5285,
                    "lng": 88.348,
                    "address": "Abasar, Bhowanipore, Kolkata"
          },
          {
                    "name": "Chakraberia Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Historic 70+ year puja known for intricate artistic pandals and cultural programs",
                    "lat": 22.531,
                    "lng": 88.352,
                    "address": "Chakraberia Rd, Bhowanipore, Kolkata"
          },
          {
                    "name": "Alipur Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Upscale neighborhood festival celebrating with grand pandal and classical idol",
                    "lat": 22.533,
                    "lng": 88.331,
                    "address": "Alipore Park Rd, Alipore, Kolkata"
          },
          {
                    "name": "Gariahat Hindusthan Club",
                    "zone": "South Kolkata",
                    "vibe": "Festive retail hub adda with colorful lighting arches and thunderous music",
                    "lat": 22.5185,
                    "lng": 88.365,
                    "address": "Gariahat Market vicinity, Kolkata"
          },
          {
                    "name": "Bosepukur Talbagan",
                    "zone": "South Kolkata",
                    "vibe": "Acclaimed thematic installation featuring eco-friendly tribal art and clay models",
                    "lat": 22.5125,
                    "lng": 88.3875,
                    "address": "Talbagan, Kasba, Kolkata"
          },
          {
                    "name": "Purbachal Shakti Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Energetic sports club festival celebration with royal sabeki pratima",
                    "lat": 22.505,
                    "lng": 88.375,
                    "address": "Purbachal, Haltu, Kolkata"
          },
          {
                    "name": "Santoshpur Trikon Park",
                    "zone": "South Kolkata",
                    "vibe": "Triangle park festival centerpiece with artistic lighting and serene adda",
                    "lat": 22.498,
                    "lng": 88.385,
                    "address": "Trikon Park, Santoshpur, Kolkata"
          },
          {
                    "name": "Santoshpur Avenue South",
                    "zone": "South Kolkata",
                    "vibe": "Vibrant tree-lined residential avenue celebration with festive warmth",
                    "lat": 22.4965,
                    "lng": 88.383,
                    "address": "Avenue South, Santoshpur, Kolkata"
          },
          {
                    "name": "Santoshpur Lake Pally",
                    "zone": "South Kolkata",
                    "vibe": "Waterfront park festival celebrated with traditional music and glorious arti",
                    "lat": 22.495,
                    "lng": 88.382,
                    "address": "Lake Pally, Santoshpur, Kolkata"
          },
          {
                    "name": "25 Pally",
                    "zone": "South Kolkata",
                    "vibe": "Kidderpore heritage puja blending cultural harmony and traditional worship",
                    "lat": 22.535,
                    "lng": 88.324,
                    "address": "25 Pally, Kidderpore, Kolkata"
          },
          {
                    "name": "Pally Sarodiya",
                    "zone": "South Kolkata",
                    "vibe": "Community celebration with traditional touch and welcoming hospitality",
                    "lat": 22.508,
                    "lng": 88.368,
                    "address": "Jodhpur Park extension, Kolkata"
          },
          {
                    "name": "Behala Nutan Dal",
                    "zone": "South Kolkata",
                    "vibe": "Avant-garde contemporary installations drawing millions of South suburban visitors",
                    "lat": 22.495,
                    "lng": 88.312,
                    "address": "Behala Tram Depot vicinity, Kolkata"
          },
          {
                    "name": "Behala Friends",
                    "zone": "South Kolkata",
                    "vibe": "Beloved neighborhood friends circle festival celebrated with joyous fervor",
                    "lat": 22.498,
                    "lng": 88.314,
                    "address": "Behala Friends Club, Roy Bahadur Rd, Kolkata"
          },
          {
                    "name": "Behala Club",
                    "zone": "South Kolkata",
                    "vibe": "Centenary sports club celebration with immense traditional Sabeki idol",
                    "lat": 22.497,
                    "lng": 88.315,
                    "address": "Behala Club Ground, Parnasree Rd, Kolkata"
          },
          {
                    "name": "Barisha Club",
                    "zone": "South Kolkata",
                    "vibe": "Sensational socially conscious thematic art installations that touch the soul",
                    "lat": 22.485,
                    "lng": 88.309,
                    "address": "Barisha, Diamond Harbour Rd, Kolkata"
          },
          {
                    "name": "SB Park Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Thakurpukur / Behala green park festival with majestic architectural pandal",
                    "lat": 22.478,
                    "lng": 88.302,
                    "address": "SB Park, State Bank Colony, Thakurpukur, Kolkata"
          },
          {
                    "name": "Ajeya Sanghati",
                    "zone": "South Kolkata",
                    "vibe": "Acclaimed artistic themes highlighting forgotten rural heritage and crafts",
                    "lat": 22.49,
                    "lng": 88.322,
                    "address": "Haridevpur, Tollygunge, Kolkata"
          },
          {
                    "name": "41 Pally Club",
                    "zone": "South Kolkata",
                    "vibe": "Dynamic Haridevpur cluster puja celebrated with innovative visual concepts",
                    "lat": 22.488,
                    "lng": 88.325,
                    "address": "41 Pally, Haridevpur, Kolkata"
          },
          {
                    "name": "Vivekananda Park Athletic Club",
                    "zone": "South Kolkata",
                    "vibe": "Sports ground festival with massive entrance gate and sparkling lighting towers",
                    "lat": 22.499,
                    "lng": 88.328,
                    "address": "Vivekananda Park, Haridevpur, Kolkata"
          },
          {
                    "name": "Chetla Agrani Club",
                    "zone": "South Kolkata",
                    "vibe": "World-famous masterpiece installations designed by leading national award-winning artists",
                    "lat": 22.514,
                    "lng": 88.342,
                    "address": "Chetla, Alipore, Kolkata"
          },
          {
                    "name": "95 Pally Jodhpur Park",
                    "zone": "South Kolkata",
                    "vibe": "High-concept thematic installation with exquisite idol and peaceful park ambiance",
                    "lat": 22.502,
                    "lng": 88.361,
                    "address": "95 Pally, Jodhpur Park, Kolkata"
          },
          {
                    "name": "Selimpur Pally",
                    "zone": "South Kolkata",
                    "vibe": "Award-winning artistic marvel showcasing raw terracotta and natural handloom fibers",
                    "lat": 22.506,
                    "lng": 88.364,
                    "address": "Selimpur Rd, Dhakuria, Kolkata"
          },
          {
                    "name": "Dhakuria Sarbojanin (Pally Mangal)",
                    "zone": "South Kolkata",
                    "vibe": "Historic Dhakuria neighborhood puja renowned for warm community adda",
                    "lat": 22.508,
                    "lng": 88.368,
                    "address": "Dhakuria Station Rd, Kolkata"
          },
          {
                    "name": "Baghajatin Tarun Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Major South corridor transit puja with grand pandal and vibrant cultural stage",
                    "lat": 22.482,
                    "lng": 88.374,
                    "address": "Baghajatin Crossing, Kolkata"
          },
          {
                    "name": "Rajdanga Amra Kojon",
                    "zone": "South Kolkata",
                    "vibe": "Kasba area community adda puja celebrated with colorful street lighting",
                    "lat": 22.516,
                    "lng": 88.393,
                    "address": "Rajdanga, Kasba, Kolkata"
          },
          {
                    "name": "Garia Baishnabghata",
                    "zone": "South Kolkata",
                    "vibe": "Ancient southern temple belt celebration with serene devotional ambiance",
                    "lat": 22.468,
                    "lng": 88.379,
                    "address": "Baishnabghata, Garia, Kolkata"
          },
          {
                    "name": "Pally Unnayan Samity",
                    "zone": "South Kolkata",
                    "vibe": "Local community enhancement puja with beautiful pandal and lively cultural programs",
                    "lat": 22.487,
                    "lng": 88.365,
                    "address": "Netaji Nagar, Tollygunge, Kolkata"
          },
          {
                    "name": "Bakul Bagan",
                    "zone": "South Kolkata",
                    "vibe": "Centenary institution famous for traditional idol sculpted by master artists",
                    "lat": 22.527,
                    "lng": 88.347,
                    "address": "Bakul Bagan Rd, Bhowanipore, Kolkata"
          },
          {
                    "name": "Bhowanipore Benubana Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Warm residential quarter celebration with traditional sabeki idol",
                    "lat": 22.525,
                    "lng": 88.345,
                    "address": "Benubana Sangha, Bhowanipore, Kolkata"
          },
          {
                    "name": "Dakshinpara",
                    "zone": "South Kolkata",
                    "vibe": "Traditional southern neighborhood puja with joyous neighborhood participation",
                    "lat": 22.492,
                    "lng": 88.354,
                    "address": "Dakshinpara, Tollygunge, Kolkata"
          },
          {
                    "name": "Nepal Bhattacharya Street",
                    "zone": "South Kolkata",
                    "vibe": "Historic Kalighat heritage lane festival near the temple precinct",
                    "lat": 22.5205,
                    "lng": 88.3465,
                    "address": "Nepal Bhattacharya St, Kalighat, Kolkata"
          },
          {
                    "name": "68 Pally & 76 Pally",
                    "zone": "South Kolkata",
                    "vibe": "Twin Bhowanipore heritage neighborhood pujos with lively dhaak competitions",
                    "lat": 22.524,
                    "lng": 88.351,
                    "address": "Debabrata Mukherjee Rd, Bhowanipore, Kolkata"
          },
          {
                    "name": "Bhowanipur 75 Pally",
                    "zone": "South Kolkata",
                    "vibe": "Majestic South Kolkata institution famous for massive thematic outdoor installations",
                    "lat": 22.529,
                    "lng": 88.349,
                    "address": "75 Pally, Bhowanipore, Kolkata"
          },
          {
                    "name": "22 Pally (Northern Park)",
                    "zone": "South Kolkata",
                    "vibe": "Grand park gathering in Bhowanipore with food stalls and luminous lights",
                    "lat": 22.534,
                    "lng": 88.351,
                    "address": "Northern Park, Bhowanipore, Kolkata"
          },
          {
                    "name": "Paddapukur Youth & Harish Park",
                    "zone": "South Kolkata",
                    "vibe": "Sprawling park puja with magnificent lighting along Harish Mukherjee corridor",
                    "lat": 22.528,
                    "lng": 88.344,
                    "address": "Harish Park, Paddapukur, Kolkata"
          },
          {
                    "name": "Agradut Udaya Sangha & Swadhin",
                    "zone": "South Kolkata",
                    "vibe": "Southern suburbs youth guild puja celebrated with festive gusto",
                    "lat": 22.483,
                    "lng": 88.359,
                    "address": "Ranikuthi, Tollygunge, Kolkata"
          },
          {
                    "name": "New Sporting Club",
                    "zone": "South Kolkata",
                    "vibe": "Classic sports association celebration with sabeki idol and evening cultural shows",
                    "lat": 22.479,
                    "lng": 88.361,
                    "address": "Kudghat, Tollygunge, Kolkata"
          },
          {
                    "name": "Regent Park & Roynagar Unyan",
                    "zone": "South Kolkata",
                    "vibe": "Serene residential park puja with peaceful devotional atmosphere",
                    "lat": 22.485,
                    "lng": 88.351,
                    "address": "Regent Park, Tollygunge, Kolkata"
          },
          {
                    "name": "Baishnabghata Balak Samity",
                    "zone": "South Kolkata",
                    "vibe": "Traditional children's and youth welfare organization festival celebration",
                    "lat": 22.469,
                    "lng": 88.377,
                    "address": "Baishnabghata, Garia, Kolkata"
          },
          {
                    "name": "Kendua Shanti Sangha & Naba Durga",
                    "zone": "South Kolkata",
                    "vibe": "Garia belt community peace puja with magnificent traditional Pratima",
                    "lat": 22.467,
                    "lng": 88.382,
                    "address": "Kendua Main Rd, Garia, Kolkata"
          },
          {
                    "name": "Garia Mitali & Tarun Sathi",
                    "zone": "South Kolkata",
                    "vibe": "Joyful friendship collective puja with music, fireworks and traditional bhog",
                    "lat": 22.464,
                    "lng": 88.384,
                    "address": "Garia Station Rd, Kolkata"
          },
          {
                    "name": "Shyama Pally & Kamdahari Purbapara",
                    "zone": "South Kolkata",
                    "vibe": "Cosy suburban colony celebration with heartwarming community adda",
                    "lat": 22.462,
                    "lng": 88.386,
                    "address": "Kamdahari, Garia, Kolkata"
          },
          {
                    "name": "Patuli Sarbojanin",
                    "zone": "South Kolkata",
                    "vibe": "Floating market vicinity planned township puja with eco-friendly pandal",
                    "lat": 22.475,
                    "lng": 88.388,
                    "address": "Patuli Connector, EM Bypass, Kolkata"
          },
          {
                    "name": "Babu bagan Club",
                    "zone": "South Kolkata",
                    "vibe": "Grand architectural replicas made of authentic commemorative coins and temple art",
                    "lat": 22.509,
                    "lng": 88.366,
                    "address": "Babu Bagan, Dhakuria, Kolkata"
          },
          {
                    "name": "Falguni Sangha",
                    "zone": "South Kolkata",
                    "vibe": "Celebrated Kasba neighborhood club with creative visual themes",
                    "lat": 22.511,
                    "lng": 88.389,
                    "address": "Falguni Sangha, Kasba, Kolkata"
          },
          {
                    "name": "Friends Club & Players Corner",
                    "zone": "South Kolkata",
                    "vibe": "Sports stars' adda puja with joyful festive ambiance and golden idol",
                    "lat": 22.518,
                    "lng": 88.354,
                    "address": "Southern Ave, Kolkata"
          },
          {
                    "name": "State Bank Park",
                    "zone": "South Kolkata",
                    "vibe": "Behala Thakurpukur green colony puja renowned for peaceful family adda",
                    "lat": 22.476,
                    "lng": 88.304,
                    "address": "State Bank Park, Thakurpukur, Kolkata"
          },
          {
                    "name": "Sabarna Roy Chowdhury (Bonedi)",
                    "zone": "South Kolkata",
                    "vibe": "Dating back to 1610, the ancient Barisha zamindar puja that predates Kolkata itself",
                    "lat": 22.482,
                    "lng": 88.307,
                    "address": "Sabarna Roy Chowdhury Path, Barisha, Kolkata"
          },
          {
                    "name": "Behala Jagat Ram / Roy Family",
                    "zone": "South Kolkata",
                    "vibe": "Historic 300-year aristocratic Roy family Bonedi Bari puja with sacred rituals",
                    "lat": 22.492,
                    "lng": 88.311,
                    "address": "Roy Family Mansion, Behala, Kolkata"
          },
          {
                    "name": "Bhukailash Rajbari (Bonedi)",
                    "zone": "South Kolkata",
                    "vibe": "Ancient 1781 royal palace puja with sacred twin Shiva temples and regal heritage",
                    "lat": 22.537,
                    "lng": 88.322,
                    "address": "Bhukailash Rd, Kidderpore, Kolkata"
          }
]
      }
    ]
  }
];
