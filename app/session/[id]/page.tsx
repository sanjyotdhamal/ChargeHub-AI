"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Square, ShieldCheck, MapPin } from "lucide-react";
import { stations } from "@/data/stations";
import { useApp } from "@/context/AppContext";
import { useVehicles } from "@/context/VehicleContext";
import ChargingRing from "@/components/ChargingRing";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { batteryPercent: initialBattery, setBatteryPercent, addSessionRecord, deductWalletMoney } = useApp();
  const { effectiveVehicle } = useVehicles();

  const stationId = parseInt(resolvedParams.id, 10);
  const station = stations.find((s) => s.id === stationId) || stations[0];

  const [battery, setBattery] = useState<number>(initialBattery);
  const [kwhDelivered, setKwhDelivered] = useState<number>(0.0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Price & charging speed capped by vehicle max charging power
  const currentCost = parseFloat((kwhDelivered * station.price).toFixed(2));
  const maxKwhCapacity = effectiveVehicle.batteryCapacityKwh;
  const effectiveChargingKw = Math.min(station.speedKw, effectiveVehicle.maxChargingPowerKw);
  const timeRemainingMins = Math.max(
    0,
    Math.round(((100 - battery) / 100 * maxKwhCapacity) / (effectiveChargingKw / 60))
  );

  // Simulated live charging tick interval
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      // Delivery rate simulation
      const kwhIncrement = (effectiveChargingKw / 3600) * 8; 
      setKwhDelivered((prev) => parseFloat((prev + kwhIncrement).toFixed(2)));

      setBattery((prev) => {
        if (prev >= 99) return 100;
        return parseFloat((prev + 0.25).toFixed(1));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, effectiveChargingKw]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopCharging = () => {
    setIsFinished(true);
    deductWalletMoney(currentCost);
    setBatteryPercent(Math.round(battery));

    const matchedConnector =
      station.chargers.find((c) => c.connector === effectiveVehicle.connectorType)?.connector ||
      station.chargers[0]?.connector ||
      effectiveVehicle.connectorType;

    // Record session history
    addSessionRecord({
      stationId: station.id,
      stationName: station.name,
      network: station.network,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      kwh: parseFloat(kwhDelivered.toFixed(1)),
      cost: currentCost > 0 ? currentCost : 120,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      connectorType: matchedConnector,
    });

    // Navigate to history page after small delay
    setTimeout(() => {
      router.push("/history");
    }, 800);
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col justify-between p-4 text-slate-900 select-none overflow-y-auto no-scrollbar">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7EF000] animate-ping" />
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Charging Active
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-extrabold bg-white text-slate-900 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
          <ShieldCheck size={14} className="text-slate-950" />
          <span>Unified Pay</span>
        </div>
      </div>

      {/* ── Station Name ── */}
      <div className="text-center mt-2">
        <h1 className="text-base font-black text-slate-900 truncate">{station.name}</h1>
        <p className="text-xs text-slate-500 font-extrabold flex items-center justify-center gap-1 mt-0.5">
          <MapPin size={12} className="text-slate-400" />
          {station.network} · Port {station.chargers[0]?.id || "A1"}
        </p>
      </div>

      {/* ── Animated Circular Charging Ring ── */}
      <ChargingRing batteryPercent={battery} powerKw={station.speedKw} />

      {/* ── Stats Grid matching light design ── */}
      <div className="grid grid-cols-2 gap-3 my-2">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Charging Rate
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {station.speedKw} <span className="text-xs text-slate-500 font-bold">kW</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Time Elapsed
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Energy Delivered
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {kwhDelivered.toFixed(2)} <span className="text-xs text-slate-500 font-bold">kWh</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#7EF000] rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Charging Cost
          </span>
          <div className="text-lg font-black text-slate-950 mt-0.5">
            ₹{currentCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ── Stop Charging Primary Button ── */}
      <div className="pt-2 pb-4">
        <button
          onClick={handleStopCharging}
          disabled={isFinished}
          className="w-full bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(126,240,0,0.45)] transition-all active:scale-[0.99]"
        >
          <Square size={16} className="fill-slate-950 stroke-none" />
          <span>{isFinished ? "Ending Session..." : "Stop Charging"}</span>
        </button>
      </div>
    </div>
  );
}
