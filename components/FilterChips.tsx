"use client";

import React from "react";
import { CheckCircle2, Gauge, Building2, Sparkles, Database } from "lucide-react";
import { BRAND_COLORS } from "./StationMap";

export type FilterOption =
  | "all"
  | "available"
  | "fast"
  | "CCS2"
  | "Type 2"
  | "CHAdeMO"
  | "Tata Power"
  | "Jio-bp pulse"
  | "ChargeZone"
  | "Statiq"
  | "Zeon Charging"
  | "Adani TotalEnergies";

type FilterChipsProps = {
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
  brandCounts?: Record<string, number>;
  totalCount?: number;
  showDemo?: boolean;
  onToggleDemo?: () => void;
};

export default function FilterChips({
  activeFilter,
  onSelectFilter,
  brandCounts = {},
  totalCount,
  showDemo = true,
  onToggleDemo,
}: FilterChipsProps) {
  const brandChips: { id: FilterOption; label: string; count?: number; brandKey?: string }[] = [
    {
      id: "all",
      label: "All Hubs",
      count: totalCount,
    },
    {
      id: "Tata Power",
      label: "Tata Power",
      brandKey: "Tata Power",
      count: brandCounts["Tata Power"] || 0,
    },
    {
      id: "ChargeZone",
      label: "ChargeZone",
      brandKey: "ChargeZone",
      count: brandCounts["ChargeZone"] || 0,
    },
    {
      id: "Jio-bp pulse",
      label: "Jio-bp pulse",
      brandKey: "Jio-bp pulse",
      count: brandCounts["Jio-bp pulse"] || 0,
    },
    {
      id: "Statiq",
      label: "Statiq",
      brandKey: "Statiq",
      count: brandCounts["Statiq"] || 0,
    },
    {
      id: "Zeon Charging",
      label: "Zeon Charging",
      brandKey: "Zeon Charging",
      count: brandCounts["Zeon Charging"] || 0,
    },
    {
      id: "available",
      label: "Available Now",
    },
    {
      id: "fast",
      label: "Fast (50kW+)",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 pt-0.5">
      <div className="w-full overflow-x-auto no-scrollbar py-0.5 flex items-center gap-1.5 px-0.5">
        {/* Toggle Switch: Show demo stations */}
        {onToggleDemo && (
          <button
            type="button"
            onClick={onToggleDemo}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border ${
              showDemo
                ? "bg-amber-50 text-amber-900 border-amber-300 shadow-xs"
                : "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs"
            }`}
            title="Toggle between demo stations and real Open Charge Map stations"
          >
            <Database size={11} className={showDemo ? "text-amber-600" : "text-emerald-600"} />
            <span>{showDemo ? "Demo On" : "Real Only"}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showDemo ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </button>
        )}

        {brandChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          const brandColor = chip.brandKey ? BRAND_COLORS[chip.brandKey] : undefined;

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
              {brandColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
              )}
              {chip.id === "all" && <Sparkles size={11} className="text-slate-900" />}
              {chip.id === "available" && <CheckCircle2 size={11} className="text-emerald-600" />}
              {chip.id === "fast" && <Gauge size={11} className="text-blue-600" />}
              <span>{chip.label}</span>
              {chip.count !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
