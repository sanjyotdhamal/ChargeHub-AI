"use client";

import React from "react";
import { Zap, History, Leaf } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { computeChargingStats } from "@/lib/stats";

export default function StatsRow() {
  const { sessionHistory } = useApp();
  const { totalSessions, totalKwh, co2Formatted } = computeChargingStats(sessionHistory);

  return (
    <div className="grid grid-cols-3 gap-2 w-full select-none">
      {/* Total Sessions Card */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-1 border border-slate-200">
          <History size={14} className="stroke-[2.5]" />
        </div>
        <div className="text-base font-black text-slate-950 leading-tight">
          {totalSessions}
        </div>
        <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
          Sessions
        </div>
      </div>

      {/* Total Energy Delivered Card */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-[#7EF000]/25 text-slate-950 flex items-center justify-center mb-1 border border-lime-400">
          <Zap size={14} className="fill-slate-950 stroke-none" />
        </div>
        <div className="text-base font-black text-slate-950 leading-tight">
          {totalKwh}
        </div>
        <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
          kWh Charged
        </div>
      </div>

      {/* CO2 Displaced Card */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 border border-emerald-200">
          <Leaf size={14} className="stroke-[2.5]" />
        </div>
        <div className="text-base font-black text-emerald-600 leading-tight">
          {co2Formatted}
        </div>
        <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
          CO₂ Saved
        </div>
      </div>
    </div>
  );
}
