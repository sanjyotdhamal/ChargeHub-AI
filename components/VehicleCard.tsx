"use client";

import React from "react";
import { Zap, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import PlateBadge from "./PlateBadge";
import { VehicleItem } from "@/context/VehicleContext";

interface VehicleCardProps {
  vehicle: VehicleItem;
  onOpenDetails: (vehicle: VehicleItem) => void;
  onSetActive: (e: React.MouseEvent, id: string) => void;
  isActivating?: boolean;
}

export default function VehicleCard({
  vehicle,
  onOpenDetails,
  onSetActive,
  isActivating = false,
}: VehicleCardProps) {
  return (
    <div
      onClick={() => onOpenDetails(vehicle)}
      className={`w-full bg-white border-2 rounded-2xl p-3.5 transition-all cursor-pointer shadow-xs hover:border-slate-300 relative ${
        vehicle.isActive
          ? "border-slate-900 bg-white"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Side: Brand, Model, Variant, Plate */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-black text-slate-950 truncate">
              {vehicle.brand} {vehicle.model}
            </h4>
            {vehicle.variant && (
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {vehicle.variant}
              </span>
            )}
          </div>

          <div>
            <PlateBadge registrationNumber={vehicle.registrationNumber} size="sm" />
          </div>

          {/* Specs row */}
          <div className="flex items-center gap-2.5 text-[10px] font-extrabold text-slate-600 pt-1">
            <span className="flex items-center gap-1 text-slate-900 font-black">
              <Zap size={11} className="fill-[#7EF000] stroke-slate-950" />
              {vehicle.batteryCapacityKwh} kWh
            </span>
            <span>·</span>
            <span>{vehicle.connectorType}</span>
            <span>·</span>
            <span>~{vehicle.claimedRangeKm} km range</span>
          </div>
        </div>

        {/* Right Side: Active Badge or Set Active CTA */}
        <div className="flex flex-col items-end justify-between h-full space-y-2 shrink-0">
          {vehicle.isActive ? (
            <div className="inline-flex items-center gap-1 bg-[#7EF000] text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full border border-lime-400 shadow-xs">
              <CheckCircle2 size={12} className="stroke-[3]" />
              <span>Active</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isActivating}
              onClick={(e) => onSetActive(e, vehicle.id)}
              className="text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 px-2.5 py-1 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              {isActivating ? "Activating…" : "Set Active"}
            </button>
          )}

          <div className="text-slate-400 flex items-center text-[10px] font-bold">
            <span>Details</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
