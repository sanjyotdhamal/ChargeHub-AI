"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Zap, Clock, ChevronRight } from "lucide-react";
import { ScoredStation } from "@/lib/scoring";

type StationCardProps = {
  station: ScoredStation;
  isSelected?: boolean;
  onSelect: (station: ScoredStation) => void;
};

export default function StationCard({ station, isSelected, onSelect }: StationCardProps) {
  const getNetworkBadge = (network: string) => {
    if (network.includes("Tata")) return "bg-teal-100 text-teal-900 border-teal-300";
    if (network.includes("Statiq")) return "bg-orange-100 text-orange-900 border-orange-300";
    if (network.includes("ChargeZone")) return "bg-blue-100 text-blue-900 border-blue-300";
    return "bg-slate-100 text-slate-900 border-slate-300";
  };

  return (
    <div
      onClick={() => onSelect(station)}
      className={`w-full bg-white border-2 rounded-3xl p-3.5 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-[#7EF000] ring-2 ring-[#7EF000]/40 shadow-[0_8px_25px_rgba(126,240,0,0.25)]"
          : "border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getNetworkBadge(
                station.network
              )}`}
            >
              {station.network}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  station.available ? "bg-[#7EF000] shadow-[0_0_6px_#7EF000]" : "bg-slate-400"
                }`}
              />
              <span className="text-[10px] text-slate-700 font-extrabold">
                {station.available ? "Available" : "Occupied"}
              </span>
            </div>
          </div>
          <h4 className="text-xs font-black text-slate-950 truncate">{station.name}</h4>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="text-xs font-black text-slate-950 bg-[#7EF000] px-2.5 py-0.5 rounded-full shadow-sm border border-lime-400">
            ₹{station.price}/kWh
          </div>
          <span className="text-[9px] text-slate-600 font-extrabold mt-0.5">
            AI Score {station.aiScore}
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-[11px] text-slate-800 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 font-extrabold text-slate-800">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-slate-600" />
            {station.distanceKm} km
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-slate-600" />
            {station.speedKw} kW
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-slate-600" />
            {station.waitMinutes > 0 ? `${station.waitMinutes}m wait` : "0m wait"}
          </span>
        </div>

        <Link
          href={`/station/${station.id}`}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#7EF000] text-slate-950 hover:bg-[#70D800] px-3 py-1 rounded-xl text-xs font-black transition-transform flex items-center gap-0.5 shadow-sm border border-lime-400"
        >
          <span>Book</span>
          <ChevronRight size={13} strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}
