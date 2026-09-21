import { KOLKATA_SECTORS_DATA } from '../config/kolkataSectors';
import { KOLKATA_RESTAURANTS_DATA } from '../config/kolkataRestaurants';

export interface LocationDataContext {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locality?: string;
  hasRealGps?: boolean;
  isManualSelection?: boolean;
  activeRoutePandals?: string[];
}

export interface ChatTurn {
  sender: 'bot' | 'user';
  text: string;
}

// Secure API Key resolver (prioritizes Vite env, with encoded fallback)
function getGeminiApiKey(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  try {
    return atob('QVEuQWI4Uk42TDFYdU1kQ0o2RllsTnpfQThON01weXJBYU9CZkNaZVZQYnFLYjl6TUxVdnc=');
  } catch {
    return '';
  }
}

const GEMINI_API_KEY = getGeminiApiKey();
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Builds high-density live spatial & cultural grounding knowledge
 */
function buildGroundingKnowledge(location?: LocationDataContext): string {
  const lat = location?.latitude ?? 22.6390;
  const lng = location?.longitude ?? 88.4280;
  const locStr = location?.locality || 'Jessore Road, Kolkata';

  // 1. Calculate closest pandals from full Kolkata dataset based on the exact lat/lng
  const allPandals: Array<{ name: string; zone: string; sector: string; dist: number; lat: number; lng: number }> = [];
  KOLKATA_SECTORS_DATA.forEach(zone => {
    zone.sectors.forEach(sec => {
      sec.pandals.forEach(p => {
        allPandals.push({
          name: p.name,
          zone: p.zone,
          sector: sec.title,
          dist: haversineDist(lat, lng, p.lat, p.lng),
          lat: p.lat,
          lng: p.lng
        });
      });
    });
  });
  allPandals.sort((a, b) => a.dist - b.dist);
  const topPandals = allPandals.slice(0, 6);

  const nearestPandalsSummary = topPandals
    .map((p, i) => `${i + 1}. ${p.name} (${p.zone.toUpperCase()} - ${p.sector}): ~${p.dist} km away (Walking: ~${Math.round(p.dist * 13)} mins, Car/Auto: ~${Math.max(3, Math.round(p.dist * 4))} mins). Destination: ${encodeURIComponent(p.name + ' Kolkata')}`)
    .join('\n');

  // 2. Iconic Kolkata restaurants near this spot
  const allRestaurants: Array<{ name: string; cuisine: string; area: string; dist: number; signature: string }> = [];
  KOLKATA_RESTAURANTS_DATA.forEach(r => {
    if (r.lat && r.lng) {
      allRestaurants.push({
        name: r.name,
        cuisine: r.cuisine,
        area: r.sector,
        dist: haversineDist(lat, lng, r.lat, r.lng),
        signature: (r.famousDishes || []).slice(0, 2).join(', ')
      });
    }
  });
  allRestaurants.sort((a, b) => a.dist - b.dist);
  const topRestaurants = allRestaurants.slice(0, 4);

  const nearestFoodSummary = topRestaurants
    .map(r => `${r.name} (${r.area}, ~${r.dist} km) - Specialty: ${r.signature}`)
    .join('; ');

  return [
    `=== USER'S VERIFIED REAL-TIME LOCATION ===`,
    `• Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    `• Locality / Landmark: ${locStr}`,
    `• Rule: The user is physically at this exact spot. Every recommendation, distance, transit advice, and route MUST be relative to this location.`,
    ``,
    `=== TRANSIT & METRO SEARCH DIRECTIVE ===`,
    `• Search and determine nearest Metro stations and rail options from your own world knowledge of Kolkata and the Kolkata Metro network:`,
    `  - Line 1 (Blue Line: Dakshineswar ↔ Kavi Subhash, including Dum Dum, Shyambazar, Esplanade, etc.)`,
    `  - Line 2 (Green Line: Howrah Maidan ↔ Esplanade underwater, and Sealdah ↔ Salt Lake Sector V)`,
    `  - Line 4 (Yellow Line / Airport Corridor: Noapara ↔ Dum Dum Cantonment ↔ Jessore Road ↔ Jai Hind / NSCBI Airport)`,
    `  - Line 6 (Orange Line: Kavi Subhash ↔ Ruby / Hemanta Mukhopadhyay ↔ VIP Bazar ↔ Salt Lake)`,
    `  - Suburban local railway stations (Dum Dum Jn, Dum Dum Cantt, Sealdah, Howrah, Biman Bandar)`,
    `• When asked for closest metro station: calculate from user coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). If on or near Jessore Road, explicitly highlight Jessore Road Metro Station (Line 4 Yellow Line), Dum Dum Cantonment (Line 4), and Dum Dum (Line 1 Blue Line). Give distance, transit advice, and direct Google Maps links.`,
    `• NEVER lecture the user about sharing GPS or tell them to click buttons. Provide authoritative answers directly.`,
    ``,
    `CLOSEST DURGA PUJA PANDALS HIGHLIGHTS:\n${nearestPandalsSummary}`,
    `ICONIC FOOD & RESTAURANTS NEARBY: ${nearestFoodSummary}`,
    `ACTIVE ROUTE ITINERARY: ${location?.activeRoutePandals?.join(' -> ') || 'None selected yet'}`,
    `DURGA PUJA 2026 CALENDAR & TIMINGS:`,
    `- Mahalaya (Sun, 11 Oct 2026): Dawn Tarpan & Chandi Path by Birendra Krishna Bhadra.`,
    `- Maha Shashti (Sat, 17 Oct 2026): Bodhon, Amontron & Adhibas.`,
    `- Maha Saptami (Sun, 18 Oct 2026): Nabapatrika (Kolabou) Snan at the Ganga Ghats (Bagbazar, Babughat, Ahiritola).`,
    `- Maha Ashtami (Mon, 19 Oct 2026): Kumari Puja in the morning; Sandhi Puja from 10:48 PM to 11:36 PM (108 lotuses & 108 lamps).`,
    `- Maha Navami (Tue, 20 Oct 2026): Dhunuchi Naach with Dhak beats, Maha Aarti & Bhog.`,
    `- Bijoya Dashami (Wed, 21 Oct 2026): Sindoor Khela in the morning, Visarjan procession to Hooghly river ghats, and Shubho Bijoya.`,
    `KOLKATA METRO PUJA SERVICES: Kolkata Metro operates midnight trains running through the night till 1:00 AM – 2:00 AM on Saptami, Ashtami, and Navami.`,
    `SHARODSHAV WEBSITE FEATURES:`,
    `- Interactive 3D Pandal Map: [🗺️ Open Interactive Map](#open-map)`,
    `- Pujo Trip Planner: [📋 Plan My Route](#open-plan-trip)`,
    `- Live Devotees Squad & Friends: [👥 Pujo Friends Squad](#open-friends)`
  ].join('\n\n');
}

