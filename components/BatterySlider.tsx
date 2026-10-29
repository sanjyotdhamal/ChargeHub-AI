"use client";

import React, { useState } from "react";
import { BatteryCharging, Car, Bike, Truck } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function BatterySlider() {
  const { batteryPercent, setBatteryPercent } = useApp();
  const [vehicleType, setVehicleType] = useState<"car" | "bike" | "truck">("car");

  const getBatteryColor = (val: number) => {
    if (val < 25) return "text-red-500 bg-red-50 border-red-200";
    if (val < 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-slate-900 bg-[#7EF000] border-lime-400";
  };

  return (
    <div className="w-full bg-white rounded-3xl p-3.5 shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col gap-2.5">
      {/* Top row: Vehicle Pills & Battery Level */}
      <div className="flex items-center justify-between">
        {/* Vehicle Pills matching reference image layout */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setVehicleType("car")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
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
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
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
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
              vehicleType === "truck"
                ? "bg-[#7EF000] text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck size={13} />
            <span>Truck</span>
          </button>
        </div>

        {/* Battery percentage badge */}
        <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-black text-xs ${getBatteryColor(batteryPercent)}`}>
          <BatteryCharging size={14} />
          <span>{batteryPercent}%</span>
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
        <span>50%</span>
        <span>95% (Full Charge)</span>
      </div>
    </div>
  );
}
