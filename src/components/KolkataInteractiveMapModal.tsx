import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Navigation, 
  Sparkles, 
  Calendar, 
  ExternalLink,
  ArrowLeft,
  Check,
  Star,
  Route,
  CheckSquare,
  Utensils,
  Clock,
  Train,
  CheckCircle2,
  ChefHat,
  Copy,
  SlidersHorizontal,
  ArrowUpDown,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { 
  DURGA_PUJA_2026, 
  KOLKATA_ZONES, 
  type FestivalDay, 
  type PandalPlace,
  type KolkataZoneInfo 
} from '../config/festivalConfig';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { KOLKATA_SECTORS_DATA } from '../config/kolkataSectors';
import { 
  optimizeRoute, 
  calculateRouteDistance, 
  findNearestStations,
  type NearestStationResult 
} from '../config/kolkataTransit';
import { 
  getRestaurantsForZone, 
  type KolkataRestaurant 
} from '../config/kolkataRestaurants';
import { 
  createOrUpdatePlannedTeam, 
  generateTeamCode, 
  generateTeamInviteUrl, 
  type PlannedTeam 
} from '../services/teamService';

interface KolkataInteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayId?: string | null;
  initialZone?: 'north' | 'central' | 'south' | null;
  initialPandalNames?: string[];
  initialConfirmed?: boolean;
  initialTeam?: PlannedTeam | null;
  onSelectDay?: (day: FestivalDay) => void;
  onOpenPlanTrip?: (preselectedPandals?: PandalPlace[]) => void;
}

type ZoneKey = 'north' | 'central' | 'south';

// Recommended iconic pandals per zone (Google search / Maps top rated)
const ZONE_RECOMMENDED_PANDALS: Record<ZoneKey, string[]> = {
  north: [
    'Bagbazar Sarbojanin',
    'Kumartuli Park',
    'Tala Prattoy',
    'Hatibagan Sarbojanin',
    'Sovabazar Rajbari'
  ],
  central: [
    'College Square',
    'Santosh Mitra Square (Lebutala)',
    'Mohammad Ali Park',
    'Janbazar Sarbojanin (Dharmatala)'
  ],
  south: [
    'Maddox Square',
    'Ekdalia Evergreen',
    'Suruchi Sangha',
    'Ballygunge Cultural Association',
    'Tridhara Sammilani',
    'Deshapriya Park'
  ]
};

