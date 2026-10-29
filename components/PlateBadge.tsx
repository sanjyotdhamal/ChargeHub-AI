"use client";

import React from "react";
import { formatRegistrationNumber } from "@/lib/validations";

interface PlateBadgeProps {
  registrationNumber: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PlateBadge({
  registrationNumber,
  size = "md",
  className = "",
}: PlateBadgeProps) {
  const formatted = formatRegistrationNumber(registrationNumber);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3.5 py-1.5 text-xs gap-2",
  };

  return (
    <div
      className={`inline-flex items-center bg-[#077A42] text-white font-mono font-black rounded-md border-2 border-[#04522B] shadow-xs select-none tracking-wider ${sizeClasses[size]} ${className}`}
      title="Indian Electric Vehicle Registration Plate"
    >
      {/* IND Hologram & Flag Blue Strip */}
      <span className="flex flex-col items-center justify-center text-[7px] leading-tight font-black text-blue-200 border-r border-emerald-600/60 pr-1 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 inline-block mb-0.5 opacity-80" />
        IND
      </span>

      {/* Formatted Registration Code */}
      <span className="font-extrabold uppercase tracking-widest text-white drop-shadow-xs">
        {formatted || "MH 12 EV 0000"}
      </span>
    </div>
  );
}