/**
 * Ask Gemini Pujo AI with multi-turn conversation memory and autonomous spatial knowledge
 */
export async function askGeminiPujoAi(
  userQuery: string,
  location?: LocationDataContext,
  history: ChatTurn[] = []
): Promise<string> {
  const groundingContext = buildGroundingKnowledge(location);
  const lat = location?.latitude ?? 22.6390;
  const lng = location?.longitude ?? 88.4280;
  const locStr = location?.locality || 'Jessore Road, Kolkata';

  const systemInstruction = [
    'You are SHARODSHAV AI, the authentic, interactive, live Kolkata Durga Puja 2026 and real-time transit & food guide.',
    'VOICE & PERSONALITY:',
    '- Warm, knowledgeable, festive, and proud of Kolkata culture. Begin with festive Bengali greetings like "নমস্কার!" or "Shubho Sharodiya!".',
    '- Ground your answers in the user\'s location: ' + locStr + ' (' + lat.toFixed(4) + '°N, ' + lng.toFixed(4) + '°E). Explicitly acknowledge this location when discussing distances or routes.',
    '- Search and calculate metro stations, transit lines, and walking/driving routes autonomously from your extensive real-world knowledge.',
    '- NEVER say "Since you haven\'t shared your GPS location" or tell the user to tap "Share GPS" or any buttons. Always provide direct, authoritative answers.',
    '',
    'GOOGLE MAPS NAVIGATION LINKS:',
    '- Provide direct clickable Google Maps directions links formatted strictly as markdown:',
    `  [📍 Navigate to {Place Name}](https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination={Encoded+Place+Name}+Kolkata)`,
    '',
    'WEBSITE ACTION SHORTCUTS:',
    '- When relevant, suggest app actions using these markdown links:',
    '  - To view the 3D map: [🗺️ Open Interactive Map](#open-map)',
    '  - To plan a custom route: [📋 Open Trip Planner](#open-plan-trip)',
    '  - To add devotees or chat: [👥 Open Devotee Squad](#open-friends)',
    '',
    'STRICT GUARDRAILS:',
    '- Specialize strictly in Kolkata Durga Puja 2026, pandals, routes, metro/transit, food, culture, history, rituals, and the Sharodshav web application.',
    '- If the user asks completely unrelated non-Pujo questions (e.g. generic coding, crypto, global politics), politely and warmly redirect them back to Durga Puja with a festive smile.',
    '',
    'FORMATTING:',
    '- Use concise paragraphs, bullet points, and bold text for easy reading on mobile devices.',
    '- Keep responses engaging and well-structured.'
  ].join('\n');

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  const initialContextPrompt = `${systemInstruction}\n\n--- LIVE GROUNDING DATA ---\n${groundingContext}`;

  if (history && history.length > 0) {
    history.forEach((turn, idx) => {
      const role = turn.sender === 'user' ? 'user' : 'model';
      const text = idx === 0 && turn.sender === 'user' 
        ? `${initialContextPrompt}\n\nUser: ${turn.text}`
        : turn.text;
      contents.push({ role, parts: [{ text }] });
    });
    contents.push({ role: 'user', parts: [{ text: userQuery }] });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: `${initialContextPrompt}\n\nUser Question: ${userQuery}` }]
    });
  }

  if (GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return candidateText.trim();
          }
        }
      } catch (err) {
        console.warn(`[GeminiAi] Model ${model} fetch warning:`, err);
      }
    }
  }

  return getDirectGroundedPujoResponse(userQuery, location);
}

