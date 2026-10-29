"use client";

import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { ScoredStation } from "@/lib/scoring";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default Center: Loni Kalbhor, Pune (18.4912 N, 74.0280 E)
const defaultCenter = {
  lat: 18.4912,
  lng: 74.0280,
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

function getNetworkColor(network: string): string {
  if (network.includes("Tata")) return "#0D9488"; // Teal
  if (network.includes("Statiq")) return "#EA580C"; // Orange
  if (network.includes("ChargeZone")) return "#2563EB"; // Blue
  if (network.includes("Jio-bp")) return "#16A34A"; // Green
  if (network.includes("Shell")) return "#F59E0B"; // Amber
  if (network.includes("BPCL")) return "#1E40AF"; // Deep Blue
  if (network.includes("Ather")) return "#06B6D4"; // Cyan
  if (network.includes("Bolt")) return "#84CC16"; // Lime
  return "#7EF000";
}

function getShortStationName(station: ScoredStation): string {
  if (station.name.includes("MIT ADT")) return "MIT ADT Campus";
  if (station.name.includes("Sanjay Service")) return "HPCL Sanjay";
  if (station.name.includes("Shell")) return "Shell Recharge";
  if (station.name.includes("Vishwaraj")) return "Vishwaraj Hosp";
  if (station.name.includes("Highway Hypercharger")) return "Jio-bp Hyper";
  if (station.name.includes("Rajendra")) return "BPCL Rajendra";
  if (station.name.includes("Peace Dome")) return "Peace Dome";
  if (station.name.includes("Kadamwakabasti")) return "Kadamwakabasti";
  if (station.name.includes("Swastik")) return "IOCL Swastik";
  if (station.name.includes("Ather")) return "Ather Grid";
  if (station.name.includes("Bolt")) return "Bolt.Earth";
  return station.network;
}

function createStationMarkerSvg(station: ScoredStation, isSelected: boolean): string {
  const brandColor = getNetworkColor(station.network);
  const statusColor = station.available ? "#22C55E" : "#94A3B8";

  if (isSelected) {
    const shortName = getShortStationName(station).replace("&", "&amp;");
    const stats = `${station.speedKw}kW · ₹${station.price}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="48" viewBox="0 0 144 48">
      <defs>
        <filter id="shadow-sel" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow-sel)">
        <rect x="4" y="2" width="136" height="34" rx="17" fill="#0F172A" stroke="#7EF000" stroke-width="2.5"/>
        <circle cx="20" cy="19" r="8.5" fill="${brandColor}"/>
        <circle cx="20" cy="19" r="3.5" fill="${statusColor}"/>
        <text x="34" y="16" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="900" font-size="10.5" fill="#FFFFFF">${shortName}</text>
        <text x="34" y="27" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="800" font-size="9" fill="#7EF000">${stats}</text>
        <polygon points="72,44 65,36 79,36" fill="#7EF000"/>
      </g>
    </svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  // Compact circular EV pin (38x44)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44">
    <defs>
      <filter id="shadow-pin" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
      </filter>
    </defs>
    <g filter="url(#shadow-pin)">
      <circle cx="19" cy="18" r="15" fill="#FFFFFF" stroke="${brandColor}" stroke-width="2.5"/>
      <circle cx="19" cy="18" r="11" fill="${brandColor}"/>
      <path d="M19 10 L14.5 18 L19 18 L17.5 25 L23.5 17 L19 17 Z" fill="#FFFFFF"/>
      <polygon points="19,41 14,31 24,31" fill="${brandColor}"/>
      <circle cx="29" cy="9" r="4" fill="${statusColor}" stroke="#FFFFFF" stroke-width="1.5"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

type UserLocation = { lat: number; lng: number };

type StationMapProps = {
  stations: ScoredStation[];
  selectedStation: ScoredStation | null;
  onSelectStation: (station: ScoredStation) => void;
  userLocation?: UserLocation;
};

// SVG for "You are here" user dot
function createUserDotSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#3B82F6" fill-opacity="0.18"/>
    <circle cx="18" cy="18" r="9" fill="#2563EB"/>
    <circle cx="18" cy="18" r="5" fill="#FFFFFF"/>
    <circle cx="18" cy="18" r="16" fill="none" stroke="#3B82F6" stroke-width="2.5"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

export default function StationMap({
  stations,
  selectedStation,
  onSelectStation,
  userLocation,
}: StationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") as string,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState<boolean>(false);

  // If map script doesn't load within 3.5 seconds, show interactive vector map
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      setLoadTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Pan map to user location when first granted
  useEffect(() => {
    if (map && userLocation && !selectedStation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(14);
    }
  }, [map, userLocation]);

  // Pan map when selectedStation changes
  useEffect(() => {
    if (map && selectedStation) {
      map.panTo({ lat: selectedStation.lat, lng: selectedStation.lng });
      map.setZoom(15);
    }
  }, [map, selectedStation]);

  // Safe Google Maps API constructor checks
  const markerIconConfig = useMemo(() => {
    return (station: ScoredStation, isSelected: boolean) => {
      const url = createStationMarkerSvg(station, isSelected);
      if (typeof window !== "undefined" && window.google?.maps?.Size && window.google?.maps?.Point) {
        if (isSelected) {
          return {
            url,
            scaledSize: new window.google.maps.Size(144, 48),
            anchor: new window.google.maps.Point(72, 44),
          };
        }
        return {
          url,
          scaledSize: new window.google.maps.Size(38, 44),
          anchor: new window.google.maps.Point(19, 41),
        };
      }
      return { url };
    };
  }, []);

  // Graceful Fallback Interactive Map (when API key missing, offline, or blocked)
  if (loadError || (!isLoaded && loadTimedOut)) {
    return (
      <div className="w-full h-full bg-[#EAEFF5] relative overflow-hidden select-none flex flex-col items-center justify-center">
        {/* Abstract Roads Background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748B" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Pune-Solapur NH 65 & Expressways */}
            <path d="M 40 280 Q 240 290 480 340" fill="none" stroke="#0F172A" strokeWidth="14" />
            <path d="M 160 50 Q 220 280 290 700" fill="none" stroke="#94A3B8" strokeWidth="10" />
            <path d="M 40 450 Q 240 370 420 520" fill="none" stroke="#CBD5E1" strokeWidth="12" />
          </svg>
        </div>

        {/* Floating Station Markers */}
        <div className="absolute inset-0 pointer-events-auto overflow-hidden">
          {stations.slice(0, 16).map((st, idx) => {
            const positions = [
              { top: "35%", left: "45%" }, // MIT ADT Loni Kalbhor
              { top: "42%", left: "55%" }, // Highway Hypercharger
              { top: "38%", left: "50%" }, // Vishwaraj Hospital
              { top: "32%", left: "40%" }, // Kadamwakabasti
              { top: "45%", left: "62%" }, // IOCL Swastik
              { top: "28%", left: "32%" }, // Hadapsar
              { top: "22%", left: "36%" }, // Kharadi
              { top: "48%", left: "25%" }, // FC Road
              { top: "42%", left: "18%" }, // Baner
              { top: "24%", left: "22%" }, // Mumbai BKC
              { top: "32%", left: "30%" }, // Expressway
              { top: "18%", left: "38%" }, // Nashik
              { top: "68%", left: "44%" }, // Kolhapur
              { top: "58%", left: "65%" }, // Solapur
              { top: "15%", left: "82%" }, // Nagpur
            ];
            const pos = positions[idx % positions.length];
            const isSelected = selectedStation?.id === st.id;
            const brandColor = getNetworkColor(st.network);

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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md text-[10px] font-black border ${
                    isSelected
                      ? "bg-slate-950 text-white border-[#7EF000] ring-2 ring-[#7EF000]/40"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: brandColor }}
                  />
                  <span>{st.name.replace("University Campus Hub", "").replace("Highway Hypercharger", "Highway")}</span>
                  <span className={isSelected ? "text-[#7EF000]" : "text-slate-500 font-extrabold"}>
                    {st.distanceKm}km
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Loader while Google Maps script is fetching
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
        center={selectedStation ? { lat: selectedStation.lat, lng: selectedStation.lng } : defaultCenter}
        zoom={selectedStation ? 15 : 13}
        onLoad={(m) => {
          setMap(m);
        }}
        options={{
          styles: googleMapLightStyle,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
        }}
      >
        {/* User location marker */}
        {userLocation && typeof window !== "undefined" && window.google?.maps?.Size && (
          <MarkerF
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={{
              url: createUserDotSvg(),
              scaledSize: new window.google.maps.Size(36, 36),
              anchor: new window.google.maps.Point(18, 18),
            }}
            zIndex={500}
            title="Your Location"
          />
        )}

        {stations.map((station) => {
          const isSelected = selectedStation?.id === station.id;

          return (
            <MarkerF
              key={station.id}
              position={{ lat: station.lat, lng: station.lng }}
              onClick={() => onSelectStation(station)}
              icon={markerIconConfig(station, isSelected)}
              zIndex={isSelected ? 999 : 1}
            />
          );
        })}

        {selectedStation && (
          <InfoWindowF
            position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
            onCloseClick={() => {}}
            options={{
              pixelOffset:
                typeof window !== "undefined" && window.google?.maps?.Size
                  ? new window.google.maps.Size(0, -45)
                  : undefined,
            }}
          >
            <div className="p-2 max-w-[220px] text-slate-950 font-sans">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-black text-xs truncate">{selectedStation.name}</span>
                <span className="text-[10px] bg-[#7EF000] text-slate-950 px-2 py-0.5 rounded-full font-black border border-lime-400">
                  Score {selectedStation.aiScore}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-extrabold mb-1.5">
                <span>{selectedStation.network}</span>
                <span>·</span>
                <span>{selectedStation.city}</span>
                <span>·</span>
                <span>{selectedStation.distanceKm} km</span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200">
                <div>
                  <div className="font-black text-slate-950">₹{selectedStation.price}/kWh</div>
                  <div className="text-[9px] text-slate-500 font-bold">{selectedStation.speedKw} kW Fast</div>
                </div>

                <Link
                  href={`/station/${selectedStation.id}`}
                  className="bg-[#7EF000] text-slate-950 font-black px-3 py-1 rounded-xl text-[11px] flex items-center gap-1 shadow-sm border border-lime-400 hover:scale-105 transition-transform"
                >
                  <span>Book</span>
                  <ArrowRight size={12} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}