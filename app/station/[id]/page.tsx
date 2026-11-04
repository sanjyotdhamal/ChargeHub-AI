"use client";

import React, { use, useState, useEffect } from "react";
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
  RefreshCw,
  BatteryCharging,
} from "lucide-react";
import { useStations } from "@/context/StationsContext";
import { scoreStation } from "@/lib/scoring";
import { useApp } from "@/context/AppContext";
import { useVehicles } from "@/context/VehicleContext";
import { useAuth } from "@/context/AuthContext";
import { Station } from "@/types/station";

export default function StationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { batteryPercent } = useApp();
  const { activeVehicle } = useVehicles();
  const { user } = useAuth();
  const { stations, getStationById, loading: contextLoading } = useStations();

  const stationId = resolvedParams.id;
  const [stationDoc, setStationDoc] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadStation() {
      setIsLoading(true);
      setNotFound(false);

      const found = await getStationById(stationId);
      if (isCancelled) return;

      if (found) {
        setStationDoc(found);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }

    if (stationId) {
      loadStation();
    } else {
      setNotFound(true);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [stationId, getStationById]);

  if (isLoading || (contextLoading && !stationDoc)) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#7EF000] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
          Loading Station Details...
        </p>
      </div>
    );
  }

  if (notFound || !stationDoc) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={40} className="text-red-500 mb-2" />
        <h2 className="text-lg font-black text-slate-900 mb-1">Station Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested charging station could not be found.</p>
        <button
          onClick={() => router.push("/discover")}
          className="bg-[#7EF000] text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          Return to Map
        </button>
      </div>
    );
  }

  // Score station with current battery state & stations list
  const station = scoreStation(
    stationDoc,
    batteryPercent,
    stations.length > 0 ? stations : [stationDoc],
    activeVehicle,
    user?.chargingPreference
  );

  const handleNavigate = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const getNetworkBadge = (network: string) => {
    if (network.includes("Tata")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (network.includes("Statiq")) return "bg-orange-50 text-orange-700 border-orange-200";
    if (network.includes("ChargeZone")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (network.includes("Adani")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (network.includes("Jio-bp")) return "bg-lime-50 text-lime-700 border-lime-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col justify-between text-slate-900 select-none overflow-hidden">
      {/* ── Top Header ── */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
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

          {/* Simulated indicator note */}
          {station.isSimulated && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-xl text-[10px] font-bold">
              <span>⚡ Price and availability are simulated</span>
            </div>
          )}
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

        {/* Estimated Battery Left on Arrival Card */}
        {(() => {
          const claimedRange = activeVehicle?.claimedRangeKm ? Number(activeVehicle.claimedRangeKm) : 300;
          const stationDist = Number(station.distanceKm) || 0;
          const tripConsumptionPct = (stationDist / claimedRange) * 100;
          const batteryLeftOnArrival = Math.max(0, Math.round(batteryPercent - tripConsumptionPct));
          const isCritical = batteryLeftOnArrival <= 15;
          const isModerate = batteryLeftOnArrival <= 30;

          return (
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-3.5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${
                      isCritical
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : isModerate
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-[#7EF000]/20 text-slate-950 border-lime-400"
                    }`}
                  >
                    <BatteryCharging size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Arrival Projection
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      Estimated battery left on arrival
                    </div>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-1 ${
                    isCritical
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isModerate
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-[#7EF000] text-slate-950 border-lime-400"
                  }`}
                >
                  <span>{batteryLeftOnArrival}%</span>
                </div>
              </div>

              {/* Visual SoC Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCritical ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-[#7EF000]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, batteryLeftOnArrival))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500">
                <span>Start: {batteryPercent}%</span>
                <span>Trip: ~{tripConsumptionPct.toFixed(1)}% ({stationDist} km)</span>
                <span>Arrival: {batteryLeftOnArrival}%</span>
              </div>

              {isCritical && (
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-2.5 text-[10px] font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0 text-rose-600" />
                  <span>
                    Low battery buffer on arrival! Drive conservatively to ensure you reach comfortably.
                  </span>
                </div>
              )}
            </div>
          );
        })()}

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

          {/* Open Charge Map Attribution Credit */}
          <div className="pt-4 pb-2 text-center border-t border-slate-200/60 mt-4">
            <p className="text-[10px] text-slate-500 font-bold">
              Station data:{" "}
              <a
                href="https://openchargemap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-800"
              >
                Open Charge Map contributors
              </a>{" "}
              (CC BY 4.0)
            </p>
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
