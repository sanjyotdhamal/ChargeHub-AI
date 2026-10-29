"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Car } from "lucide-react";

type ChargingRingProps = {
  batteryPercent: number; // 0 - 100
  powerKw: number;
};

export default function ChargingRing({ batteryPercent, powerKw }: ChargingRingProps) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (batteryPercent / 100) * circumference;

  return (
    <div className="relative w-60 h-60 flex items-center justify-center mx-auto my-3">
      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-[#7EF000]/25 rounded-full blur-2xl animate-pulse pointer-events-none" />

      {/* SVG Double Circular Progress matching the reference design */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="10"
          fill="transparent"
        />
        {/* Inner track accent */}
        <circle
          cx="100"
          cy="100"
          r={radius - 12}
          stroke="#CBD5E1"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray="4 4"
        />
        {/* Animated Electric Lime Progress Ring */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#7EF000"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Inner Content matching reference design */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {/* Crisp vehicle icon badge */}
        <div className="w-11 h-11 rounded-full bg-white border-2 border-[#7EF000] text-slate-950 flex items-center justify-center shadow-md mb-1">
          <Car size={22} />
        </div>

        <div className="text-3xl font-black text-slate-950 tracking-tight">
          {Math.round(batteryPercent)}%
        </div>

        <div className="flex items-center gap-1 text-slate-950 font-black text-[11px] bg-[#7EF000] px-2.5 py-0.5 rounded-full mt-1 shadow-sm">
          <Zap size={11} className="fill-slate-950 stroke-none" />
          <span>Charging {powerKw} kW</span>
        </div>
      </div>
    </div>
  );
}
