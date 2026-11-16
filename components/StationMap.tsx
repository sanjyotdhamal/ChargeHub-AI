"use client";

import React, { useEffect, useState, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { ScoredStation } from "@/lib/scoring";
import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
} from "lucide-react";
import { BBox } from "@/context/StationsContext";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default Center: Pune (18.5204 N, 73.8567 E)
const defaultCenter = {
  lat: 18.5204,
  lng: 73.8567,
};

// Clean standard Google Maps light skin
const googleMapLightStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5f5e0" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#426939" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e4de" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

/**
 * Brand color palette:
 * - Tata Power: Blue (#2563EB)
 * - ChargeZone: Teal (#0D9488)
 * - Jio-bp pulse: Yellow-green (#84CC16)
 * - Statiq: Orange (#F97316)
 * - Zeon Charging: Purple (#9333EA)
 */
export const BRAND_COLORS: Record<string, string> = {
  "Tata Power": "#2563EB",
  "ChargeZone": "#0D9488",
  "Jio-bp pulse": "#84CC16",
  "Statiq": "#F97316",
  "Zeon Charging": "#9333EA",
};

export function getBrandColor(network: string): string {
  if (!network) return "#0EA5E9";
  if (network.includes("Tata")) return BRAND_COLORS["Tata Power"];
  if (network.includes("ChargeZone")) return BRAND_COLORS["ChargeZone"];
  if (network.includes("Jio-bp") || network.includes("Jio")) return BRAND_COLORS["Jio-bp pulse"];
  if (network.includes("Statiq")) return BRAND_COLORS["Statiq"];
  if (network.includes("Zeon")) return BRAND_COLORS["Zeon Charging"];
  return "#0EA5E9";
}

export function getCanonicalBrand(network: string): string {
  if (!network) return "EV Station";
  if (network.includes("Tata")) return "Tata Power";
  if (network.includes("ChargeZone")) return "ChargeZone";
  if (network.includes("Jio-bp") || network.includes("Jio")) return "Jio-bp pulse";
  if (network.includes("Statiq")) return "Statiq";
  if (network.includes("Zeon")) return "Zeon Charging";
  return network;
}

// In-memory icon cache for instant lookup
const markerIconCache = new Map<string, google.maps.Icon>();

/**
 * Small SVG Marker Icon:
 * - Standard size: 16px (small dot with center bolt and status ring)
 * - DC Fast (50kW+): 20px
 * - Selected: 24px with lime halo
 * - Outline: Dashed for Demo stations; Solid for Real stations
 */
