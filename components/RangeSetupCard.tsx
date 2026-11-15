"use client";

import React, { useState } from "react";
import { Car, Zap, ChevronRight, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";

// Popular Maharashtra-popular EVs with their claimed ranges
const QUICK_PICKS = [
  { label: "Tata Nexon EV", range: 465, kwh: 40.5 },
  { label: "Tata Punch EV", range: 421, kwh: 35 },
  { label: "MG ZS EV", range: 461, kwh: 50.3 },
  { label: "Hyundai Creta EV", range: 473, kwh: 51.4 },
  { label: "Mahindra BE 6", range: 682, kwh: 79 },
  { label: "BYD Atto 3", range: 521, kwh: 60.5 },
  { label: "Kia EV6", range: 708, kwh: 77.4 },
  { label: "Ather 450X", range: 150, kwh: 3.7 },
  { label: "Ola S1 Pro", range: 195, kwh: 4 },
];

interface RangeSetupCardProps {
  onDismiss?: () => void;
}

export default function RangeSetupCard({ onDismiss }: RangeSetupCardProps) {
  const { manualRangeKm, setManualRangeKm, setManualBatteryCapacityKwh, batteryPercent } = useApp();

  const [inputRange, setInputRange] = useState<string>(manualRangeKm ? String(manualRangeKm) : "");
  const [saved, setSaved] = useState<boolean>(!!manualRangeKm);
  const [error, setError] = useState<string>("");

  const handleQuickPick = (range: number, kwh: number) => {
    setInputRange(String(range));
    setManualRangeKm(range);
    setManualBatteryCapacityKwh(kwh);
    setSaved(true);
    setError("");
  };

  const handleSave = () => {
    const val = parseFloat(inputRange);
    if (!inputRange.trim() || isNaN(val) || val < 20 || val > 1500) {
      setError("Please enter a valid range between 20 and 1500 km.");
      return;
    }
    setManualRangeKm(val);
    setSaved(true);
    setError("");
  };

  const handleClear = () => {
    setManualRangeKm(null);
    setManualBatteryCapacityKwh(null);
    setInputRange("");
    setSaved(false);
    setError("");
  };

  // Estimated reachable km at current battery
  const estimatedKm = manualRangeKm ? Math.round((batteryPercent / 100) * manualRangeKm) : null;

  return (
    <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#7EF000] border border-lime-400 flex items-center justify-center text-slate-950 shadow-xs shrink-0">
            <Car size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-950">Enter Your EV Range</h3>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5 leading-tight">
              App isn't connected to your EV — enter range so we can warn about unreachable stations
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Quick Pick Popular EVs */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Quick Pick — Popular EVs in Maharashtra</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKS.map((pick) => {
            const isActive = manualRangeKm === pick.range;
            return (
              <button
                key={pick.label}
                onClick={() => handleQuickPick(pick.range, pick.kwh)}
                className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#7EF000] text-slate-950 border-lime-400 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {pick.label}
                <span className={`ml-1 text-[9px] font-bold ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                  {pick.range} km
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            min={20}
            max={1500}
            value={inputRange}
            onChange={(e) => {
              setInputRange(e.target.value);
              setSaved(false);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="Enter full charge range in km…"
            className="w-full text-xs font-black text-slate-950 placeholder-slate-400 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#7EF000] bg-slate-50 transition-colors"
          />
          {inputRange && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">km</span>
          )}
        </div>

        <button
          onClick={handleSave}
          className="bg-[#0F172A] text-[#7EF000] text-[11px] font-black px-4 py-2.5 rounded-2xl border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
        >
          Save
        </button>

        {saved && (
          <button
            onClick={handleClear}
            title="Clear range"
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:text-red-500 border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Success State — show estimated range at current battery */}
      {saved && estimatedKm !== null && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-lime-600 stroke-[2.5]" />
            <div>
              <p className="text-[10px] font-black text-slate-950">Range saved — {manualRangeKm} km (full charge)</p>
              <p className="text-[9px] text-slate-500 font-bold">
                At {batteryPercent}% battery → <span className="text-slate-800 font-black">~{estimatedKm} km</span> reachable now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] font-black text-lime-700 bg-[#7EF000]/15 border border-lime-300 px-2 py-1 rounded-xl">
            <Zap size={11} className="stroke-[2.5]" />
            {batteryPercent}%
          </div>
        </div>
      )}

      {/* Hint when not saved */}
      {!saved && (
        <p className="text-[9px] text-slate-400 font-bold text-center pb-0.5">
          <ChevronRight size={10} className="inline" />
          Stations beyond your estimated range will be shown as{" "}
          <span className="text-red-500 font-black">⚠ Unreachable</span> on the map and list.
        </p>
      )}
    </div>
  );
}

