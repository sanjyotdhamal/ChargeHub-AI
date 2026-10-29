"use client";

import React, { useState } from "react";
import { Zap, DollarSign, Compass, Scale, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ChargingPreference } from "@/lib/scoring";

interface PreferenceSelectorProps {
  onSavedToast?: (msg: string) => void;
}

export default function PreferenceSelector({ onSavedToast }: PreferenceSelectorProps) {
  const { user, refreshUser } = useAuth();
  const currentPref: ChargingPreference =
    (user?.chargingPreference as ChargingPreference) || "balanced";

  const [saving, setSaving] = useState(false);

  const options: {
    id: ChargingPreference;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    desc: string;
  }[] = [
    {
      id: "balanced",
      label: "Balanced",
      icon: Scale,
      desc: "Equal weight across speed, distance, wait time, and charging rates.",
    },
    {
      id: "fastest",
      label: "Fastest",
      icon: Zap,
      desc: "Prioritizes high-kW rapid DC chargers and lowest queue times.",
    },
    {
      id: "cheapest",
      label: "Cheapest",
      icon: DollarSign,
      desc: "Prioritizes lowest ₹/kWh rates and economical charging hubs.",
    },
    {
      id: "nearest",
      label: "Nearest",
      icon: Compass,
      desc: "Prioritizes chargers within immediate GPS proximity to you.",
    },
  ];

  const handleSelect = async (pref: ChargingPreference) => {
    if (pref === currentPref || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chargingPreference: pref }),
      });

      if (res.ok) {
        await refreshUser();
        onSavedToast?.(`Preference updated to ${pref.charAt(0).toUpperCase() + pref.slice(1)}!`);
      }
    } catch (err) {
      console.warn("Failed to update preference:", err);
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = options.find((o) => o.id === currentPref) || options[0];

  return (
    <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            AI Charging Preference
          </h3>
          <p className="text-[10px] text-slate-500 font-bold">
            Tailors scoring and recommendations to your driving style
          </p>
        </div>

        {saving && (
          <span className="text-[10px] font-black text-slate-400 animate-pulse">
            Saving…
          </span>
        )}
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = opt.id === currentPref;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={saving}
              onClick={() => handleSelect(opt.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-950 text-[#7EF000] shadow-sm font-black scale-102"
                  : "text-slate-600 hover:text-slate-950 font-extrabold hover:bg-slate-200/50"
              }`}
            >
              <Icon size={14} className={isSelected ? "stroke-[2.5]" : "stroke-[2]"} />
              <span className="text-[10px] mt-1 tracking-tight">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic One-Line Description Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] font-bold text-slate-700">
        <Check size={14} className="text-[#077A42] shrink-0 mt-0.5" />
        <span>{selectedOption.desc}</span>
      </div>
    </div>
  );
}
