"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Wallet, SlidersHorizontal, MapPin, Navigation, X } from "lucide-react";
import { stations } from "@/data/stations";
import { scoreAllStations, ScoredStation } from "@/lib/scoring";
import { useApp } from "@/context/AppContext";
import StationMap from "@/components/StationMap";
import BatterySlider from "@/components/BatterySlider";
import FilterChips, { FilterOption } from "@/components/FilterChips";
import BottomSheet from "@/components/BottomSheet";

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

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number; label: string }
  | { status: "denied"; reason: string };

export default function DiscoverPage() {
  const { walletBalance, batteryPercent, userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [selectedStation, setSelectedStation] = useState<ScoredStation | null>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({ status: "idle" });
  const [showLocationBanner, setShowLocationBanner] = useState(true);

  // Re-rank stations with AI scoring when batteryPercent changes
  const scoredStations = useMemo(() => {
    return scoreAllStations(stations, batteryPercent);
  }, [batteryPercent]);

  // When user location is granted, recalculate real distances and sort nearest-first
  const stationsWithRealDistance = useMemo(() => {
    if (locationState.status !== "granted") return scoredStations;

    const { lat: userLat, lng: userLng } = locationState;
    return [...scoredStations]
      .map((st) => ({
        ...st,
        distanceKm: haversineKm(userLat, userLng, st.lat, st.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [scoredStations, locationState]);

  // Apply filters
  const filteredStations = useMemo(() => {
    return stationsWithRealDistance.filter((st) => {
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
      if (
        activeFilter === "Tata Power" ||
        activeFilter === "Statiq" ||
        activeFilter === "ChargeZone" ||
        activeFilter === "Jio-bp pulse"
      ) {
        if (st.network !== activeFilter) return false;
      }

      return true;
    });
  }, [stationsWithRealDistance, searchQuery, activeFilter]);

  // Request GPS location from browser
  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState({ status: "denied", reason: "Geolocation not supported on this device." });
      return;
    }

    setLocationState({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reverse-geocode label: check if near Loni Kalbhor area
        let label = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        if (lat > 18.47 && lat < 18.51 && lng > 73.99 && lng < 74.07) {
          label = "Loni Kalbhor, Pune";
        } else if (lat > 18.45 && lat < 18.62 && lng > 73.78 && lng < 73.98) {
          label = "Pune City";
        } else if (lat > 18.9 && lat < 19.3 && lng > 72.8 && lng < 73.1) {
          label = "Mumbai";
        }
        setLocationState({ status: "granted", lat, lng, label });
        setShowLocationBanner(false);
      },
      (err) => {
        let reason = "Location access denied.";
        if (err.code === 1) reason = "Location permission denied. Enable it in browser settings.";
        else if (err.code === 2) reason = "Location unavailable. Check GPS signal.";
        else if (err.code === 3) reason = "Location request timed out.";
        setLocationState({ status: "denied", reason });
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  // Auto-prompt location on first load after 800ms
  useEffect(() => {
    const t = setTimeout(() => {
      if (locationState.status === "idle") {
        setShowLocationBanner(true);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [locationState.status]);

  const nearestStation = filteredStations[0];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F4F6F9] overflow-hidden select-none">
      {/* ── Top Floating Header Bar ── */}
      <div className="absolute top-1 inset-x-3 z-20 flex flex-col gap-2">
        {/* User Greeting & Wallet Row */}
        <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-3.5 py-2 shadow-sm">
          <Link href="/profile" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center text-xs font-black shadow-sm border border-lime-400 shrink-0">
              {userProfile.avatarInitials || "EH"}
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-950 leading-none">
                {userProfile.name || "Sanjyot Dhamal"}
              </div>
              <div className="text-[9px] text-slate-600 font-extrabold mt-0.5 flex items-center gap-1">
                <MapPin size={9} className="text-[#7EF000]" />
                <span>
                  {locationState.status === "granted"
                    ? locationState.label
                    : userProfile.city}
                  {" · "}
                  {filteredStations.length} Hubs
                </span>
              </div>
            </div>
          </Link>

          {/* Wallet Balance Badge */}
          <Link
            href="/wallet"
            className="bg-[#7EF000] border border-lime-400 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform shrink-0"
          >
            <Wallet size={14} className="text-slate-950" />
            <span className="text-xs font-black text-slate-950">₹{walletBalance.toLocaleString("en-IN")}</span>
          </Link>
        </div>

        {/* ── Location Permission Banner ── */}
        {showLocationBanner && locationState.status === "idle" && (
          <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-sm border-2 border-[#7EF000] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#7EF000] flex items-center justify-center shrink-0 border border-lime-400">
                <MapPin size={15} className="text-slate-950" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-950">Find Nearest EV Stations</p>
                <p className="text-[9px] text-slate-500 font-extrabold truncate">Allow location to sort stations by distance</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={requestLocation}
                className="bg-[#7EF000] text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 hover:bg-lime-400 active:scale-95 transition-all cursor-pointer border border-lime-400"
              >
                <Navigation size={11} strokeWidth={2.5} />
                Use GPS
              </button>
              <button
                onClick={() => setShowLocationBanner(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Location requesting state */}
        {locationState.status === "requesting" && (
          <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm border-2 border-[#7EF000] animate-in fade-in duration-200">
            <div className="w-5 h-5 rounded-full border-2 border-[#7EF000] border-t-transparent animate-spin shrink-0" />
            <p className="text-[11px] font-black text-slate-950">Getting your location…</p>
          </div>
        )}

        {/* Location granted — near-me strip */}
        {locationState.status === "granted" && (
          <div className="bg-white rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm border-2 border-[#7EF000] animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7EF000] animate-pulse" />
              <p className="text-[10px] font-black text-slate-950">
                📍 {locationState.label} · Sorted by distance
              </p>
            </div>
            <button
              onClick={() => { setLocationState({ status: "idle" }); setShowLocationBanner(true); }}
              className="text-[9px] text-slate-500 font-black hover:text-slate-800 cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        {/* Location denied message */}
        {locationState.status === "denied" && (
          <div className="bg-red-50 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm border-2 border-red-300">
            <p className="text-[10px] font-black text-red-700">{locationState.reason}</p>
            <button
              onClick={() => setLocationState({ status: "idle" })}
              className="text-red-400 hover:text-red-700 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Search Bar Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search station, city, network…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-950 placeholder-slate-500 focus:outline-none w-full font-black"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Location + Battery toggle */}
          <div className="flex items-center gap-1.5">
            {locationState.status !== "granted" && (
              <button
                onClick={requestLocation}
                title="Use My Location"
                className="p-2.5 rounded-2xl border-2 bg-white border-slate-200 hover:border-[#7EF000] hover:bg-[#7EF000]/10 text-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <Navigation size={15} />
              </button>
            )}
            <button
              onClick={() => setShowSlider((prev) => !prev)}
              className={`p-2.5 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${
                showSlider
                  ? "bg-[#7EF000] text-slate-950 border-lime-400 shadow-[0_4px_14px_rgba(126,240,0,0.4)]"
                  : "bg-white text-slate-950 border-slate-200 hover:border-slate-300"
              }`}
              title="Adjust Battery Level"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Battery Slider popup card */}
        {showSlider && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <BatterySlider />
          </div>
        )}

        {/* Horizontal Filter Chips */}
        <FilterChips activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
      </div>

      {/* ── Google Map Container with All Maharashtra Stations ── */}
      <div className="w-full flex-1 relative z-0">
        <StationMap
          stations={filteredStations}
          selectedStation={selectedStation}
          onSelectStation={(st) => setSelectedStation(st)}
          userLocation={locationState.status === "granted" ? { lat: locationState.lat, lng: locationState.lng } : undefined}
        />
      </div>

      {/* ── Draggable Bottom Sheet with Station List & AI Pick Card ── */}
      <BottomSheet
        stations={filteredStations}
        selectedStation={selectedStation}
        onSelectStation={(st) => setSelectedStation(st)}
        locationGranted={locationState.status === "granted"}
      />
    </div>
  );
}