export const KolkataInteractiveMapModal: React.FC<KolkataInteractiveMapModalProps> = ({
  isOpen,
  onClose,
  initialDayId,
  initialZone,
  initialPandalNames,
  initialConfirmed,
  initialTeam,
  onSelectDay,
  onOpenPlanTrip
}) => {
  // Active demo window (null means viewing the map)
  const [activeZoneWindow, setActiveZoneWindow] = useState<ZoneKey | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneKey | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | 'all'>('all');
  
  // Selected pandal checkboxes
  const [checkedPandalNames, setCheckedPandalNames] = useState<Set<string>>(new Set());

  // Confirmed view state (after confirming pandals, show Route + Dining split view)
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [restaurantFilter, setRestaurantFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [priceRangeLimit, setPriceRangeLimit] = useState<number>(2000);
  const [restaurantSort, setRestaurantSort] = useState<'rating' | 'price-asc' | 'price-desc' | 'distance'>('rating');
  const [isPriceSortExpanded, setIsPriceSortExpanded] = useState<boolean>(false);
  const [selectedMenuRestaurant, setSelectedMenuRestaurant] = useState<KolkataRestaurant | null>(null);

  // Planned Team & Custom Invite Link State
  const [currentPlannedTeam, setCurrentPlannedTeam] = useState<PlannedTeam | null>(null);
  const [copiedPlanLink, setCopiedPlanLink] = useState(false);

  const { calculateDistance, coordinates } = useLocation();
  const { user } = useAuth();
  const { updateUserRoute } = useSocial();

  // Sync initial state when opened
  useEffect(() => {
    if (isOpen) {
      if (initialZone) {
        setActiveZoneWindow(initialZone);
      }
      if (initialDayId) {
        setSelectedDayId(initialDayId);
      } else {
        setSelectedDayId('all');
      }
      if (initialPandalNames && initialPandalNames.length > 0) {
        setCheckedPandalNames(new Set(initialPandalNames));
      }
      if (initialConfirmed !== undefined) {
        setIsConfirmed(initialConfirmed);
      } else if (initialPandalNames && initialPandalNames.length > 0) {
        setIsConfirmed(true);
      }
      if (initialTeam) {
        setCurrentPlannedTeam(initialTeam);
      }
    } else {
      setActiveZoneWindow(null);
      setCheckedPandalNames(new Set());
      setIsConfirmed(false);
      setSelectedMenuRestaurant(null);
      setCurrentPlannedTeam(null);
    }
  }, [isOpen, initialZone, initialDayId, initialPandalNames, initialConfirmed, initialTeam]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMenuRestaurant) {
          setSelectedMenuRestaurant(null);
        } else if (isConfirmed) {
          setIsConfirmed(false);
        } else if (activeZoneWindow) {
          setActiveZoneWindow(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeZoneWindow, isConfirmed, selectedMenuRestaurant]);

  // Active Zone metadata
  const currentZoneInfo: KolkataZoneInfo | undefined = useMemo(() => {
    if (!activeZoneWindow) return undefined;
    return KOLKATA_ZONES.find(z => z.id === activeZoneWindow);
  }, [activeZoneWindow]);

  // Comprehensive pandals for this zone from kolkataSectors.ts + festivalConfig
  const allZonePandals = useMemo(() => {
    if (!activeZoneWindow) return [];

    interface EnrichedPandal extends PandalPlace {
      dayName?: string;
      dayBengaliName?: string;
      distanceKm: number | null;
      formattedDistance: string;
      directionsUrl: string;
      isRecommended: boolean;
    }

    const map = new Map<string, EnrichedPandal>();
    const recommendedList = ZONE_RECOMMENDED_PANDALS[activeZoneWindow] || [];

    // Get all pandals from sectors data
    const zoneGroup = KOLKATA_SECTORS_DATA.find(z => z.zoneKey === activeZoneWindow);
    if (zoneGroup) {
      zoneGroup.sectors.forEach(sec => {
        sec.pandals.forEach(p => {
          const dist = calculateDistance(p.lat, p.lng);
          const isRec = recommendedList.some(r => r.toLowerCase() === p.name.toLowerCase());
          map.set(p.name, {
            ...p,
            distanceKm: dist,
            formattedDistance: dist !== null ? `${dist.toFixed(1)} km away` : 'Kolkata',
            directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
            isRecommended: isRec
          });
        });
      });
    }

    // Also enrich with festival day highlights if available
    DURGA_PUJA_2026.days.forEach(d => {
      d.places?.forEach(p => {
        if (map.has(p.name)) {
          const item = map.get(p.name)!;
          item.dayName = d.name;
          item.dayBengaliName = d.bengaliName;
        }
      });
    });

    // Convert map to array and sort: recommended first, then distance
    return Array.from(map.values()).sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });
  }, [activeZoneWindow, calculateDistance]);

  // Filtered by selected day if chosen
  const displayedPandals = useMemo(() => {
    if (selectedDayId === 'all') return allZonePandals;
    const currentDay = DURGA_PUJA_2026.days.find(d => d.id === selectedDayId);
    if (!currentDay) return allZonePandals;
    return allZonePandals.filter(p => 
      !p.dayName || p.dayName.toLowerCase() === currentDay.name.toLowerCase()
    );
  }, [allZonePandals, selectedDayId]);

  // Toggle single pandal checkbox
  const togglePandalCheckbox = useCallback((name: string) => {
    setCheckedPandalNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // 1-Click Select Recommended Options (Automatically checks the best boxes)
  const handleSelectRecommended = useCallback(() => {
    if (!activeZoneWindow) return;
    const recommended = ZONE_RECOMMENDED_PANDALS[activeZoneWindow] || [];
    const newSet = new Set<string>();
    
    allZonePandals.forEach(p => {
      if (recommended.some(r => r.toLowerCase() === p.name.toLowerCase()) || p.isRecommended) {
        newSet.add(p.name);
      }
    });

    setCheckedPandalNames(newSet);
  }, [activeZoneWindow, allZonePandals]);

  // Select all pandals in zone
  const handleSelectAll = useCallback(() => {
    const newSet = new Set<string>();
    displayedPandals.forEach(p => newSet.add(p.name));
    setCheckedPandalNames(newSet);
  }, [displayedPandals]);

  // Clear all
  const handleClearAll = useCallback(() => {
    setCheckedPandalNames(new Set());
  }, []);

  // Confirmed Pandals Array
  const confirmedPandals = useMemo(() => {
    const list = allZonePandals.filter(p => checkedPandalNames.has(p.name));
    if (list.length > 0) return list;
    return displayedPandals.slice(0, 5);
  }, [allZonePandals, checkedPandalNames, displayedPandals]);

  // Optimized Route Calculation for Confirmed Pandals
  const routeData = useMemo(() => {
    if (!isConfirmed || confirmedPandals.length === 0) return null;

    const startLat = coordinates?.latitude;
    const startLng = coordinates?.longitude;

    const order = optimizeRoute(confirmedPandals, startLat, startLng);
    const orderedPandals = order.map(idx => confirmedPandals[idx]);
    const totalDistanceKm = calculateRouteDistance(confirmedPandals, order, startLat, startLng);

    const perPandalVisitMin = 35;
    const totalVisitMin = orderedPandals.length * perPandalVisitMin;
    const pujoTravelMin = Math.round((totalDistanceKm / 6) * 60);
    const totalEtaMinutes = totalVisitMin + pujoTravelMin;

    const transitInfo = new Map<string, NearestStationResult[]>();
    for (const p of orderedPandals) {
      const nearest = findNearestStations(p.lat, p.lng, 2);
      transitInfo.set(p.name, nearest);
    }

    // Google Maps multi-stop URL
    let googleMapsUrl = '';
    if (orderedPandals.length === 1) {
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${orderedPandals[0].lat},${orderedPandals[0].lng}`;
    } else {
      const origin = coordinates
        ? `${coordinates.latitude},${coordinates.longitude}`
        : `${orderedPandals[0].lat},${orderedPandals[0].lng}`;
      const destination = `${orderedPandals[orderedPandals.length - 1].lat},${orderedPandals[orderedPandals.length - 1].lng}`;
      const waypoints = orderedPandals
        .slice(coordinates ? 0 : 1, -1)
        .map(p => `${p.lat},${p.lng}`)
        .join('|');
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
        waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''
      }`;
    }

    const embedOrigin = coordinates
      ? `${coordinates.latitude},${coordinates.longitude}`
      : `${orderedPandals[0].lat},${orderedPandals[0].lng}`;
    const embedMapUrl = `https://maps.google.com/maps?q=${embedOrigin}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return {
      orderedPandals,
      totalDistanceKm,
      totalEtaMinutes,
      transitInfo,
      googleMapsUrl,
      embedMapUrl
    };
  }, [isConfirmed, confirmedPandals, coordinates]);

  // Restaurants for active zone filtered by Veg / Non-Veg, Price Range, and Sorted
  const nearbyRestaurants = useMemo(() => {
    if (!activeZoneWindow) return [];
    let list = getRestaurantsForZone(activeZoneWindow, restaurantFilter);

    // Filter by max price limit
    if (priceRangeLimit < 2000) {
      list = list.filter(r => r.priceForTwo <= priceRangeLimit);
    }

    // Sort based on user selected criteria
    const sorted = [...list].sort((a, b) => {
      if (restaurantSort === 'price-asc') {
        return a.priceForTwo - b.priceForTwo;
      }
      if (restaurantSort === 'price-desc') {
        return b.priceForTwo - a.priceForTwo;
      }
      if (restaurantSort === 'distance') {
        const distA = calculateDistance(a.lat, a.lng) ?? 9999;
        const distB = calculateDistance(b.lat, b.lng) ?? 9999;
        return distA - distB;
      }
      // default: 'rating'
      return b.rating - a.rating;
    });

    return sorted;
  }, [activeZoneWindow, restaurantFilter, priceRangeLimit, restaurantSort, calculateDistance]);

  // Multi-stop Google Maps URL for checked pandals
  const multiStopMapsUrl = useMemo(() => {
    const selected = allZonePandals.filter(p => checkedPandalNames.has(p.name));
    if (selected.length === 0) return '';
    if (selected.length === 1) return selected[0].directionsUrl;

    const origin = coordinates 
      ? `${coordinates.latitude},${coordinates.longitude}`
      : `${selected[0].lat},${selected[0].lng}`;
    const destination = `${selected[selected.length - 1].lat},${selected[selected.length - 1].lng}`;
    const waypoints = selected.slice(coordinates ? 0 : 1, -1).map(p => `${p.lat},${p.lng}`).join('|');
    
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''
    }`;
  }, [allZonePandals, checkedPandalNames, coordinates]);

  // Confirm selection & open Route, Dining & Squad Invite View
  const handleConfirmSelection = () => {
    let selected = confirmedPandals;
    if (checkedPandalNames.size === 0) {
      handleSelectRecommended();
      const rec = ZONE_RECOMMENDED_PANDALS[activeZoneWindow || 'south'] || [];
      selected = allZonePandals.filter(p => rec.some(r => r.toLowerCase() === p.name.toLowerCase()) || p.isRecommended);
      if (selected.length === 0) selected = displayedPandals.slice(0, 5);
    }
    
    const pandalNames = selected.map(p => p.name);
    const code = generateTeamCode(activeZoneWindow || 'KOL');
    const dayObj = selectedDayId !== 'all' ? DURGA_PUJA_2026.days.find(d => d.id === selectedDayId) : undefined;
    
    const team = createOrUpdatePlannedTeam({
      id: `team-${Date.now()}`,
      teamCode: code,
      teamName: `${currentZoneInfo?.name || 'Kolkata'} ${dayObj?.name ? `${dayObj.name} ` : ''}Squad`,
      leaderName: user?.displayName || 'Pujo Devotee',
      leaderAvatar: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'devotee'}`,
      leaderUid: user?.uid || 'anon-devotee',
      zone: activeZoneWindow || 'south',
      dayName: dayObj?.name,
      pandals: pandalNames
    });

    // Broadcast active route
    updateUserRoute(pandalNames, pandalNames[0], activeZoneWindow || 'south');
    setCurrentPlannedTeam(team);
    setIsConfirmed(true);
  };

  // Quick Copy Invite Link
  const handleCopyPlanInviteLink = async () => {
    let team = currentPlannedTeam;
    if (!team) {
      let selected = confirmedPandals;
      if (selected.length === 0) {
        selected = displayedPandals.slice(0, 5);
      }
      const pandalNames = selected.map(p => p.name);
      const code = generateTeamCode(activeZoneWindow || 'KOL');
      const dayObj = selectedDayId !== 'all' ? DURGA_PUJA_2026.days.find(d => d.id === selectedDayId) : undefined;
      team = createOrUpdatePlannedTeam({
        id: `team-${Date.now()}`,
        teamCode: code,
        teamName: `${currentZoneInfo?.name || 'Kolkata'} ${dayObj?.name ? `${dayObj.name} ` : ''}Squad`,
        leaderName: user?.displayName || 'Pujo Devotee',
        leaderAvatar: user?.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
        leaderUid: user?.uid || 'anon-devotee',
        zone: activeZoneWindow || 'south',
        dayName: dayObj?.name,
        pandals: pandalNames
      });
      setCurrentPlannedTeam(team);
    }
    const url = generateTeamInviteUrl(team);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPlanLink(true);
      setTimeout(() => setCopiedPlanLink(false), 2400);
    } catch {
      // Fallback prompt
      prompt('Copy this link to share your exact plan:', url);
    }
  };

  // Launch Trip Planner with selected
  const handlePlanRouteWithSelected = () => {
    let selected = allZonePandals.filter(p => checkedPandalNames.has(p.name));
    if (selected.length === 0) {
      selected = displayedPandals;
    }
    onClose();
    if (onOpenPlanTrip) {
      onOpenPlanTrip(selected);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${
            isConfirmed ? 'max-w-5xl' : 'max-w-3xl'
          } rounded-3xl glass-panel border border-white/20 p-3.5 sm:p-5 shadow-2xl z-10 my-auto overflow-hidden text-left max-h-[92vh] flex flex-col bg-[#0b0d13]/95 transition-all duration-300`}
        >
          {/* Subtle gold highlight line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
          
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW 1: THE INTERACTIVE KOLKATA MAP                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {!activeZoneWindow ? (
            <div className="flex flex-col h-full space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-widest text-[#d4af37] uppercase font-sans">
                      KOLKATA PUJO DIRECTORY
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Pick a Zone on the Map
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Map instructions & hover helper */}
              <div className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-white/70 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#d4af37]" />
                  <span>Tap or click on <strong>North, Central, or South Kolkata</strong> on the map:</span>
                </span>
                {hoveredZone && (
                  <span className="font-semibold text-[#f4e5a9] capitalize animate-pulse">
                    Hovering: {hoveredZone} Kolkata
                  </span>
                )}
              </div>

              {/* The Map SVG Container */}
              <div className="flex-1 flex flex-col items-center justify-center py-2 overflow-hidden min-h-0">
                <div className="relative mx-auto select-none max-h-[58vh] sm:max-h-[62vh] aspect-[682/1024] flex items-center justify-center filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                  
                  {/* Clean Transparent Map Image */}
                  <img
                    src="/kolkata_zones_map.png"
                    alt="Kolkata North, Central, South Zones Map"
                    className="w-full h-full object-contain block select-none pointer-events-none"
                  />

                  {/* SVG Clickable & Visible Boundary Overlay */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-auto"
                  >
                    <defs>
                      <filter id="glow-north" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.8" />
                      </filter>
                      <filter id="glow-central" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.8" />
                      </filter>
                      <filter id="glow-south" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ef4444" floodOpacity="0.8"/>
                      </filter>
                      <filter id="glow-boundary" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ffd700" floodOpacity="0.9" />
                      </filter>
                    </defs>

                    {/* Zone 1: North Kolkata Organic Polygon */}
                    <polygon
                      points="70,2 88,5 91,8 90,12 87,16 85,21 79,25 78,29 76,31 73,35 75.5,38.5 60,38 46.5,38 50,31 48,25 52,21 50,18 55,12 56,8 62,5"
                      onClick={() => setActiveZoneWindow('north')}
                      onMouseEnter={() => setHoveredZone('north')}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer transition-all duration-300"
                      fill={hoveredZone === 'north' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.01)'}
                      stroke="#38bdf8"
                      strokeWidth={hoveredZone === 'north' ? 1.8 : 0.6}
                      strokeDasharray={hoveredZone === 'north' ? 'none' : '2 2'}
                      filter={hoveredZone === 'north' ? 'url(#glow-north)' : 'none'}
                    />

                    {/* Zone 2: Central Kolkata Organic Polygon */}
                    <polygon
                      points="46.5,38 60,38 75.5,38.5 93,42 94,47 97,52 95,56 84,59 80.5,61 62,63 45,59 27,60 20,62 27,58 32,56 41,52 43,45 46.5,41"
                      onClick={() => setActiveZoneWindow('central')}
                      onMouseEnter={() => setHoveredZone('central')}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer transition-all duration-300"
                      fill={hoveredZone === 'central' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.01)'}
                      stroke="#f59e0b"
                      strokeWidth={hoveredZone === 'central' ? 1.8 : 0.6}
                      strokeDasharray={hoveredZone === 'central' ? 'none' : '2 2'}
                      filter={hoveredZone === 'central' ? 'url(#glow-central)' : 'none'}
                    />

                    {/* Zone 3: South Kolkata Organic Polygon */}
                    <polygon
                      points="20,62 27,60 45,59 62,63 80.5,61 82,68 82,72 79,74 73,76 78,80 80,84 80,88 81,93 82,96 80,98 75,98 64,94 58,90 15,86 12,80 4,76 3,74 10,70 16,65"
                      onClick={() => setActiveZoneWindow('south')}
                      onMouseEnter={() => setHoveredZone('south')}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer transition-all duration-300"
                      fill={hoveredZone === 'south' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.01)'}
                      stroke="#ef4444"
                      strokeWidth={hoveredZone === 'south' ? 1.8 : 0.6}
                      strokeDasharray={hoveredZone === 'south' ? 'none' : '2 2'}
                      filter={hoveredZone === 'south' ? 'url(#glow-south)' : 'none'}
                    />

                    {/* Visible Boundary Divider 1: North & Central */}
                    <path
                      d="M 46.5 38 C 55 37.5, 65 38.5, 75.5 38.5"
                      fill="none"
                      stroke="#ffd700"
                      strokeWidth="1.6"
                      strokeDasharray="3 2"
                      className="pointer-events-none"
                      filter="url(#glow-boundary)"
                    />

                    {/* Visible Boundary Divider 2: Central & South */}
                    <path
                      d="M 20 62 C 32 59, 48 59, 62 63 C 71 64.5, 77 62.5, 80.5 61"
                      fill="none"
                      stroke="#ffd700"
                      strokeWidth="1.6"
                      strokeDasharray="3 2"
                      className="pointer-events-none"
                      filter="url(#glow-boundary)"
                    />
                  </svg>
                </div>
              </div>

              {/* Bottom Direct Selection Buttons */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-white/50">Or choose directly:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveZoneWindow('north')}
                    onMouseEnter={() => setHoveredZone('north')}
                    onMouseLeave={() => setHoveredZone(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>North Kolkata</span>
                  </button>

                  <button
                    onClick={() => setActiveZoneWindow('central')}
                    onMouseEnter={() => setHoveredZone('central')}
                    onMouseLeave={() => setHoveredZone(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Central Kolkata</span>
                  </button>

                  <button
                    onClick={() => setActiveZoneWindow('south')}
                    onMouseEnter={() => setHoveredZone('south')}
                    onMouseLeave={() => setHoveredZone(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>South Kolkata</span>
                  </button>
                </div>
              </div>

            </div>
          /* ═══════════════════════════════════════════════════════════ */
          /* VIEW 2: ZONE PANDAL SELECTION WITH CHECKBOXES & CONFIRM BTN */
          /* ═══════════════════════════════════════════════════════════ */
          ) : !isConfirmed ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 min-h-0 h-full space-y-3"
            >
              {/* Window Header with Back to Map button */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <button
                  onClick={() => setActiveZoneWindow(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Kolkata Map</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentZoneInfo?.accentBg} ${currentZoneInfo?.borderColor} ${currentZoneInfo?.textColor}`}>
                    {currentZoneInfo?.name} • {currentZoneInfo?.bengaliName}
                  </span>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Zone Tagline */}
              <div className={`p-3 rounded-2xl border ${currentZoneInfo?.accentBg} ${currentZoneInfo?.borderColor} shrink-0`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles size={14} className={currentZoneInfo?.textColor} />
                  <h3 className={`text-sm sm:text-base font-bold ${currentZoneInfo?.textColor}`}>
                    {currentZoneInfo?.name} Pandal Trail
                  </h3>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {currentZoneInfo?.tagline}
                </p>
              </div>

              {/* Action Toolbar: Recommended Options Button + Selection Counters */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-between flex-wrap gap-2.5 shrink-0">
                {/* 1-Tap Auto-Check Recommended Button */}
                <button
                  onClick={handleSelectRecommended}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca65] to-[#d4af37] hover:scale-102 text-black text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-200"
                  title="Automatically check all Google-ranked iconic pandals in this zone"
                >
                  <Star size={14} fill="black" />
                  <span>Select Recommended Options</span>
                  <CheckSquare size={14} />
                </button>

                {/* Selection Count & Select All / Clear */}
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-bold text-[#f4e5a9] bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                    {displayedPandals.filter(p => checkedPandalNames.has(p.name)).length} of {displayedPandals.length} selected
                  </span>
                  
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-white/50 hover:text-white cursor-pointer font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
                  <Calendar size={13} className="text-[#d4af37]" />
                  <span>Filter by festival day:</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setSelectedDayId('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedDayId === 'all'
                        ? 'bg-white/20 text-white border border-white/30 font-semibold'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    All Days
                  </button>

                  {DURGA_PUJA_2026.days.map(day => {
                    const isSelected = selectedDayId === day.id;
                    return (
                      <button
                        key={day.id}
                        onClick={() => {
                          setSelectedDayId(day.id);
                          if (onSelectDay) onSelectDay(day);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37] text-black font-semibold shadow-md'
                            : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pandals List with Checkboxes */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 max-h-[48vh] sm:max-h-[52vh]">
                {displayedPandals.map((place, idx) => {
                  const isChecked = checkedPandalNames.has(place.name);

                  return (
                    <motion.div
                      key={`${place.name}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => togglePandalCheckbox(place.name)}
                      className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked
                          ? 'bg-[#d4af37]/15 border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 mt-0.5 ${
                          isChecked
                            ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-md'
                            : 'bg-black/40 border-white/30 group-hover:border-white/60'
                        }`}>
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-sm sm:text-base font-bold transition-colors ${
                              isChecked ? 'text-[#f4e5a9]' : 'text-white group-hover:text-white'
                            }`}>
                              {place.name}
                            </h4>
                            
                            {place.isRecommended && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Star size={9} fill="currentColor" />
                                Top Recommended
                              </span>
                            )}

                            {place.dayBengaliName && (
                              <span className="text-[10px] font-serif text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-md border border-[#d4af37]/20">
                                {place.dayBengaliName}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-white/70 italic flex items-center gap-1.5">
                            <Sparkles size={11} className={currentZoneInfo?.textColor} />
                            <span>{place.vibe}</span>
                          </p>

                          <p className="text-[11px] text-white/40 flex items-center gap-1">
                            <MapPin size={10} className="shrink-0" />
                            <span className="truncate max-w-[240px] sm:max-w-[360px]">{place.address}</span>
                          </p>
                        </div>
                      </div>

                      {/* Distance & Action */}
                      <div className="flex flex-col items-end shrink-0 space-y-2">
                        <span className="text-xs font-semibold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-lg border border-[#d4af37]/20 whitespace-nowrap">
                          {place.formattedDistance}
                        </span>

                        <a
                          href={place.directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#d4af37] text-white hover:text-black text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                          title="Open Single Pandal in Google Maps"
                        >
                          <Navigation size={11} />
                          <span>Map</span>
                          <ExternalLink size={9} className="opacity-70" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* BOTTOM BAR: PROMINENT DONE & ACTION BUTTONS                 */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="sticky bottom-0 bg-[#0c0e15]/95 backdrop-blur-md pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-30">
                <button
                  onClick={() => setActiveZoneWindow(null)}
                  className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-center"
                >
                  <ArrowLeft size={12} />
                  <span>Back to Kolkata map</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {checkedPandalNames.size > 0 && (
                    <a
                      href={multiStopMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-white/15"
                      title="Open multi-stop Google Maps directly"
                    >
                      <Navigation size={13} />
                      <span>Direct Maps Route ({checkedPandalNames.size})</span>
                      <ExternalLink size={11} />
                    </a>
                  )}

                  {/* Primary Done Option Button */}
                  <button
                    onClick={handleConfirmSelection}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca65] to-[#d4af37] hover:scale-102 text-black text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg border border-amber-200"
                  >
                    <CheckCircle2 size={16} />
                    <span>Done ({displayedPandals.filter(p => checkedPandalNames.has(p.name)).length || 'All'} Selected) →</span>
                  </button>
                </div>
              </div>

            </motion.div>

          /* ═══════════════════════════════════════════════════════════ */
          /* VIEW 3: CONFIRMED ROUTE MAP & BESIDE RESTAURANTS FINDER     */
          /* ═══════════════════════════════════════════════════════════ */
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 min-h-0 h-full space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                  <button
                    onClick={() => setIsConfirmed(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 shrink-0"
                    title="Edit pandals selection"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Modify Pandals</span>
                  </button>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{currentZoneInfo?.name} Route & Dining Plan</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {confirmedPandals.length} Pandals Selected
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Copy Link button */}
                  <button
                    onClick={handleCopyPlanInviteLink}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                      copiedPlanLink
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-[#d4af37] hover:bg-[#e6ca65] text-black border-[#d4af37]/60'
                    }`}
                    title="Copy shareable link for this exact route"
                  >
                    {copiedPlanLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedPlanLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Split Grid: Left = Map & Route, Right = Nearby Restaurants */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
                
                {/* ────────────────────────────────────────────────────────── */}
                {/* LEFT COLUMN: ROUTE BREAKDOWN & MAP (lg:col-span-7)          */}
                {/* ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-7 space-y-3.5 flex flex-col">
                  
                  {/* Route Quick Stats Card */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-[#d4af37]/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] flex items-center justify-center">
                        <Route size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <span className="font-semibold text-white">~{routeData?.totalDistanceKm} km total</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#f4e5a9]">
                            <Clock size={11} />
                            <span>~{Math.round((routeData?.totalEtaMinutes || 0) / 60)}h {(routeData?.totalEtaMinutes || 0) % 60}m Hopping ETA</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50">
                          Optimized sequential path through selected {currentZoneInfo?.name} pandals
                        </p>
                      </div>
                    </div>

                    <a
                      href={routeData?.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:scale-102 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                    >
                      <Navigation size={13} />
                      <span>Start GPS Route</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Google Map Route Preview Embed */}
                  <div className="rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-[#0a0d14] relative h-48 sm:h-56 shrink-0">
                    <iframe
                      src={routeData?.embedMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Route Preview Map"
                      className="opacity-85 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white flex items-center gap-1.5 pointer-events-none">
                      <MapPin size={10} className="text-[#d4af37]" />
                      <span>Map Preview ({confirmedPandals.length} stops)</span>
                    </div>
                  </div>

                  {/* Sequential Hop List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold tracking-wider text-white/60 uppercase">
                      Optimal Visiting Sequence ({confirmedPandals.length} Pandals)
                    </h4>

                    <div className="space-y-2">
                      {routeData?.orderedPandals.map((pandal, idx) => {
                        const transit = routeData.transitInfo.get(pandal.name) || [];

                        return (
                          <div
                            key={pandal.name}
                            className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all flex items-start justify-between gap-2.5"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-[#d4af37] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                {idx + 1}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                                  {pandal.name}
                                </h5>
                                <p className="text-[11px] text-white/60 italic truncate">
                                  {pandal.vibe}
                                </p>
                                
                                {transit.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-sky-300 pt-0.5">
                                    <Train size={10} className="shrink-0" />
                                    <span className="truncate">
                                      Near {transit[0].station.name} ({transit[0].distanceKm.toFixed(1)} km)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <a
                              href={pandal.directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white/10 hover:bg-[#d4af37] text-white hover:text-black transition-colors shrink-0"
                              title="Direct Navigation"
                            >
                              <Navigation size={12} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ────────────────────────────────────────────────────────── */}
                {/* RIGHT COLUMN: NEARBY RESTAURANTS & PUJO DINING (lg:col-span-5) */}
                {/* ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-3 flex flex-col">
                  
                  {/* Dining Header & Filter */}
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center border border-orange-500/30">
                          <Utensils size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>Pujo Dining & Snacks</span>
                            <span className="text-[10px] font-normal text-white/50">({nearbyRestaurants.length})</span>
                          </h4>
                          <p className="text-[10px] text-white/50">
                            Iconic eateries right beside this route
                          </p>
                        </div>
                      </div>

                      {/* Veg / Non-Veg Toggle Filter */}
                      <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10 text-[11px]">
                        <button
                          onClick={() => setRestaurantFilter('all')}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            restaurantFilter === 'all'
                              ? 'bg-white/20 text-white font-bold'
                              : 'text-white/50 hover:text-white'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setRestaurantFilter('veg')}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            restaurantFilter === 'veg'
                              ? 'bg-emerald-500 text-black font-bold'
                              : 'text-emerald-400/70 hover:text-emerald-300'
                          }`}
                        >
                          Veg
                        </button>
                        <button
                          onClick={() => setRestaurantFilter('non-veg')}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            restaurantFilter === 'non-veg'
                              ? 'bg-rose-500 text-white font-bold'
                              : 'text-rose-400/70 hover:text-rose-300'
                          }`}
                        >
                          Non-Veg
                        </button>
                      </div>
                    </div>

                    {/* Expandable Price Range & Sorting Controls Bar */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setIsPriceSortExpanded(!isPriceSortExpanded)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#f4e5a9] flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <SlidersHorizontal size={11} className="text-[#d4af37]" />
                          <span>Filter Price & Sort</span>
                          {isPriceSortExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                          <span>Max:</span>
                          <span className="font-bold text-[#d4af37] bg-black/40 px-2 py-0.5 rounded-md border border-[#d4af37]/30">
                            {priceRangeLimit >= 2000 ? 'Any Price' : `₹${priceRangeLimit} for 2`}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Slider & Sorter Drawer */}
                      {isPriceSortExpanded && (
                        <div className="p-2.5 rounded-xl bg-black/60 border border-[#d4af37]/30 space-y-2.5 animate-fadeIn">
                          {/* Price Range Moving Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-white/70 flex items-center gap-1">
                                <IndianRupee size={10} className="text-[#d4af37]" />
                                <span>Max Price For Two:</span>
                              </span>
                              <span className="font-extrabold text-[#d4af37]">
                                {priceRangeLimit >= 2000 ? 'No limit (₹2000+)' : `Up to ₹${priceRangeLimit}`}
                              </span>
                            </div>
                            
                            <input
                              type="range"
                              min="150"
                              max="2000"
                              step="50"
                              value={priceRangeLimit}
                              onChange={(e) => setPriceRangeLimit(Number(e.target.value))}
                              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                            />
                            
                            <div className="flex items-center justify-between text-[9px] text-white/40">
                              <span>₹150 (Street Food)</span>
                              <span>₹750 (Casual Dine)</span>
                              <span>₹2000+ (Fine Dine)</span>
                            </div>
                          </div>

                          {/* Quick Budget Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/10">
                            <span className="text-[10px] text-white/50">Quick tiers:</span>
                            <button
                              onClick={() => setPriceRangeLimit(350)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                                priceRangeLimit === 350
                                  ? 'bg-[#d4af37] text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                              }`}
                            >
                              Under ₹350
                            </button>
                            <button
                              onClick={() => setPriceRangeLimit(750)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                                priceRangeLimit === 750
                                  ? 'bg-[#d4af37] text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                              }`}
                            >
                              Under ₹750
                            </button>
                            <button
                              onClick={() => setPriceRangeLimit(1200)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                                priceRangeLimit === 1200
                                  ? 'bg-[#d4af37] text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                              }`}
                            >
                              Under ₹1200
                            </button>
                            <button
                              onClick={() => setPriceRangeLimit(2000)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                                priceRangeLimit >= 2000
                                  ? 'bg-sky-500 text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                              }`}
                            >
                              All Prices
                            </button>
                          </div>

                          {/* Sort Options */}
                          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between flex-wrap gap-1.5">
                            <span className="text-[10px] text-white/50 flex items-center gap-1">
                              <ArrowUpDown size={10} className="text-[#d4af37]" />
                              <span>Sort by:</span>
                            </span>

                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => setRestaurantSort('price-asc')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                  restaurantSort === 'price-asc'
                                    ? 'bg-[#d4af37] text-black font-bold'
                                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                                }`}
                              >
                                Price: Low to High
                              </button>
                              <button
                                onClick={() => setRestaurantSort('price-desc')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                  restaurantSort === 'price-desc'
                                    ? 'bg-[#d4af37] text-black font-bold'
                                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                                }`}
                              >
                                Price: High to Low
                              </button>
                              <button
                                onClick={() => setRestaurantSort('rating')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                  restaurantSort === 'rating'
                                    ? 'bg-[#d4af37] text-black font-bold'
                                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                                }`}
                              >
                                Top Rated
                              </button>
                              <button
                                onClick={() => setRestaurantSort('distance')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                  restaurantSort === 'distance'
                                    ? 'bg-[#d4af37] text-black font-bold'
                                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                                }`}
                              >
                                Nearest First
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Restaurants List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[48vh] sm:max-h-[55vh] pr-1">
                    {nearbyRestaurants.map((restaurant) => {
                      const dist = calculateDistance(restaurant.lat, restaurant.lng);

                      return (
                        <div
                          key={restaurant.id}
                          className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#f4e5a9] transition-colors">
                                  {restaurant.name}
                                </h5>
                                {restaurant.isPureVeg && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Pure Veg
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/50 truncate">
                                {restaurant.cuisine} • {restaurant.area}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0">
                              <Star size={10} fill="currentColor" />
                              <span>{restaurant.rating}</span>
                            </div>
                          </div>

                          {/* Must Try Dish Highlight */}
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ChefHat size={12} className="text-[#d4af37] shrink-0" />
                              <span className="text-white/80 truncate">
                                Must Try: <strong className="text-white">{restaurant.mustTryDish}</strong>
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#d4af37] shrink-0">
                              {restaurant.mustTryPrice}
                            </span>
                          </div>

                          {/* Distance & Actions */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="flex items-center gap-2 text-[11px] text-white/50">
                              <span>~{restaurant.priceForTwoStr} for 2</span>
                              {dist !== null && (
                                <>
                                  <span>•</span>
                                  <span className="text-white/70">{dist.toFixed(1)} km away</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                                <button
                                  onClick={() => setSelectedMenuRestaurant(restaurant)}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all cursor-pointer"
                                >
                                  Menu ({restaurant.menuItems.length})
                                </button>
                              )}

                              <a
                                href={restaurant.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer border border-[#d4af37]/40"
                              >
                                <Navigation size={10} />
                                <span>Directions</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {nearbyRestaurants.length === 0 && (
                      <div className="p-6 text-center text-xs text-white/50 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2">
                        <p>No restaurants found matching this filter in this zone.</p>
                        <button
                          onClick={() => {
                            setRestaurantFilter('all');
                            setPriceRangeLimit(2000);
                          }}
                          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                <button
                  onClick={() => setIsConfirmed(false)}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1 cursor-pointer self-start sm:self-center"
                >
                  <ArrowLeft size={12} />
                  <span>Back to pandals selection</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handlePlanRouteWithSelected}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/15"
                  >
                    Open in Full Trip Planner
                  </button>

                  <a
                    href={routeData?.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-amber-200"
                  >
                    <Navigation size={13} />
                    <span>Launch Google Maps ({confirmedPandals.length} Pandals)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* MENU POPUP MODAL (IF USER CLICKS 'MENU' ON ANY RESTAURANT) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {selectedMenuRestaurant && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl bg-[#12151f] border border-[#d4af37]/40 p-4 sm:p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col text-left"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedMenuRestaurant.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Menu
                      </span>
                    </h4>
                    <p className="text-xs text-white/50">{selectedMenuRestaurant.cuisine} • {selectedMenuRestaurant.area}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMenuRestaurant(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Menu items list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedMenuRestaurant.menuItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <h6 className="text-xs font-bold text-white truncate">{item.name}</h6>
                        </div>
                        {item.category && (
                          <span className="text-[10px] text-white/40">{item.category}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#d4af37] shrink-0">{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between shrink-0">
                  <span className="text-xs text-white/50">Approx ~{selectedMenuRestaurant.priceForTwoStr} for two</span>
                  <a
                    href={selectedMenuRestaurant.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] text-black text-xs font-bold hover:bg-[#e6ca65] transition-colors flex items-center gap-1"
                  >
                    <Navigation size={11} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </motion.div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
