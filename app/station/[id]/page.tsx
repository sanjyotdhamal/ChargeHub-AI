"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Navigation,
  Zap,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { stations } from "@/data/stations";
import { scoreStation } from "@/lib/scoring";
import { useApp } from "@/context/AppContext";

export default function StationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { batteryPercent } = useApp();

  const stationId = parseInt(resolvedParams.id, 10);
  const rawStation = stations.find((s) => s.id === stationId);

  if (!rawStation) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={40} className="text-red-500 mb-2" />
        <h2 className="text-lg font-black text-slate-900 mb-1">Station Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested charging station could not be found.</p>
        <button
          onClick={() => router.push("/discover")}
          className="bg-[#7EF000] text-slate-950 px-4 py-2 rounded-xl text-xs font-black"
        >
          Return to Map
        </button>
      </div>
    );
  }

  // Score station with current battery state
  const station = scoreStation(rawStation, batteryPercent, stations);

  const handleNavigate = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const getNetworkBadge = (network: string) => {
    if (network.includes("Tata")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (network.includes("Statiq")) return "bg-orange-50 text-orange-700 border-orange-200";
    if (network.includes("ChargeZone")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col justify-between text-slate-900 select-none overflow-hidden">
      {/* ── Top Header ── */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
          <Zap size={14} className="text-slate-950 fill-slate-950" /> Station Details
        </span>

        <div className="w-8" />
      </div>

      {/* ── Scrollable Station Content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* Name & Rating */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getNetworkBadge(
                station.network
              )}`}
            >
              {station.network}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
              <Star size={13} className="fill-amber-400 stroke-none" />
              <span>{station.rating}</span>
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{station.name}</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-start gap-1 font-semibold">
            <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
            <span>{station.address}</span>
          </p>
        </div>

        {/* AI Insight Crisp White Card */}
        <div className="bg-white text-slate-900 border-2 border-[#7EF000] rounded-3xl p-3.5 flex items-start gap-3 shadow-sm">
          <Sparkles size={18} className="text-slate-950 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
              <span>AI Recommendation Match</span>
              <span className="bg-[#7EF000] text-slate-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                {station.aiScore}%
              </span>
            </div>
            <p className="text-slate-700 mt-0.5 font-bold leading-relaxed">
              {station.aiPickReason}
            </p>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-bold">Tariff</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">₹{station.price}</div>
            <div className="text-[9px] text-slate-400 font-medium">per kWh</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-bold">Speed</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{station.speedKw}</div>
            <div className="text-[9px] text-slate-400 font-medium">kW Max</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-bold">Distance</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{station.distanceKm}</div>
            <div className="text-[9px] text-slate-400 font-medium">km away</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-bold">Wait</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{station.waitMinutes}</div>
            <div className="text-[9px] text-slate-400 font-medium">mins</div>
          </div>
        </div>

        {/* Chargers / Ports List */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Connectors & Charging Ports ({station.chargers.length})
          </h2>

          <div className="space-y-2">
            {station.chargers.map((charger) => {
              const isAvailable = charger.status === "available";
              return (
                <div
                  key={charger.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-black">
                      <Zap size={18} className="text-slate-950 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          Port {charger.id} ({charger.connector})
                        </span>
                        <span className="text-[10px] bg-slate-900 text-[#7EF000] px-1.5 py-0.2 rounded font-black">
                          {charger.powerKw} kW
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Ultra-Fast EV Connector
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAvailable ? (
                      <span className="flex items-center gap-1 text-[11px] text-slate-950 font-black bg-[#7EF000] px-2.5 py-1 rounded-xl shadow-sm">
                        <CheckCircle2 size={13} />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-xl">
                        <XCircle size={13} />
                        In Use
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Docked Bottom Actions ── */}
      <div className="p-3.5 bg-white/95 backdrop-blur-xl border-t border-slate-200 shrink-0 z-30 flex items-center gap-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleNavigate}
          className="flex-1 bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-200 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
        >
          <Navigation size={16} />
          <span>Get Direction</span>
        </button>

        <Link
          href={`/session/${station.id}`}
          className="flex-[1.4] bg-[#7EF000] text-slate-950 hover:bg-[#70D800] font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-opacity shadow-[0_4px_16px_rgba(126,240,0,0.45)] cursor-pointer"
        >
          <Zap size={16} className="fill-slate-950 stroke-none" />
          <span>Start Charging</span>
        </Link>
      </div>
    </div>
  );
}
