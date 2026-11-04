"use client";

import React, { useState, useMemo } from "react";
import { BatteryCharging, Car, Bike, Truck, Sparkles, X, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useVehicles } from "@/context/VehicleContext";
import { useStations } from "@/context/StationsContext";
import { predictRangeRisk } from "@/lib/rangeRisk";

type BatterySliderProps = {
  nearestStationKm?: number;
};

export default function BatterySlider({ nearestStationKm: propNearestKm }: BatterySliderProps = {}) {
  const { batteryPercent, setBatteryPercent } = useApp();
  const { activeVehicle, effectiveVehicle } = useVehicles();
  const { stations } = useStations();
  const [vehicleType, setVehicleType] = useState<"car" | "bike" | "truck">("car");
  const [showExplainSheet, setShowExplainSheet] = useState<boolean>(false);

  // Determine nearest station distance from loaded stations or passed prop
  const nearestStationKm = useMemo(() => {
    if (propNearestKm != null && !isNaN(propNearestKm) && propNearestKm > 0) {
      return propNearestKm;
    }
    if (stations && stations.length > 0) {
      const distances = stations
        .map((s) => Number(s.distanceKm))
        .filter((d) => !isNaN(d) && d > 0);
      if (distances.length > 0) {
        return Math.min(...distances);
      }
    }
    return 3.8;
  }, [propNearestKm, stations]);

  // Evaluate Range Risk with decision tree model & fallback rule
  const rangeRisk = useMemo(() => {
    const currentVehicle = activeVehicle || effectiveVehicle;
    return predictRangeRisk({
      batteryPercent,
      vehicle: {
        batteryCapacityKwh: currentVehicle?.batteryCapacityKwh,
        claimedRangeKm: currentVehicle?.claimedRangeKm,
        type: vehicleType === "bike" ? "Two-Wheeler" : "Four-Wheeler",
        model: currentVehicle?.model,
        brand: currentVehicle?.brand,
      },
      nearestStationKm,
    });
  }, [batteryPercent, activeVehicle, effectiveVehicle, vehicleType, nearestStationKm]);

  const getBatteryColor = (val: number) => {
    if (val < 25) return "text-red-500 bg-red-50 border-red-200";
    if (val < 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-slate-900 bg-[#7EF000] border-lime-400";
  };

  const getRiskChipStyles = (level: "Low" | "Medium" | "High") => {
    if (level === "High") {
      return "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100";
    }
    if (level === "Medium") {
      return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100";
    }
    return "bg-[#7EF000]/20 text-slate-900 border-lime-400/80 hover:bg-[#7EF000]/30";
  };

  const getRiskDotColor = (level: "Low" | "Medium" | "High") => {
    if (level === "High") return "bg-rose-500";
    if (level === "Medium") return "bg-amber-500";
    return "bg-lime-600";
  };

  const currentVehicleName = activeVehicle
    ? `${activeVehicle.brand} ${activeVehicle.model}`
    : vehicleType === "bike"
    ? "Standard Electric Two-Wheeler"
    : vehicleType === "truck"
    ? "Commercial EV"
    : "Standard Electric Car";

  const claimedRange = activeVehicle?.claimedRangeKm || (vehicleType === "bike" ? 120 : 320);
  const estimatedRemainingKm = Math.round((batteryPercent / 100) * claimedRange);

  return (
    <>
      <div className="w-full bg-white rounded-3xl p-3.5 shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col gap-2.5">
        {/* Top row: Vehicle Pills & Battery Level + Risk Chip */}
        <div className="flex items-center justify-between gap-1 flex-wrap">
          {/* Vehicle Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setVehicleType("car")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === "car"
                  ? "bg-[#7EF000] text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Car size={13} />
              <span>Car</span>
            </button>
            <button
              onClick={() => setVehicleType("bike")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === "bike"
                  ? "bg-[#7EF000] text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bike size={13} />
              <span>Bike</span>
            </button>
            <button
              onClick={() => setVehicleType("truck")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                vehicleType === "truck"
                  ? "bg-[#7EF000] text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Truck size={13} />
              <span>Truck</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Range risk chip with tap-to-explain trigger */}
            <button
              type="button"
              onClick={() => setShowExplainSheet(true)}
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] font-black transition-all cursor-pointer shadow-xs active:scale-95 ${getRiskChipStyles(
                rangeRisk.level
              )}`}
              title="Tap for AI range risk analysis"
            >
              <span className={`w-2 h-2 rounded-full ${getRiskDotColor(rangeRisk.level)} animate-pulse`} />
              <span>Range risk: {rangeRisk.level}</span>
              <Info size={11} className="opacity-60" />
            </button>

            {/* Battery percentage badge */}
            <div
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-black text-xs ${getBatteryColor(
                batteryPercent
              )}`}
            >
              <BatteryCharging size={14} />
              <span>{batteryPercent}%</span>
            </div>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative flex items-center w-full pt-1">
          <input
            type="range"
            min="5"
            max="95"
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7EF000] focus:outline-none"
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5">
          <span>5% (Low Battery)</span>
          <span className="text-slate-600 font-extrabold">~{estimatedRemainingKm} km range</span>
          <span>95% (Full Charge)</span>
        </div>
      </div>

      {/* ── Tap-to-Explain Bottom Sheet / Modal ── */}
      {showExplainSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4 duration-250 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#7EF000] border border-lime-400 flex items-center justify-center text-slate-950 shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950">Range Anxiety Risk Analysis</h3>
                  <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500 mt-0.5">
                    <span>Estimated from a model trained on a synthetic dataset</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowExplainSheet(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Risk Badge and Confidence */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                rangeRisk.level === "High"
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : rangeRisk.level === "Medium"
                  ? "bg-amber-50 border-amber-200 text-amber-950"
                  : "bg-emerald-50 border-emerald-200 text-emerald-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {rangeRisk.level === "High" ? (
                  <ShieldAlert size={20} className="text-rose-600" />
                ) : (
                  <CheckCircle2 size={20} className={rangeRisk.level === "Medium" ? "text-amber-600" : "text-emerald-600"} />
                )}
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider opacity-75">Assessed Risk</div>
                  <div className="text-base font-black leading-tight">Risk Level: {rangeRisk.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold opacity-75">Confidence</div>
                <div className="text-sm font-black">{Math.round(rangeRisk.probability * 100)}%</div>
              </div>
            </div>

            {/* Model Reason */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Model Assessment Reason</div>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">{rangeRisk.reason}</p>
            </div>

            {/* Vehicle & Distance Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Vehicle</span>
                <span className="font-black text-slate-900 truncate block mt-0.5">{currentVehicleName}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Estimated Remaining</span>
                <span className="font-black text-slate-900 block mt-0.5">~{estimatedRemainingKm} km ({batteryPercent}%)</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Claimed Range</span>
                <span className="font-black text-slate-900 block mt-0.5">{claimedRange} km</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Nearest Hub</span>
                <span className="font-black text-slate-900 block mt-0.5">{nearestStationKm.toFixed(1)} km</span>
              </div>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowExplainSheet(false)}
              className="w-full bg-[#7EF000] text-slate-950 font-black py-2.5 rounded-2xl text-xs hover:bg-lime-400 active:scale-98 transition-all cursor-pointer border border-lime-400 shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
