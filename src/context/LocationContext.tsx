import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DURGA_PUJA_2026, type PandalPlace } from '../config/festivalConfig';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable' | 'requesting';

export interface PandalDistanceInfo extends PandalPlace {
  dayName: string;
  dayBengaliName?: string;
  distanceKm: number | null;
  formattedDistance: string;
  directionsUrl: string;
}

// 14 Definitive Kolkata Landmark Presets with accurate GPS coordinates
export const KOLKATA_LANDMARK_PRESETS = [
  { name: 'Ballygunge / Gariahat', lat: 22.5280, lng: 88.3650, zone: 'south' as const },
  { name: 'Kalighat / Bhowanipore', lat: 22.5210, lng: 88.3450, zone: 'south' as const },
  { name: 'Alipore / New Alipore', lat: 22.5180, lng: 88.3300, zone: 'south' as const },
  { name: 'Behala / Taratala', lat: 22.4980, lng: 88.3150, zone: 'south' as const },
  { name: 'Shyambazar / Hatibagan', lat: 22.5998, lng: 88.3735, zone: 'north' as const },
  { name: 'Bagbazar / Kumartuli', lat: 22.6025, lng: 88.3660, zone: 'north' as const },
  { name: 'College Square / Bowbazar', lat: 22.5740, lng: 88.3630, zone: 'central' as const },
  { name: 'Mohammad Ali Park / MG Rd', lat: 22.5820, lng: 88.3610, zone: 'central' as const },
  { name: 'Salt Lake (FD / BJ Block)', lat: 22.5880, lng: 88.4120, zone: 'north' as const },
  { name: 'Sector V / New Town', lat: 22.5730, lng: 88.4330, zone: 'north' as const },
  { name: 'Dum Dum / Sreebhumi', lat: 22.6020, lng: 88.3980, zone: 'north' as const },
  { name: 'Howrah / Station', lat: 22.5850, lng: 88.3430, zone: 'central' as const },
  { name: 'Jadavpur / Garia', lat: 22.4980, lng: 88.3710, zone: 'south' as const },
  { name: 'Kasba / Ruby / EM Bypass', lat: 22.5150, lng: 88.3920, zone: 'south' as const }
];

export function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
 * Instant, 100% deterministic Kolkata neighborhood resolver
 */
export function resolveKolkataNeighborhood(lat: number, lng: number): { name: string; zone: 'north' | 'central' | 'south'; distKm: number } {
  let closest = KOLKATA_LANDMARK_PRESETS[0];
  let minDist = Infinity;
  for (const l of KOLKATA_LANDMARK_PRESETS) {
    const d = getHaversineDistanceKm(lat, lng, l.lat, l.lng);
    if (d < minDist) {
      minDist = d;
      closest = l;
    }
  }
  return { name: closest.name, zone: closest.zone, distKm: Math.round(minDist * 10) / 10 };
}

