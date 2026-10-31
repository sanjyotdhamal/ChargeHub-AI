"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import AiPickCard from "./AiPickCard";
import StationCard from "./StationCard";
import { ScoredStation } from "@/lib/scoring";
import { ListFilter, Navigation } from "lucide-react";

import { StationCardSkeleton } from "./StationSkeleton";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

type BottomSheetProps = {
  stations: ScoredStation[];
  selectedStation: ScoredStation | null;
  onSelectStation: (station: ScoredStation) => void;
  locationGranted?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
};

export default function BottomSheet({
  stations,
  selectedStation,
  onSelectStation,
  locationGranted = false,
  loading = false,
  error = null,
  onRetry,
  onClearFilters,
  hasActiveFilters = false,
}: BottomSheetProps) {
  // Snap states: "collapsed", "half", "full"
  const [snapState, setSnapState] = useState<"collapsed" | "half" | "full">("half");

  const snapPositions = {
    collapsed: "calc(100% - 135px)",
    half: "calc(100% - 410px)",
    full: "16px",
  };

  const cycleSnap = () => {
    if (snapState === "collapsed") setSnapState("half");
    else if (snapState === "half") setSnapState("full");
    else setSnapState("collapsed");
  };

  const aiPick = stations.length > 0 ? stations[0] : null;
  const listStations = stations.length > 0 ? stations.slice(1) : [];

  return (
    <motion.div
      initial={{ y: "calc(100% - 410px)" }}
      animate={{ y: snapPositions[snapState] }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="absolute inset-x-0 bottom-0 top-0 bg-white backdrop-blur-2xl border-t-2 border-slate-200 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] z-30 flex flex-col overflow-hidden"
    >
      {/* Drag Handle Bar Header */}
      <div
        onClick={cycleSnap}
        className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 shrink-0 border-b border-slate-200 bg-white"
      >
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mb-1" />
        <div className="flex items-center justify-between w-full px-5 text-xs text-slate-700 font-extrabold">
          <span className="font-black text-slate-950 flex items-center gap-1.5">
            <ListFilter size={15} className="text-slate-950 stroke-[2.5]" />
            EV Stations ({stations.length})
            {locationGranted && (
              <span className="ml-1 bg-blue-100 text-blue-700 border border-blue-200 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Navigation size={8} strokeWidth={2.5} />
                Nearest First
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-950 font-black uppercase tracking-wider bg-[#7EF000] px-2.5 py-0.5 rounded-full border border-lime-400">
            {snapState === "full" ? "Swipe Down" : snapState === "collapsed" ? "Expand" : "Swipe Up"}
          </span>
        </div>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar pb-20 bg-[#F4F6F9]">
        {loading ? (
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider px-1">
              Loading Stations...
            </div>
            <StationCardSkeleton />
            <StationCardSkeleton />
            <StationCardSkeleton />
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle size={36} className="text-red-500 mb-2" />
            <p className="text-xs font-black text-slate-900 mb-1">Failed to load stations</p>
            <p className="text-[11px] text-slate-500 mb-4 max-w-xs">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-[#7EF000] text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Retry
              </button>
            )}
          </div>
        ) : (
          <>
            {aiPick && (
              <div>
                <AiPickCard station={aiPick} onSelect={onSelectStation} locationGranted={locationGranted} />
              </div>
            )}

            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider pt-1 px-1 flex items-center gap-2">
              {locationGranted ? "Nearby Hubs" : "All Network Hubs"} ({listStations.length})
            </div>

            {listStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onSelect={onSelectStation}
              />
            ))}

            {stations.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-center p-4">
                <XCircle size={36} className="text-slate-400 mb-2" />
                <p className="text-xs font-black text-slate-800 mb-1">No stations found</p>
                <p className="text-[11px] text-slate-500 mb-3">
                  No charging stations match your active search or filters.
                </p>
                {hasActiveFilters && onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className="bg-slate-900 text-white font-black text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