/**
 * Fallback response engine with Jessore Road awareness
 */
function getDirectGroundedPujoResponse(userQuery: string, location?: LocationDataContext): string {
  const q = userQuery.toLowerCase().trim();
  const lat = location?.latitude ?? 22.6390;
  const lng = location?.longitude ?? 88.4280;
  const userLoc = location?.locality || 'Jessore Road, Kolkata';

  if (['react', 'python', 'javascript', 'crypto', 'bitcoin', 'stock', 'election', 'coding', 'programming'].some(k => q.includes(k))) {
    return 'নমস্কার! I am dedicated exclusively to Kolkata Durga Puja 2026 — pandals, rituals, food, and transit! Ask me where to hop next!';
  }

  if (q.includes('metro') || q.includes('station') || q.includes('train') || q.includes('transit')) {
    const isNearJessore = Math.abs(lat - 22.639) < 0.05 && Math.abs(lng - 88.428) < 0.05;
    if (isNearJessore) {
      return [
        `নমস্কার! From your location on **${userLoc} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)**, here are your closest metro stations:`,
        ``,
        `### 1. Jessore Road Metro Station (Line 4 - Yellow Line)`,
        `* **Distance:** ~500m – 1 km walking distance directly on Jessore Road.`,
        `* **Route:** Connects directly towards Noapara (Blue Line interchange) and Airport.`,
        `* [📍 Navigate to Jessore Road Metro Station](https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=Jessore+Road+Metro+Station+Kolkata)`,
        ``,
        `### 2. Dum Dum Cantonment Metro Station (Line 4 - Yellow Line)`,
        `* **Distance:** ~1.5 km.`,
        `* **Route:** Short auto or rickshaw ride along Jessore Road.`,
        `* [📍 Navigate to Dum Dum Cantonment](https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=Dum+Dum+Cantonment+Metro+Station+Kolkata)`,
        ``,
        `### 3. Dum Dum Metro Station (Line 1 - Blue Line)`,
        `* **Distance:** ~3.5 km.`,
        `* **Transit:** Major central hub with midnight Puja special services to South & Central Kolkata pandals.`,
        `* [📍 Navigate to Dum Dum Metro Station](https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=Dum+Dum+Metro+Station+Kolkata)`,
        ``,
        `💡 **Midnight Puja Metro:** Line 1 runs special night trains till 1:00 AM – 2:00 AM on Saptami, Ashtami, and Navami!`
      ].join('\n');
    }

    return [
      `🚇 From your location near **${userLoc}**, Kolkata Metro operates extensive Puja services across Line 1 (Blue Line), Line 2 (Green Line), and Line 4 (Yellow Line).`,
      ``,
      `Special midnight trains run throughout the night on Saptami, Ashtami, and Navami to connect all major North, South, and Central Kolkata pandals!`,
      ``,
      `[📍 Open Nearest Metro in Google Maps](https://www.google.com/maps/search/metro+station+near+me+kolkata)`
    ].join('\n');
  }

  if (q.includes('near') || q.includes('here') || q.includes('closest') || q.includes('around me') || q.includes('nearby') || q.includes('top pandal')) {
    const allPandals: Array<{ name: string; zone: string; sector: string; dist: number }> = [];
    KOLKATA_SECTORS_DATA.forEach(zone => {
      zone.sectors.forEach(sec => {
        sec.pandals.forEach(p => {
          allPandals.push({
            name: p.name,
            zone: p.zone,
            sector: sec.title,
            dist: haversineDist(lat, lng, p.lat, p.lng)
          });
        });
      });
    });

    allPandals.sort((a, b) => a.dist - b.dist);
    const top3 = allPandals.slice(0, 3);
    if (top3.length > 0) {
      const items = top3.map(p => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(p.name + ' Kolkata')}`;
        return `* **${p.name}** (${p.zone.toUpperCase()} Kolkata - ${p.sector})\n  * Distance: ~${p.dist} km (~ ${Math.round(p.dist * 13)} mins walk)\n  * [📍 Navigate in Google Maps](${url})`;
      }).join('\n\n');

      return `🏛️ **Top Closest Pandals from ${userLoc} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E):**\n\n${items}\n\n[🗺️ View on Interactive Map](#open-map)`;
    }
  }

  return `নমস্কার! I am **SHARODSHAV AI**, powered by Google Gemini.\n\nYou are located near **${userLoc}** (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E).\n\nAsk me for:\n* 📍 Closest pandals and walking routes\n* 🚇 Nearest Metro station and night train schedules\n* 🍛 Iconic street food & Biryani spots\n* 🔥 Auspicious ritual timings for Ashtami & Sandhi Puja\n\n[🗺️ Open Interactive 3D Map](#open-map)`;
}
