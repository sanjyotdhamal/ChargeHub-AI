"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, AlertCircle, ArrowRight } from "lucide-react";
import { useStations } from "@/context/StationsContext";
import { useApp } from "@/context/AppContext";
import { useVehicles } from "@/context/VehicleContext";
import { Station } from "@/types/station";

export default function SessionDynamicPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const stationId = resolvedParams.id;

  const { activeSession, startChargingSession } = useApp();
  const { effectiveVehicle } = useVehicles();
  const { getStationById, stations, loading: contextLoading } = useStations();

  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    // If active session already exists for THIS station, immediately redirect to /session
    if (activeSession && String(activeSession.stationId) === String(stationId)) {
      router.replace("/session");
      return;
    }

    // If active session already exists for a DIFFERENT station, flag conflict
    if (activeSession && String(activeSession.stationId) !== String(stationId)) {
      setConflictError(`Charging already in progress at ${activeSession.stationName}`);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function initializeAndStart() {
      setLoading(true);
      const found = await getStationById(stationId);
      if (isCancelled) return;

      const targetStation = found || (stations.length > 0 ? stations[0] : null);
      if (targetStation) {
        setStation(targetStation);
        const res = startChargingSession({
          stationId: targetStation.id,
          stationName: targetStation.name,
          network: targetStation.network,
          speedKw: targetStation.speedKw,
          pricePerKwh: targetStation.price ?? 15,
          connectorType: effectiveVehicle.connectorType,
        });

        if (res.success) {
          router.replace("/session");
        } else {
          setConflictError(res.error || "Charging already in progress");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    if (stationId) {
      initializeAndStart();
    } else {
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [stationId, activeSession, getStationById, stations, startChargingSession, effectiveVehicle, router]);

  if (conflictError && activeSession) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 border-2 border-amber-300 shadow-sm">
          <Zap size={28} className="fill-amber-600 stroke-none" />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-1">Charging Already in Progress</h2>
        <p className="text-xs text-slate-500 mb-4 max-w-xs">
          You currently have an active charging session at{" "}
          <strong className="text-slate-900">{activeSession.stationName}</strong>. ChargeHub AI allows
          one active session at a time.
        </p>
        <button
          onClick={() => router.push("/session")}
          className="bg-[#7EF000] text-slate-950 px-5 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer hover:bg-[#72db00] transition-colors"
        >
          <span>Open Active Session</span>
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => router.back()}
          className="mt-3 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading || contextLoading) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-9 h-9 rounded-full border-3 border-[#7EF000] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
          Connecting to Charger...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle size={40} className="text-red-500 mb-2" />
      <h2 className="text-lg font-black text-slate-900 mb-1">Session Error</h2>
      <p className="text-xs text-slate-500 mb-4">Could not load station details for charging session.</p>
      <button
        onClick={() => router.push("/discover")}
        className="bg-[#7EF000] text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm"
      >
        Return to Map
      </button>
    </div>
  );
}