function createSmallMarkerIcon(
  station: {
    network: string;
    available: boolean;
    speedKw: number;
    source?: string;
    isSimulated?: boolean;
    waitMinutes?: number;
  },
  isSelected: boolean,
  isUnreachable = false
): google.maps.Icon {
  const brand = getCanonicalBrand(station.network);
  const isFastDc = (station.speedKw ?? 0) >= 50;
  const isDemo = station.source === "Synthetic demo" || Boolean(station.isSimulated);

  // Unreachable: greyed-out brand, red-orange ring
  const brandColor = isUnreachable ? "#94A3B8" : getBrandColor(station.network);

  // Status color
  let statusColor = "#22C55E"; // Green = available
  let statusKey = "avail";
  if (isUnreachable) {
    statusColor = "#F97316"; // Orange = out of range
    statusKey = "unreachable";
  } else if (!station.available) {
    if ((station.waitMinutes ?? 0) > 0) {
      statusColor = "#EF4444"; // Red = occupied
      statusKey = "occ";
    } else {
      statusColor = "#94A3B8"; // Grey = offline
      statusKey = "off";
    }
  }

  const cacheKey = `${brand}_${statusKey}_${isFastDc ? "fast" : "std"}_${isDemo ? "demo" : "real"}_${isSelected ? "sel" : "norm"}`;

  if (markerIconCache.has(cacheKey)) {
    return markerIconCache.get(cacheKey)!;
  }

  // Small symbol dimensions
  const size = isSelected ? 24 : isFastDc ? 20 : 16;
  const center = size / 2;
  const outerR = isSelected ? 10.5 : isFastDc ? 8.5 : 7;
  const innerR = isSelected ? 7.5 : isFastDc ? 6 : 5;
  const strokeWidth = isSelected ? 2.5 : 1.8;
  const strokeDash = isDemo ? 'stroke-dasharray="2,2"' : "";

  // Scaled lightning bolt path
  const boltPath = isSelected
    ? "M12 4 L8.5 12 L12 12 L10 20 L16 11 L12 11 Z"
    : isFastDc
    ? "M10 3.5 L7 10 L10 10 L8.5 16.5 L13.5 9 L10 9 Z"
    : "M8 2.8 L5.5 8 L8 8 L7 13 L11 7.2 L8 7.2 Z";

  const halo = isSelected
    ? `<circle cx="${center}" cy="${center}" r="11.5" fill="none" stroke="#7EF000" stroke-width="2"/>`
    : "";

  // Unreachable: add a small warning "X" cross overlay instead of lightning bolt fill
  const boltFill = isUnreachable ? "#FFFFFF88" : "#FFFFFF";

  // Unreachable warning overlay (small ⚠ diagonal lines)
  const unreachableOverlay = isUnreachable
    ? `<line x1="${center - innerR + 2}" y1="${center - innerR + 2}" x2="${center + innerR - 2}" y2="${center + innerR - 2}" stroke="#FFF" stroke-width="1.5" opacity="0.9"/>
       <line x1="${center + innerR - 2}" y1="${center - innerR + 2}" x2="${center - innerR + 2}" y2="${center + innerR - 2}" stroke="#FFF" stroke-width="1.5" opacity="0.9"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" opacity="${isUnreachable ? 0.6 : 1}">
    ${halo}
    <!-- Status ring (solid for real, dashed for demo) -->
    <circle cx="${center}" cy="${center}" r="${outerR}" fill="#FFFFFF" stroke="${statusColor}" stroke-width="${strokeWidth}" ${strokeDash}/>
    <!-- Brand filled circle -->
    <circle cx="${center}" cy="${center}" r="${innerR}" fill="${brandColor}"/>
    <!-- Center white lightning bolt -->
    <path d="${boltPath}" fill="${boltFill}"/>
    ${unreachableOverlay}
  </svg>`;

  const hasGoogleMaps = typeof window !== "undefined" && Boolean(window.google?.maps?.Size);
  const icon: google.maps.Icon = {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: hasGoogleMaps ? new window.google.maps.Size(size, size) : undefined,
    anchor:
      hasGoogleMaps && window.google?.maps?.Point
        ? new window.google.maps.Point(center, center)
        : undefined,
  };

  if (hasGoogleMaps) {
    markerIconCache.set(cacheKey, icon);
  }
  return icon;
}

type UserLocation = { lat: number; lng: number };

type StationMapProps = {
  stations: ScoredStation[];
  selectedStation: ScoredStation | null;
  onSelectStation: (station: ScoredStation) => void;
  userLocation?: UserLocation | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onLiveLocationClick?: () => void;
  onViewportChange?: (bbox: BBox) => void;
  isLocating?: boolean;
  shouldFitBounds?: boolean;
  /** Estimated km reachable at current battery. Stations beyond this will show as unreachable. */
  estimatedReachableKm?: number | null;
};

// Blue dot for user location
function createUserDotSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#3B82F6" fill-opacity="0.25"/>
    <circle cx="16" cy="16" r="7.5" fill="#2563EB"/>
    <circle cx="16" cy="16" r="3.5" fill="#FFFFFF"/>
    <circle cx="16" cy="16" r="14" fill="none" stroke="#2563EB" stroke-width="1.8"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

