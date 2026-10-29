"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MapPin, Zap, Clock, ArrowRight, Navigation } from "lucide-react";
import { ScoredStation } from "@/lib/scoring";

type AiPickCardProps = {
  station: ScoredStation;
  onSelect: (station: ScoredStation) => void;
  locationGranted?: boolean;
};

export default function AiPickCard({ station, onSelect, locationGranted = false }: AiPickCardProps) {
  return (
    <div
      onClick={() => onSelect(station)}
      className="w-full bg-white border-2 border-[#7EF000] rounded-3xl p-4 shadow-[0_8px_30px_rgba(126,240,0,0.2)] relative overflow-hidden group cursor-pointer transition-all hover:border-[#70D800]"
    >
      {/* Soft lime ambient highlight */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7EF000]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase shadow-sm ${
          locationGranted
            ? "bg-blue-500 text-white"
            : "bg-[#7EF000] text-slate-950"
        }`}>
          {locationGranted
            ? <Navigation size={12} strokeWidth={2.5} />
            : <Sparkles size={12} className="fill-slate-950 stroke-none" />}
          <span>{locationGranted ? "Nearest to You" : "AI Pick #1"}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
          <span className="text-[10px] text-slate-700 font-extrabold">{locationGranted ? "Distance" : "Match"}</span>
          <span className="text-xs font-black text-slate-950">{locationGranted ? `${station.distanceKm} km` : `${station.aiScore}%`}</span>
        </div>
      </div>

      {/* Title & Network */}
      <div className="mb-2">
        <h3 className="text-sm font-black text-slate-950 transition-colors truncate">
          {station.name}
        </h3>
        <p className="text-[11px] text-slate-600 font-extrabold">{station.network}</p>
      </div>

      {/* Dynamic One-Line AI Pick Reason */}
      <div className="bg-[#7EF000]/15 rounded-2xl p-2.5 mb-3 border border-[#7EF000] flex items-start gap-1.5">
        <Sparkles size={14} className="text-slate-950 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-950 font-black leading-tight">
          {station.aiPickReason}
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
        <div className="flex items-center gap-3 text-[11px] font-extrabold text-slate-900">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-slate-700" />
            {station.distanceKm} km
          </span>
          <span className="flex items-center gap-1">
            <Zap size={13} className="text-slate-700" />
            {station.speedKw} kW
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-slate-700" />
            {station.waitMinutes === 0 ? "No wait" : `${station.waitMinutes}m wait`}
          </span>
        </div>

        <Link
          href={`/station/${station.id}`}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#7EF000] text-slate-950 p-2 rounded-xl hover:scale-105 transition-transform flex items-center justify-center shadow-md font-black"
        >
          <ArrowRight size={14} strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}