interface LocationContextType {
  coordinates: UserCoordinates | null;
  permissionState: LocationPermissionState;
  errorMessage: string | null;
  locality: string | null;
  isKolkataRegion: boolean;
  isManualLocation: boolean;
  requestLocation: () => void;
  refreshLocation: () => void;
  setManualLocation: (name: string, lat: number, lng: number) => void;
  calculateDistance: (lat: number, lng: number) => number | null;
  nearestPandals: PandalDistanceInfo[];
  closestPandal: PandalDistanceInfo | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_COORDS = 'pujo_user_gps_coords';
const STORAGE_LOCALITY = 'pujo_user_locality';
const STORAGE_IS_MANUAL = 'pujo_user_is_manual';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try restoring cached verified location on startup for immediate AI grounding
  const initialCoords = useMemo<UserCoordinates | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COORDS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const initialLocality = useMemo<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_LOCALITY);
    } catch {
      return null;
    }
  }, []);

  const initialIsManual = useMemo<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_IS_MANUAL) === 'true';
    } catch {
      return false;
    }
  }, []);

  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(initialCoords);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>(initialCoords ? 'granted' : 'requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locality, setLocality] = useState<string | null>(initialLocality);
  const [isManualLocation, setIsManualLocation] = useState<boolean>(initialIsManual);
  const watchIdRef = useRef<number | null>(null);

  // Determine locality with instant neighborhood resolution + background reverse geocoding
  const determineLocality = useCallback(async (lat: number, lng: number) => {
    const inKolkata = lat >= 22.2 && lat <= 22.9 && lng >= 88.0 && lng <= 88.7;
    
    // 1. Instant mathematical neighborhood match (< 1ms)
    const matched = resolveKolkataNeighborhood(lat, lng);
    const resolvedName = inKolkata 
      ? (matched.distKm <= 3.5 ? matched.name : `${matched.name} vicinity, Kolkata`)
      : `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;

    setLocality(resolvedName);
    try {
      localStorage.setItem(STORAGE_LOCALITY, resolvedName);
    } catch { /* ignore */ }

    // 2. Try background reverse geocoding if network permits
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const neighborhood = address.suburb || address.neighbourhood || address.residential || address.city_district;
        const city = address.city || address.town || address.state_district || 'Kolkata';
        
        if (neighborhood && inKolkata) {
          const fineGrained = `${neighborhood}, ${city}`;
          setLocality(fineGrained);
          localStorage.setItem(STORAGE_LOCALITY, fineGrained);
        }
      }
    } catch {
      // Fallback already assigned
    }
  }, []);

  // Request high-precision location with automatic multi-stage fallback
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unavailable');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setPermissionState('requesting');
    setErrorMessage(null);

    const onPosSuccess = (position: GeolocationPosition) => {
      const coords: UserCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setCoordinates(coords);
      setPermissionState('granted');
      setIsManualLocation(false);
      setErrorMessage(null);

      try {
        localStorage.setItem(STORAGE_COORDS, JSON.stringify(coords));
        localStorage.setItem(STORAGE_IS_MANUAL, 'false');
      } catch { /* ignore */ }

      determineLocality(coords.latitude, coords.longitude);
    };

    // Stage 1: High Accuracy (GPS hardware, 6s timeout)
    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          setErrorMessage('Location permission was denied. Please allow location in your browser settings.');
          return;
        }

        // Stage 2: Fallback to standard WiFi/IP accuracy (8s timeout)
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err2) => {
            console.warn('Geolocation fallback response:', err2.message);
            if (err2.code === err2.PERMISSION_DENIED) {
              setPermissionState('denied');
              setErrorMessage('Location permission was denied.');
            } else {
              setPermissionState('prompt');
              setErrorMessage('Location request timed out. You can pick your Kolkata neighborhood directly.');
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
    );

    // Continuous watchPosition to refine coordinates when moving
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isManualLocation) {
            setCoordinates({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 20000 }
      );
    } catch { /* ignore */ }
  }, [determineLocality, isManualLocation]);

  // Set Manual Location Preset (e.g. from chatbot location picker or preset pills)
  const setManualLocation = useCallback((name: string, lat: number, lng: number) => {
    const coords: UserCoordinates = { latitude: lat, longitude: lng, accuracy: 5 };
    setCoordinates(coords);
    setLocality(name);
    setPermissionState('granted');
    setIsManualLocation(true);
    setErrorMessage(null);

    try {
      localStorage.setItem(STORAGE_COORDS, JSON.stringify(coords));
      localStorage.setItem(STORAGE_LOCALITY, name);
      localStorage.setItem(STORAGE_IS_MANUAL, 'true');
    } catch { /* ignore */ }
  }, []);

  const refreshLocation = useCallback(() => {
    setIsManualLocation(false);
    requestLocation();
  }, [requestLocation]);

  // Trigger initial request on mount if not already cached
  useEffect(() => {
    if (!coordinates) {
      requestLocation();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Is user near Kolkata?
  const isKolkataRegion = useMemo(() => {
    if (!coordinates) return false;
    const { latitude, longitude } = coordinates;
    return latitude >= 22.2 && latitude <= 22.9 && longitude >= 88.0 && longitude <= 88.7;
  }, [coordinates]);

  // Calculate distance helper
  const calculateDistance = useCallback((lat: number, lng: number): number | null => {
    if (!coordinates) return null;
    return getHaversineDistanceKm(coordinates.latitude, coordinates.longitude, lat, lng);
  }, [coordinates]);

  // Nearest pandals list with distances
  const nearestPandals: PandalDistanceInfo[] = useMemo(() => {
    const list: PandalDistanceInfo[] = [];
    DURGA_PUJA_2026.days.forEach(day => {
      day.places?.forEach(place => {
        const dist = coordinates ? getHaversineDistanceKm(coordinates.latitude, coordinates.longitude, place.lat, place.lng) : null;
        const formattedDistance = dist !== null ? (dist < 1 ? `${Math.round(dist * 1000)} m away` : `${dist} km away`) : 'Distance unavailable';
        const directionsUrl = coordinates 
          ? `https://www.google.com/maps/dir/?api=1&origin=${coordinates.latitude},${coordinates.longitude}&destination=${place.lat},${place.lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

        list.push({
          ...place,
          dayName: day.name,
          dayBengaliName: day.bengaliName,
          distanceKm: dist,
          formattedDistance,
          directionsUrl
        });
      });
    });

    return list.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [coordinates]);

  const closestPandal = nearestPandals.length > 0 && nearestPandals[0].distanceKm !== null ? nearestPandals[0] : null;

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        permissionState,
        errorMessage,
        locality,
        isKolkataRegion,
        isManualLocation,
        requestLocation,
        refreshLocation,
        setManualLocation,
        calculateDistance,
        nearestPandals,
        closestPandal,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