export default function StationMap({
  stations,
  selectedStation,
  onSelectStation,
  userLocation,
  onMapClick,
  onLiveLocationClick,
  onViewportChange,
  isLocating = false,
  shouldFitBounds = false,
  estimatedReachableKm = null,
}: StationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") as string,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // Fallback timeout if Google Maps script hangs
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      setLoadTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Fit bounds when shouldFitBounds is true
  useEffect(() => {
    if (
      map &&
      shouldFitBounds &&
      typeof window !== "undefined" &&
      window.google?.maps?.LatLngBounds &&
      stations.length > 0
    ) {
      const bounds = new window.google.maps.LatLngBounds();
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }
      stations.slice(0, 15).forEach((st) => {
        if (st.lat && st.lng) {
          bounds.extend(new window.google.maps.LatLng(st.lat, st.lng));
        }
      });
      try {
        map.fitBounds(bounds, { top: 120, bottom: 220, left: 50, right: 50 });
      } catch {
        map.fitBounds(bounds);
      }
      return;
    }

    // Pan map to user location when first granted
    if (map && userLocation && !selectedStation && !shouldFitBounds) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(13);
    }
  }, [map, userLocation, stations, shouldFitBounds, selectedStation]);

  // Pan map to user location when userLocation coordinates change
  const prevUserCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (map && userLocation) {
      const prev = prevUserCoordsRef.current;
      if (!prev || prev.lat !== userLocation.lat || prev.lng !== userLocation.lng) {
        prevUserCoordsRef.current = { lat: userLocation.lat, lng: userLocation.lng };
        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
        map.setZoom(14);
      }
    }
  }, [map, userLocation]);

  // Pan map when selectedStation changes
  useEffect(() => {
    if (map && selectedStation && selectedStation.lat && selectedStation.lng) {
      map.panTo({ lat: selectedStation.lat, lng: selectedStation.lng });
      map.setZoom(15);
    }
  }, [map, selectedStation]);

  // Filter out any invalid station coordinates
  const validStations = useMemo(() => {
    return stations.filter(
      (st) =>
        typeof st.lat === "number" &&
        typeof st.lng === "number" &&
        !isNaN(st.lat) &&
        !isNaN(st.lng) &&
        st.lat !== 0 &&
        st.lng !== 0
    );
  }, [stations]);

  // Fallback view if Google Maps API key is missing or offline
  if (loadError || (!isLoaded && loadTimedOut)) {
    return (
      <div className="w-full h-full bg-[#EAEFF5] relative overflow-hidden select-none flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748B" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M 40 280 Q 240 290 480 340" fill="none" stroke="#0F172A" strokeWidth="14" />
            <path d="M 160 50 Q 220 280 290 700" fill="none" stroke="#94A3B8" strokeWidth="10" />
          </svg>
        </div>

        <div className="absolute inset-0 pointer-events-auto overflow-hidden">
          {validStations.slice(0, 20).map((st, idx) => {
            const positions = [
              { top: "35%", left: "45%" },
              { top: "42%", left: "55%" },
              { top: "38%", left: "50%" },
              { top: "32%", left: "40%" },
              { top: "45%", left: "62%" },
              { top: "28%", left: "32%" },
              { top: "22%", left: "36%" },
              { top: "48%", left: "25%" },
            ];
            const pos = positions[idx % positions.length];
            const isSelected = selectedStation?.id === st.id;
            const brandColor = getBrandColor(st.network);

            return (
              <button
                key={st.id}
                onClick={() => onSelectStation(st)}
                style={{ top: pos.top, left: pos.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer ${
                  isSelected ? "scale-115 z-30" : "hover:scale-105 z-10"
                }`}
              >
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md text-[9px] font-black border ${
                    isSelected
                      ? "bg-slate-950 text-white border-[#7EF000] ring-2 ring-[#7EF000]/40"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: brandColor }}
                  />
                  <span className="truncate max-w-[90px]">{st.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Loading spinner while API script loads
  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center gap-3 text-slate-600 select-none">
        <div className="w-8 h-8 rounded-full border-3 border-[#7EF000] border-t-transparent animate-spin" />
        <span className="text-xs font-black tracking-wide">Connecting EV Charging Grid...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={
          selectedStation && selectedStation.lat && selectedStation.lng
            ? { lat: selectedStation.lat, lng: selectedStation.lng }
            : userLocation || defaultCenter
        }
        zoom={selectedStation ? 15 : 12}
        onLoad={(m) => {
          setMap(m);
        }}
        onClick={(e) => {
          if (onMapClick && e.latLng) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        }}
        options={{
          styles: googleMapLightStyle,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
        }}
      >
        {/* User location dot */}
        {userLocation && typeof window !== "undefined" && window.google?.maps?.Size && (
          <MarkerF
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            draggable={true}
            onDragEnd={(e) => {
              if (onMapClick && e.latLng) {
                onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              }
            }}
            icon={{
              url: createUserDotSvg(),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            }}
            zIndex={500}
            title="Your Location (Click map or drag to reposition)"
          />
        )}

        {/* Render ALL stations on map directly with small custom brand symbols */}
        {validStations.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          const isUnreachable =
            estimatedReachableKm !== null &&
            typeof station.distanceKm === "number" &&
            station.distanceKm > estimatedReachableKm;
          return (
            <MarkerF
              key={String(station.id)}
              position={{ lat: station.lat, lng: station.lng }}
              onClick={() => onSelectStation(station)}
              icon={createSmallMarkerIcon(station, isSelected, isUnreachable)}
              zIndex={isSelected ? 999 : isUnreachable ? 0 : 1}
              opacity={isUnreachable ? 0.55 : 1}
            />
          );
        })}

        {/* Compact Card InfoWindow on Marker Tap */}
        {selectedStation && (
          <InfoWindowF
            position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
            onCloseClick={() => {}}
            options={{
              pixelOffset:
                typeof window !== "undefined" && window.google?.maps?.Size
                  ? new window.google.maps.Size(0, -20)
                  : undefined,
            }}
          >
            <div className="p-1 max-w-[240px] text-slate-900 font-sans">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getBrandColor(selectedStation.network) }}
                >
                  {selectedStation.network}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-500">
                  <Star size={11} className="fill-amber-400 stroke-none" />
                  {selectedStation.rating}
                </span>
              </div>

              <h4 className="font-black text-xs text-slate-950 truncate mb-1">
                {selectedStation.name}
              </h4>

              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-extrabold mb-2">
                <span className="flex items-center gap-0.5">
                  <MapPin size={10} className="text-slate-400" />
                  {selectedStation.distanceKm} km
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-[#7EF000] fill-[#7EF000]" />
                  {selectedStation.speedKw} kW
                </span>
                <span>·</span>
                <span>₹{selectedStation.price}/kWh</span>
              </div>

              {/* Unreachable warning */}
              {estimatedReachableKm !== null &&
                typeof selectedStation.distanceKm === "number" &&
                selectedStation.distanceKm > estimatedReachableKm && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-2 py-1 mb-2">
                    <span>⚠</span>
                    <span>Out of range — {selectedStation.distanceKm} km away, ~{estimatedReachableKm} km reach</span>
                  </div>
                )}

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  {selectedStation.available ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Ready (0m)
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Clock size={11} /> {selectedStation.waitMinutes}m wait
                    </span>
                  )}
                </div>

                <Link
                  href={`/station/${selectedStation.id}`}
                  className="bg-[#7EF000] text-slate-950 font-black px-3 py-1 rounded-xl text-[11px] flex items-center gap-1 shadow-sm border border-lime-400 hover:scale-105 transition-transform"
                >
                  <span>View</span>
                  <ArrowRight size={11} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Small Map Legend (Collapsible) */}
      <div className="absolute top-28 left-3.5 z-20">
        <button
          onClick={() => setIsLegendOpen((prev) => !prev)}
          className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 px-2.5 py-1.5 rounded-2xl shadow-md text-[10px] font-black flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Info size={12} className="text-[#7EF000]" />
          <span>Legend</span>
          {isLegendOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {isLegendOpen && (
          <div className="mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-3 shadow-xl text-[10px] font-bold text-slate-700 space-y-2.5 w-52 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <div className="text-[9px] uppercase tracking-wider font-black text-slate-400 mb-1">
                Networks
              </div>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(BRAND_COLORS).map(([brand, color]) => (
                  <div key={brand} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-800 font-extrabold truncate">{brand}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2">
              <div className="text-[9px] uppercase tracking-wider font-black text-slate-400 mb-1">
                Status Ring
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white" />
                  <span>Green = Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-white" />
                  <span>Red = Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white" />
                  <span>Grey = Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-400 bg-slate-200 opacity-60" />
                  <span className="text-orange-700 font-black">Orange = ⚠ Out of range</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-dashed border-slate-700 bg-slate-100 shrink-0" />
                <span>Dashed = Demo station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-solid border-slate-700 bg-slate-100 shrink-0" />
                <span>Solid = Real station</span>
              </div>
              <div className="text-[9px] text-slate-400 font-medium">
                Larger marker = 50kW+ Fast DC
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Google Maps Live Location Button */}
      {onLiveLocationClick && (
        <button
          type="button"
          onClick={() => {
            if (userLocation && map) {
              map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
              map.setZoom(14);
            }
            onLiveLocationClick();
          }}
          className="absolute bottom-36 right-3.5 z-20 w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Your Live Location"
        >
          <Crosshair
            size={20}
            className={
              isLocating
                ? "text-blue-600 animate-spin"
                : userLocation
                ? "text-blue-600 stroke-[2.5]"
                : "text-slate-600"
            }
          />
        </button>
      )}
    </div>
  );
}
