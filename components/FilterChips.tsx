"use client";

import React from "react";
import { CheckCircle2, Gauge, Building2, Sparkles } from "lucide-react";

export type FilterOption =
  | "all"
  | "available"
  | "fast"
  | "Tata Power"
  | "Jio-bp pulse"
  | "ChargeZone"
  | "Statiq";

type FilterChipsProps = {
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
};

export default function FilterChips({ activeFilter, onSelectFilter }: FilterChipsProps) {
  const chips: { id: FilterOption; label: string; icon?: React.ElementType }[] = [
    { id: "all", label: "All Stations", icon: Sparkles },
    { id: "available", label: "Available Now", icon: CheckCircle2 },
    { id: "fast", label: "Fast (50kW+)", icon: Gauge },
    { id: "Tata Power", label: "Tata Power", icon: Building2 },
    { id: "Jio-bp pulse", label: "Jio-bp pulse", icon: Building2 },
    { id: "ChargeZone", label: "ChargeZone", icon: Building2 },
    { id: "Statiq", label: "Statiq", icon: Building2 },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 px-0.5">
      {chips.map((chip) => {
        const isActive = activeFilter === chip.id;
        const Icon = chip.icon;

        return (
          <button
            key={chip.id}
            onClick={() => onSelectFilter(chip.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
              isActive
                ? "bg-[#7EF000] text-slate-950 shadow-[0_4px_14px_rgba(126,240,0,0.4)] border border-lime-400 scale-105"
                : "bg-white text-slate-700 border border-slate-200 hover:text-slate-950 shadow-sm"
            }`}
          >
            {Icon && <Icon size={12} className={isActive ? "text-slate-950 stroke-[2.5]" : "text-slate-500"} />}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
