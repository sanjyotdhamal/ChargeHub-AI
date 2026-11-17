"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Navigation,
  X,
  AlertCircle,
  RefreshCw,
  BatteryWarning,
  BatteryCharging,
  ChevronRight,
  ChevronDown,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useStations } from "@/context/StationsContext";
import { scoreAllStations, scoreStation, ScoredStation } from "@/lib/scoring";
import { useApp } from "@/context/AppContext";
import { useVehicles } from "@/context/VehicleContext";
import { useAuth } from "@/context/AuthContext";
import StationMap, { getCanonicalBrand, getBrandColor } from "@/components/StationMap";
import { StationMapSkeleton } from "@/components/StationSkeleton";
import BatterySlider from "@/components/BatterySlider";
import FilterChips, { FilterOption } from "@/components/FilterChips";
import BottomSheet from "@/components/BottomSheet";
import RangeSetupCard from "@/components/RangeSetupCard";

// Haversine formula to calculate distance between two GPS coordinates in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Default fallback location when GPS has not been used or after Reset
const DEFAULT_PUNE_COORDS = { lat: 18.5204, lng: 73.8567 };
const DEFAULT_LOCATION_LABEL = "Pune Central";

export const POPULAR_LOCATIONS = [
  { name: "Pune Central", label: "Pune Central, Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Loni Kalbhor", label: "Loni Kalbhor, Pune", lat: 18.4912, lng: 74.0280 },
  { name: "Kothrud", label: "Kothrud, Pune", lat: 18.5074, lng: 73.8077 },
  { name: "Viman Nagar", label: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143 },
  { name: "Hadapsar / Magarpatta", label: "Hadapsar, Pune", lat: 18.5089, lng: 73.9260 },
  { name: "Hinjewadi IT Park", label: "Hinjewadi, Pune", lat: 18.5913, lng: 73.7389 },
  { name: "Baner / Balewadi", label: "Baner, Pune", lat: 18.5590, lng: 73.7868 },
  { name: "Wakad", label: "Wakad, Pune", lat: 18.5987, lng: 73.7660 },
  { name: "Aundh", label: "Aundh, Pune", lat: 18.5602, lng: 73.8077 },
  { name: "Kalyani Nagar", label: "Kalyani Nagar, Pune", lat: 18.5463, lng: 73.9034 },
  { name: "Pimpri-Chinchwad", label: "Pimpri-Chinchwad, Pune", lat: 18.6298, lng: 73.7997 },
  { name: "Mumbai (BKC / Bandra)", label: "Bandra, Mumbai", lat: 19.0600, lng: 72.8600 },
  { name: "Thane", label: "Thane, Maharashtra", lat: 19.2183, lng: 72.9781 },
  { name: "Navi Mumbai", label: "Navi Mumbai, Maharashtra", lat: 19.0771, lng: 72.9986 },
  { name: "Nashik", label: "Nashik, Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Nagpur", label: "Nagpur, Maharashtra", lat: 21.1458, lng: 79.0882 },
];

export type LocationState =
  | { status: "default"; lat: number; lng: number; label: string }
  | { status: "requesting"; message: string }
  | {
      status: "granted";
      lat: number;
      lng: number;
      label: string;
      accuracyMeters?: number;
    }
  | { status: "denied"; reason: string };

/**
 * Reverse geocodes coordinates to a friendly place name using free client API (no Google Billing required).
 * Prioritizes rich OpenStreetMap Nominatim data (neighborhood + city) with intelligent BigDataCloud fallback.
 */
async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. Try OpenStreetMap Nominatim with full address details
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Extract specific local neighborhood / suburb / locality
      const neighborhood =
        addr.neighbourhood ||
        addr.suburb ||
        addr.residential ||
        addr.subdistrict ||
        addr.quarter ||
        addr.road;

      // Extract primary city or town
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.city_district ||
        addr.county;

      const state = addr.state || "Maharashtra";

      if (neighborhood && city && neighborhood.toLowerCase() !== city.toLowerCase()) {
        return `${neighborhood}, ${city}`;
      }
      if (city) {
        return `${city}, ${state}`;
      }
      if (data.display_name) {
        const parts = data.display_name.split(",").map((s: string) => s.trim());
        return parts.slice(0, 2).join(", ");
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err);
  }

  // 2. Fallback: BigDataCloud with intelligent filtering (ignoring generic tehsils like "Haveli")
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || "";
      let localArea = "";

      // In BigDataCloud, administrative items often contain the real neighborhood / ward
      if (Array.isArray(data.localityInfo?.administrative)) {
        const candidates = data.localityInfo.administrative
          .map((item: any) => item.name)
          .filter(
            (name: string) =>
              name &&
              name !== "India" &&
              name !== "Maharashtra" &&
              name.toLowerCase() !== "haveli" &&
              name.toLowerCase() !== city.toLowerCase()
          );
        if (candidates.length > 0) {
          localArea = candidates[candidates.length - 1];
        }
      }

      if (!localArea && data.locality && data.locality.toLowerCase() !== "haveli" && data.locality !== city) {
        localArea = data.locality;
      }

      if (localArea && city) {
        return `${localArea}, ${city}`;
      }
      if (city) {
        return `${city}, ${data.principalSubdivision || "Maharashtra"}`;
      }
      if (data.locality && data.locality.toLowerCase() !== "haveli") {
        return `${data.locality}, ${data.principalSubdivision || "Maharashtra"}`;
      }
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode error:", err);
  }

  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Geocodes an address or village/city name to coordinates using free Nominatim (no Google Billing required)
 */
async function geocodePlace(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + ", Maharashtra, India"
      )}&format=json&limit=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name.split(",").slice(0, 2).join(",").trim(),
        };
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}

export default function DiscoverPage() {
  const { batteryPercent, setBatteryPercent, userProfile, manualRangeKm } = useApp();
  const { activeVehicle, hasVehicle } = useVehicles();
  const { user } = useAuth();
  const {
    stations,
    nearestStations,
    loading: stationsLoading,
    error: stationsError,
    refresh: refreshStations,
    fetchViewportStations,
    loadNearestForLocation,
    showDemo,
    setShowDemo,
  } = useStations();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [selectedStation, setSelectedStation] = useState<ScoredStation | null>(null);
  const [showRangeSetup, setShowRangeSetup] = useState(false);
  const [rangeBannerDismissed, setRangeBannerDismissed] = useState(false);
  // Battery popup — only show once per session (cleared on refresh / logout)
  const [showBatteryPopup, setShowBatteryPopup] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("chargehub:batteryPopupDismissed") !== "true";
  });
  const [batteryInput, setBatteryInput] = useState<string>(String(batteryPercent));

  // Location State
  const [locationState, setLocationState] = useState<LocationState>({
    status: "default",
    lat: DEFAULT_PUNE_COORDS.lat,
    lng: DEFAULT_PUNE_COORDS.lng,
    label: DEFAULT_LOCATION_LABEL,
  });

  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Load saved location on mount if previously chosen by user
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chargehub:user_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number" && parsed.label) {
          setLocationState(parsed);
          setShowLocationBanner(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save location to localStorage whenever granted
  useEffect(() => {
    if (locationState.status === "granted") {
      try {
        localStorage.setItem("chargehub:user_location", JSON.stringify(locationState));
      } catch {
        // ignore
      }
    }
  }, [locationState]);

  // Default filter to active vehicle connector if available
  useEffect(() => {
    if (activeVehicle?.connectorType) {
      if (activeVehicle.connectorType === "CCS2") setActiveFilter("CCS2");
      else if (activeVehicle.connectorType === "Type 2") setActiveFilter("Type 2");
      else if (activeVehicle.connectorType === "CHAdeMO") setActiveFilter("CHAdeMO");
    }
  }, [activeVehicle?.connectorType]);

  // Active coordinates used for calculating distance & ranking
  const activeCoords = useMemo(() => {
    if (locationState.status === "granted") {
      return { lat: locationState.lat, lng: locationState.lng, isReal: true };
    }
    if (locationState.status === "default") {
      return { lat: locationState.lat, lng: locationState.lng, isReal: false };
    }
    return { lat: DEFAULT_PUNE_COORDS.lat, lng: DEFAULT_PUNE_COORDS.lng, isReal: false };
  }, [locationState]);

  // Reload nearest stations whenever user active coordinates change
  useEffect(() => {
    loadNearestForLocation(activeCoords.lat, activeCoords.lng);
  }, [activeCoords.lat, activeCoords.lng, loadNearestForLocation]);

  // 1. Filter stations by demo toggle
  const availableStations = useMemo(() => {
    if (showDemo) return stations;
    return stations.filter((s) => s.source !== "Synthetic demo");
  }, [stations, showDemo]);

  const availableNearest = useMemo(() => {
    const base = nearestStations.length > 0 ? nearestStations : stations;
    if (showDemo) return base;
    return base.filter((s) => s.source !== "Synthetic demo");
  }, [nearestStations, stations, showDemo]);

  // Brand station counts for filter chips
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const st of availableStations) {
      const canonical = getCanonicalBrand(st.network);
      counts[canonical] = (counts[canonical] || 0) + 1;
    }
    return counts;
  }, [availableStations]);

  // Helper filter function
  const applyFilters = useCallback(
    <T extends { name: string; network: string; address: string; city: string; district: string; available: boolean; speedKw: number; chargers?: any[] }>(
      list: T[]
    ): T[] => {
      return list.filter((st) => {
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const matchName = st.name.toLowerCase().includes(query);
          const matchNetwork = st.network.toLowerCase().includes(query);
          const matchAddress = st.address.toLowerCase().includes(query);
          const matchCity = st.city.toLowerCase().includes(query);
          const matchDistrict = st.district.toLowerCase().includes(query);
          if (!matchName && !matchNetwork && !matchAddress && !matchCity && !matchDistrict) {
            return false;
          }
        }

        if (activeFilter === "available" && !st.available) return false;
        if (activeFilter === "fast" && st.speedKw < 50) return false;

        const canonical = getCanonicalBrand(st.network);
        if (
          activeFilter === "Tata Power" ||
          activeFilter === "Statiq" ||
          activeFilter === "ChargeZone" ||
          activeFilter === "Jio-bp pulse" ||
          activeFilter === "Zeon Charging" ||
          activeFilter === "Adani TotalEnergies"
        ) {
          if (canonical !== activeFilter && st.network !== activeFilter) return false;
        }

        if (activeFilter === "CCS2" || activeFilter === "Type 2" || activeFilter === "CHAdeMO") {
          const hasConnector = st.chargers?.some(
            (c: any) => c.connector?.toLowerCase() === activeFilter.toLowerCase()
          );
          if (!hasConnector) return false;
        }

        return true;
      });
    },
    [searchQuery, activeFilter]
  );

  // 2. LIST & AI RANKING: Use the 200 stations nearest to user's location, keep ranking on the nearest 25
  const nearest200WithDistance = useMemo(() => {
    return availableNearest
      .map((st) => ({
        ...st,
        distanceKm: haversineKm(activeCoords.lat, activeCoords.lng, st.lat, st.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 200);
  }, [availableNearest, activeCoords]);

  // AI ranking on the nearest 25 stations as before
  const scoredNearestStations = useMemo(() => {
    if (nearest200WithDistance.length === 0) return [];

    const top25 = nearest200WithDistance.slice(0, 25);
    const top25Scored = scoreAllStations(
      top25,
      batteryPercent,
      activeVehicle,
      user?.chargingPreference
    );

    // Remaining stations scored against nearest200 normalization
    const remaining = nearest200WithDistance.slice(25).map((st) =>
      scoreStation(
        st,
        batteryPercent,
        nearest200WithDistance,
        activeVehicle,
        user?.chargingPreference
      )
    );

    return [...top25Scored, ...remaining];
  }, [nearest200WithDistance, batteryPercent, activeVehicle, user?.chargingPreference]);

  // Apply search and filter chips to list stations
  const displayListStations = useMemo(() => {
    return applyFilters(scoredNearestStations);
  }, [scoredNearestStations, applyFilters]);

  // 3. MAP STATIONS: All loaded viewport + nearest stations, with distance & filtered
  const mapStations = useMemo(() => {
    const withDistance = availableStations.map((st) => ({
      ...st,
      distanceKm: haversineKm(activeCoords.lat, activeCoords.lng, st.lat, st.lng),
      aiScore: st.aiScore || 85,
      aiPickReason: "Recommended EV Station",
      topFactors: [st.available ? "Available" : "In use"],
    }));
    return applyFilters(withDistance);
  }, [availableStations, activeCoords, applyFilters]);

  // 50 km check for nearest warning
  const stationsWithin50km = useMemo(() => {
    return displayListStations.filter((st) => st.distanceKm <= 50);
  }, [displayListStations]);

  const noStationsWithin50km = useMemo(() => {
    return (
      (locationState.status === "granted" || locationState.status === "default") &&
      stationsWithin50km.length === 0 &&
      displayListStations.length > 0
    );
  }, [locationState.status, stationsWithin50km.length, displayListStations.length]);

  // Fit map bounds when stations are far away (>50 km)
  const shouldFitBounds = useMemo(() => {
    return (
      noStationsWithin50km ||
      (locationState.status === "granted" && (displayListStations[0]?.distanceKm ?? 0) > 25)
    );
  }, [noStationsWithin50km, locationState.status, displayListStations]);

  // ── Request Real-Time Live Location (Google Maps style) ──
  const requestLiveLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState({
        status: "denied",
        reason: "Geolocation is not supported by your browser or device.",
      });
      return;
    }

    setLocationState({
      status: "requesting",
      message: "Locating your real-time position…",
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyMeters = pos.coords.accuracy;

        const placeLabel = await reverseGeocodeCoords(lat, lng);

        setLocationState({
          status: "granted",
          lat,
          lng,
          label: placeLabel,
          accuracyMeters,
        });
        setSelectedStation(null);
        setShowLocationBanner(false);
      },
      (err) => {
        let reason = "Unable to retrieve your location.";
        if (err.code === 1) {
          reason =
            "Location access denied. Please click the location/lock icon in your browser address bar to allow location.";
        } else if (err.code === 2) {
          reason = "Location signal unavailable. Please ensure GPS/location services are turned on.";
        } else if (err.code === 3) {
          reason = "Location request timed out. Please tap the location button again.";
        }
        setLocationState({ status: "denied", reason });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ── Reset to Default Location (Pune) ──
  const handleResetLocation = useCallback(() => {
    setLocationState({
      status: "default",
      lat: DEFAULT_PUNE_COORDS.lat,
      lng: DEFAULT_PUNE_COORDS.lng,
      label: DEFAULT_LOCATION_LABEL,
    });
    setShowLocationBanner(true);
  }, []);

  // ── Direct Map Click or Marker Drag (Instantly set pin anywhere) ──
  const handleMapClick = useCallback(async (coords: { lat: number; lng: number }) => {
    const placeLabel = await reverseGeocodeCoords(coords.lat, coords.lng);
    setLocationState({
      status: "granted",
      lat: coords.lat,
      lng: coords.lng,
      label: placeLabel,
      accuracyMeters: 5,
    });
    setShowLocationBanner(false);
  }, []);

  // ── Select predefined popular location ──
  const handleSelectPredefinedLocation = useCallback((loc: (typeof POPULAR_LOCATIONS)[number]) => {
    setLocationState({
      status: "granted",
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label,
      accuracyMeters: 10,
    });
    setSelectedStation(null);
    setShowLocationModal(false);
    setShowLocationBanner(false);
  }, []);

  // ── Search & set location from Location Picker modal ──
  const handleSearchModalLocation = useCallback(
    async (queryText?: string) => {
      const q = (queryText || locationSearchInput).trim();
      if (!q) return;

      // 1. Check if matches predefined
      const pre = POPULAR_LOCATIONS.find((p) => p.name.toLowerCase().includes(q.toLowerCase()));
      if (pre) {
        handleSelectPredefinedLocation(pre);
        return;
      }

      // 2. Check if matches any station city/district
      const matchedCity = availableStations.find(
        (st) =>
          (st.city && st.city.toLowerCase().includes(q.toLowerCase())) ||
          (st.district && st.district.toLowerCase().includes(q.toLowerCase()))
      );
      if (matchedCity) {
        setLocationState({
          status: "granted",
          lat: matchedCity.lat,
          lng: matchedCity.lng,
          label: `${matchedCity.city}, Maharashtra`,
          accuracyMeters: 10,
        });
        setSelectedStation(null);
        setShowLocationModal(false);
        setShowLocationBanner(false);
        return;
      }

      // 3. Geocode via Nominatim
      setIsSearchingLocation(true);
      try {
        const match = await geocodePlace(q);
        if (match) {
          setLocationState({
            status: "granted",
            lat: match.lat,
            lng: match.lng,
            label: match.label,
            accuracyMeters: 10,
          });
          setSelectedStation(null);
          setShowLocationModal(false);
          setShowLocationBanner(false);
        }
      } finally {
        setIsSearchingLocation(false);
      }
    },
    [locationSearchInput, availableStations, handleSelectPredefinedLocation]
  );

  // ── Matching Cities & Stations for Live Search Dropdown ──
  const matchingStations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 1) return [];

    return availableStations
      .filter((st) => {
        return (
          st.name?.toLowerCase().includes(q) ||
          st.network?.toLowerCase().includes(q) ||
          st.address?.toLowerCase().includes(q) ||
          st.city?.toLowerCase().includes(q) ||
          st.district?.toLowerCase().includes(q)
        );
      })
      .map((st) => ({
        ...st,
        distanceKm: haversineKm(activeCoords.lat, activeCoords.lng, st.lat, st.lng),
        aiScore: st.aiScore || 85,
        aiPickReason: "Recommended EV Station",
        topFactors: [st.available ? "Available" : "In use"],
      }))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 6);
  }, [availableStations, searchQuery, activeCoords]);

  const matchingCities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 1) return [];

    const cityMap: Record<
      string,
      { city: string; district: string; count: number; avgLat: number; avgLng: number }
    > = {};

    for (const st of availableStations) {
      const city = st.city || "";
      const district = st.district || "";
      if (!city) continue;

      if (city.toLowerCase().includes(q) || district.toLowerCase().includes(q)) {
        if (!cityMap[city]) {
          cityMap[city] = { city, district, count: 0, avgLat: st.lat, avgLng: st.lng };
        }
        cityMap[city].count += 1;
      }
    }

    return Object.values(cityMap).slice(0, 4);
  }, [availableStations, searchQuery]);

  const handleSelectStation = useCallback((st: any) => {
    setSelectedStation(st);
    setSearchQuery(st.name);
    setIsSearchOpen(false);
  }, []);

  const handleSelectCity = useCallback(
    (cityItem: { city: string; district: string; avgLat: number; avgLng: number }) => {
      setLocationState({
        status: "granted",
        lat: cityItem.avgLat,
        lng: cityItem.avgLng,
        label: `${cityItem.city}, Maharashtra`,
        accuracyMeters: 10,
      });
      setSelectedStation(null);
      setSearchQuery(cityItem.city);
      setIsSearchOpen(false);
      setShowLocationBanner(false);
    },
    []
  );

  // ── Village/City Search Handler (Geocodes place & centers map) ──
  const handleSearchSubmit = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    if (matchingStations.length > 0) {
      handleSelectStation(matchingStations[0]);
      return;
    }

    if (matchingCities.length > 0) {
      handleSelectCity(matchingCities[0]);
      return;
    }

    setIsSearchingGeocode(true);
    try {
      const match = await geocodePlace(q);
      if (match) {
        setLocationState({
          status: "granted",
          lat: match.lat,
          lng: match.lng,
          label: match.label,
          accuracyMeters: 5,
        });
        setSelectedStation(null);
        setShowLocationBanner(false);
        setIsSearchOpen(false);
      }
    } finally {
      setIsSearchingGeocode(false);
    }
  }, [searchQuery, matchingStations, matchingCities, handleSelectStation, handleSelectCity]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nearestStationDistance = displayListStations[0]?.distanceKm;
  const isLocating = locationState.status === "requesting";
  const isLive = locationState.status === "granted";

  const currentLocationLabel = useMemo(() => {
    if (locationState.status === "granted" || locationState.status === "default") {
      return locationState.label;
    }
    if (locationState.status === "requesting") {
      return "Locating…";
    }
    return DEFAULT_LOCATION_LABEL;
  }, [locationState]);

  // ── Range Reachability ──
  // Use vehicle claimed range if linked, else user's manually entered range
  const effectiveRangeKm = useMemo<number | null>(() => {
    if (activeVehicle?.claimedRangeKm) return activeVehicle.claimedRangeKm;
    if (manualRangeKm && manualRangeKm > 0) return manualRangeKm;
    return null;
  }, [activeVehicle, manualRangeKm]);

  // Estimated km reachable at current battery %
  const estimatedReachableKm = useMemo<number | null>(() => {
    if (!effectiveRangeKm) return null;
    return Math.round((batteryPercent / 100) * effectiveRangeKm);
  }, [effectiveRangeKm, batteryPercent]);

  // Count how many nearby stations are unreachable
  const unreachableCount = useMemo(() => {
    if (!estimatedReachableKm) return 0;
    return displayListStations.filter((st) => st.distanceKm > estimatedReachableKm).length;
  }, [displayListStations, estimatedReachableKm]);

  // Show "Enter Range" nudge when: no vehicle linked AND no manual range set AND not dismissed
  const showRangeNudge = !hasVehicle && !manualRangeKm && !rangeBannerDismissed;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F4F6F9] overflow-hidden select-none">
      {/* ── Top Floating Header Bar ── */}
      <div className="absolute top-1 inset-x-3 z-20 flex flex-col gap-2">
        {/* User Greeting & Wallet Row */}
        <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-3.5 py-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center text-xs font-black shadow-sm border border-lime-400 shrink-0 hover:opacity-85 transition-opacity"
            >
              {userProfile.avatarInitials || "SD"}
            </Link>
            <div className="min-w-0">
              <Link
                href="/profile"
                className="text-[11px] font-black text-slate-950 leading-none hover:underline block truncate"
              >
                {userProfile.name || "Sanjyot Dhamal"}
              </Link>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-[9px] text-slate-700 font-extrabold mt-0.5 flex items-center gap-1 hover:text-black cursor-pointer bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                title="Tap to change your location"
              >
                <MapPin size={9} className="text-[#7EF000] shrink-0 fill-[#7EF000]" />
                <span className="truncate max-w-[130px]">
                  {currentLocationLabel.replace("Default location: ", "")}
                </span>
                <ChevronDown size={9} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Battery % Button — tap to open popup */}
          <button
            onClick={() => {
              setBatteryInput(String(batteryPercent));
              setShowBatteryPopup(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs shadow-sm hover:scale-105 transition-all shrink-0 cursor-pointer ${
              batteryPercent <= 20
                ? "bg-red-500 border-red-400 text-white"
                : batteryPercent <= 40
                ? "bg-amber-400 border-amber-400 text-slate-950"
                : "bg-[#7EF000] border-lime-400 text-slate-950"
            }`}
            title="Tap to update battery %"
          >
            <BatteryCharging size={14} strokeWidth={2.5} />
            <span>{batteryPercent}%</span>
          </button>
        </div>

        {/* ── Battery % Quick Update Popup ── */}
        {showBatteryPopup && (
          <div className="bg-white border-2 border-[#7EF000] rounded-2xl px-4 py-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#7EF000] border border-lime-400 flex items-center justify-center shrink-0">
                  <BatteryCharging size={15} className="text-slate-950" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-950">Current Battery Level</p>
                  <p className="text-[9px] text-slate-500 font-bold">Update every time you charge or drive</p>
                </div>
              </div>
              <button
                onClick={() => { setShowBatteryPopup(false); sessionStorage.setItem("chargehub:batteryPopupDismissed", "true"); }}
                className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            {/* Large % display */}
            <div className="flex items-center justify-center gap-4 py-1">
              <button
                onClick={() => {
                  const v = Math.max(5, Number(batteryInput) - 5);
                  setBatteryInput(String(v));
                }}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-black text-lg hover:bg-slate-200 active:scale-90 transition-all cursor-pointer border border-slate-200 flex items-center justify-center"
              >
                −
              </button>

              <div className="text-center">
                <span
                  className={`text-4xl font-black tabular-nums ${
                    Number(batteryInput) <= 20
                      ? "text-red-500"
                      : Number(batteryInput) <= 40
                      ? "text-amber-500"
                      : "text-slate-950"
                  }`}
                >
                  {batteryInput}
                </span>
                <span className="text-xl font-black text-slate-400">%</span>
                {manualRangeKm && (
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    ~{Math.round((Number(batteryInput) / 100) * manualRangeKm)} km reach
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  const v = Math.min(100, Number(batteryInput) + 5);
                  setBatteryInput(String(v));
                }}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-black text-lg hover:bg-slate-200 active:scale-90 transition-all cursor-pointer border border-slate-200 flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={batteryInput}
              onChange={(e) => setBatteryInput(e.target.value)}
              className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-[#7EF000] bg-slate-200"
            />

            <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5">
              <span>5% — Critical</span>
              <span>50% — Half</span>
              <span>100% — Full</span>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[10, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setBatteryInput(String(pct))}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    Number(batteryInput) === pct
                      ? "bg-[#7EF000] border-lime-400 text-slate-950 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Confirm */}
            <button
              onClick={() => {
                const val = Math.max(5, Math.min(100, Number(batteryInput) || batteryPercent));
                setBatteryPercent(val);
                setShowBatteryPopup(false);
                sessionStorage.setItem("chargehub:batteryPopupDismissed", "true");
              }}
              className="w-full bg-[#0F172A] text-[#7EF000] font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-98 transition-all cursor-pointer border border-slate-800 shadow-sm"
            >
              <CheckCircle2 size={14} strokeWidth={2.5} />
              Set Battery to {batteryInput}%
            </button>
          </div>
        )}

        {/* ── Location Permission Prompt Banner ── */}
        {showLocationBanner && locationState.status === "default" && (
          <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-sm border-2 border-[#7EF000] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#7EF000] flex items-center justify-center shrink-0 border border-lime-400">
                <Navigation size={15} className="text-slate-950" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-950">Use Real-Time Location</p>
                <p className="text-[9px] text-slate-500 font-bold truncate">Find charging stations closest to you</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={requestLiveLocation}
                className="bg-[#7EF000] text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 hover:bg-lime-400 active:scale-95 transition-all cursor-pointer border border-lime-400 shadow-xs"
              >
                <Navigation size={11} strokeWidth={2.5} />
                Live GPS
              </button>
              <button
                onClick={() => setShowLocationBanner(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Locating Status Pill ── */}
        {isLocating && (
          <div className="bg-white rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm border-2 border-[#7EF000] animate-in fade-in duration-200">
            <div className="w-4 h-4 rounded-full border-2 border-[#7EF000] border-t-transparent animate-spin shrink-0" />
            <p className="text-[11px] font-black text-slate-950">{locationState.message}</p>
          </div>
        )}

        {/* ── Active Live Location Strip ── */}
        {isLive && (
          <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-sm border-2 border-[#7EF000] animate-in fade-in duration-300">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7EF000] animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-950 truncate">
                  📍 {locationState.label} · Nearest Hubs Sorted
                </p>
                {(locationState.accuracyMeters ?? 0) > 1500 && (
                  <p className="text-[9px] text-amber-700 font-bold truncate">
                    ⚠️ Wi-Fi/IP location (~{Math.round((locationState.accuracyMeters ?? 0) / 1000)} km accuracy). Tap Change to set your exact area.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-[10px] text-slate-900 font-black bg-lime-100 hover:bg-lime-200 border border-lime-300 px-2 py-0.8 rounded-lg cursor-pointer transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleResetLocation}
                className="text-[10px] text-slate-500 font-bold hover:text-slate-800 bg-slate-100 px-2 py-0.8 rounded-lg cursor-pointer transition-colors"
                title="Return to default Pune view"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ── Location Denied / Error Toast ── */}
        {locationState.status === "denied" && (
          <div className="bg-rose-50 rounded-2xl p-2.5 shadow-sm border-2 border-rose-300 flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <p className="text-[10px] font-bold text-rose-800 truncate">{locationState.reason}</p>
            </div>
            <button
              onClick={requestLiveLocation}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} /> Retry
            </button>
          </div>
        )}

        {/* Missing Vehicle Prompt Banner */}
        {!hasVehicle && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">🚗</span>
              <p className="text-[10px] font-black text-amber-900 leading-tight truncate">
                Add your vehicle for accurate range &amp; charger matching
              </p>
            </div>
            <Link
              href="/profile"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 transition-colors shadow-xs"
            >
              Add EV
            </Link>
          </div>
        )}

        {/* ── Range Nudge Banner: appears when no vehicle & no manual range set ── */}
        {showRangeNudge && (
          <div className="bg-white border-2 border-[#7EF000] rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#7EF000] flex items-center justify-center shrink-0 border border-lime-400">
                <BatteryWarning size={15} className="text-slate-950" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-950">Enter Your EV Range</p>
                <p className="text-[9px] text-slate-500 font-bold truncate">
                  Warn when stations are out of reach at current battery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowRangeSetup(true)}
                className="bg-[#7EF000] text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 hover:bg-lime-400 active:scale-95 transition-all cursor-pointer border border-lime-400 shadow-xs"
              >
                <Zap size={11} strokeWidth={2.5} />
                Set Range
              </button>
              <button
                onClick={() => setRangeBannerDismissed(true)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Range Setup Card (expanded) ── */}
        {showRangeSetup && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <RangeSetupCard onDismiss={() => setShowRangeSetup(false)} />
          </div>
        )}

        {/* ── Range Warning: unreachable stations detected ── */}
        {estimatedReachableKm !== null && unreachableCount > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2 min-w-0">
              <BatteryWarning size={16} className="text-rose-600 shrink-0 stroke-[2.5]" />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-rose-900">
                  {unreachableCount} station{unreachableCount > 1 ? "s" : ""} unreachable at {batteryPercent}% battery
                </p>
                <p className="text-[9px] text-rose-700 font-bold">
                  Estimated reach: ~{estimatedReachableKm} km · Marked ⚠ on map &amp; list
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRangeSetup((p) => !p)}
              className="text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl shrink-0 flex items-center gap-1 cursor-pointer hover:bg-rose-200"
            >
              <ChevronRight size={11} />
              Update
            </button>
          </div>
        )}

        {/* ── Search Bar with Live Suggestions Dropdown ── */}
        <div ref={searchContainerRef} className="relative w-full z-30">
          <div className="w-full bg-white/95 backdrop-blur-xl border-2 border-slate-200 focus-within:border-[#7EF000] focus-within:ring-2 focus-within:ring-[#7EF000]/30 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm transition-all">
            <button
              type="button"
              onClick={handleSearchSubmit}
              title="Search place or filter stations"
              className="text-slate-500 hover:text-slate-950 transition-colors cursor-pointer shrink-0"
            >
              <Search size={16} />
            </button>
            <input
              type="text"
              placeholder="Search station, city, or area in Maharashtra…"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                } else if (e.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              className="bg-transparent text-xs text-slate-950 placeholder-slate-400 focus:outline-none w-full font-black"
            />
            {isSearchingGeocode && (
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin shrink-0" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 shrink-0"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* ── Live Search Dropdown ── */}
          {isSearchOpen && searchQuery.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[360px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100">
              {/* Cities / Areas Matches */}
              {matchingCities.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin size={11} className="text-[#7EF000]" />
                    <span>Cities &amp; Areas ({matchingCities.length})</span>
                  </div>
                  {matchingCities.map((item) => (
                    <button
                      key={item.city}
                      type="button"
                      onClick={() => handleSelectCity(item)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#7EF000]/20 text-slate-900 flex items-center justify-center shrink-0 border border-lime-300">
                          <MapPin size={13} className="text-slate-950" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-950 truncate">
                            {item.city}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold truncate">
                            {item.district ? `${item.district}, Maharashtra` : "Maharashtra"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                        {item.count} Hubs
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* EV Charging Station Matches */}
              {matchingStations.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Zap size={11} className="text-[#7EF000] fill-[#7EF000]" />
                    <span>Charging Stations ({matchingStations.length})</span>
                  </div>
                  {matchingStations.map((st) => (
                    <button
                      key={String(st.id)}
                      type="button"
                      onClick={() => handleSelectStation(st)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-50 last:border-b-0"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-black shadow-xs"
                          style={{ backgroundColor: getBrandColor(st.network) }}
                        >
                          ⚡
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-[9px] font-black px-1.5 py-0.2 rounded-md text-white shrink-0"
                              style={{ backgroundColor: getBrandColor(st.network) }}
                            >
                              {st.network}
                            </span>
                            <span className="text-xs font-black text-slate-950 truncate">
                              {st.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                            {st.address || st.city}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-600 font-extrabold mt-0.5">
                            <span>📍 {st.distanceKm} km away</span>
                            <span>·</span>
                            <span>⚡ {st.speedKw} kW</span>
                            <span>·</span>
                            <span>₹{st.price}/kWh</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            st.available
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {st.available ? "Available" : "Occupied"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No match in dataset fallback */}
              {matchingCities.length === 0 && matchingStations.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-xs font-black text-slate-800">No matching stations found in dataset</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Tap below to search OpenStreetMap for this location
                  </p>
                </div>
              )}

              {/* Search on OpenStreetMap option */}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center gap-2 text-xs font-black text-slate-800 transition-colors cursor-pointer"
              >
                <Search size={14} className="text-slate-600" />
                <span>Search map for "{searchQuery}"</span>
                <ChevronRight size={13} className="ml-auto text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Chips with per-brand counts & Demo toggle */}
        <FilterChips
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          brandCounts={brandCounts}
          totalCount={availableStations.length}
          showDemo={showDemo}
          onToggleDemo={() => setShowDemo((prev) => !prev)}
        />
      </div>

      {/* ── Google Map Container ── */}
      <div className="w-full flex-1 relative z-0">
        {stationsLoading && stations.length === 0 ? (
          <StationMapSkeleton />
        ) : (
          <StationMap
            stations={mapStations}
            selectedStation={selectedStation}
            onSelectStation={(st) => setSelectedStation(st)}
            userLocation={activeCoords ? { lat: activeCoords.lat, lng: activeCoords.lng } : undefined}
            onMapClick={handleMapClick}
            onLiveLocationClick={requestLiveLocation}
            onViewportChange={fetchViewportStations}
            isLocating={isLocating}
            shouldFitBounds={shouldFitBounds}
            estimatedReachableKm={estimatedReachableKm}
          />
        )}
      </div>

      {/* ── Draggable Bottom Sheet with Station List & AI Pick Card ── */}
      <BottomSheet
        stations={displayListStations}
        selectedStation={selectedStation}
        onSelectStation={(st) => setSelectedStation(st)}
        locationGranted={isLive}
        loading={stationsLoading}
        error={stationsError}
        onRetry={refreshStations}
        hasActiveFilters={activeFilter !== "all" || searchQuery.trim().length > 0}
        noStationsWithin50km={noStationsWithin50km}
        estimatedReachableKm={estimatedReachableKm}
        onClearFilters={() => {
          setActiveFilter("all");
          setSearchQuery("");
        }}
      />
      {/* ── Choose / Change Location Modal ── */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4 duration-250 select-none max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#7EF000] border border-lime-400 flex items-center justify-center text-slate-950 shadow-xs shrink-0">
                  <MapPin size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950">Set Your Location</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Find EV stations nearest to where you are
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Active Location display */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7EF000] animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Pin</div>
                  <div className="text-xs font-black text-slate-950 truncate">{currentLocationLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetLocation}
                className="text-[10px] font-black text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            {/* Live GPS button inside modal */}
            <button
              type="button"
              onClick={() => {
                requestLiveLocation();
                setShowLocationModal(false);
              }}
              className="w-full bg-[#7EF000] hover:bg-lime-400 text-slate-950 font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-lime-400 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Navigation size={14} strokeWidth={2.5} />
              <span>Use Device Live GPS</span>
            </button>

            <div className="text-[9px] text-slate-400 font-bold text-center leading-relaxed">
              ⚠️ Note: On Windows laptops / Wi-Fi, browser GPS may report your ISP gateway (e.g. Kalewadi Pimpri). Select your actual locality below for 100% accuracy.
            </div>

            {/* Search Input inside modal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Search Any Area / Colony / Landmark
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border-2 border-slate-200 focus-within:border-[#7EF000] rounded-2xl px-3 py-2 flex items-center gap-2">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Loni Kalbhor, Kothrud, Viman Nagar..."
                    value={locationSearchInput}
                    onChange={(e) => setLocationSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchModalLocation();
                    }}
                    className="bg-transparent text-xs text-slate-950 placeholder-slate-400 focus:outline-none w-full font-black"
                  />
                  {locationSearchInput && (
                    <button
                      type="button"
                      onClick={() => setLocationSearchInput("")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isSearchingLocation || !locationSearchInput.trim()}
                  onClick={() => handleSearchModalLocation()}
                  className="bg-[#0F172A] text-[#7EF000] font-black text-xs px-3.5 py-2 rounded-2xl border border-slate-800 disabled:opacity-50 cursor-pointer hover:bg-slate-800 transition-all shrink-0"
                >
                  {isSearchingLocation ? "Searching…" : "Set"}
                </button>
              </div>
            </div>

            {/* Popular Localities Chips */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Quick Pick — Popular Pune &amp; Maharashtra Localities
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {POPULAR_LOCATIONS.map((loc) => {
                  const isSelected = currentLocationLabel.toLowerCase().includes(loc.name.toLowerCase());
                  return (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleSelectPredefinedLocation(loc)}
                      className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#0F172A] text-[#7EF000] border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <MapPin size={10} className={isSelected ? "text-[#7EF000]" : "text-slate-400"} />
                      <span>{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 text-center text-[10px] text-slate-500 font-bold">
              💡 Tip: You can also tap directly anywhere on the map to set your location pin!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
