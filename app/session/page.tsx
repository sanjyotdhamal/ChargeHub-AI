"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Square,
  ShieldCheck,
  MapPin,
  Clock,
  BatteryCharging,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useApp,
  computeActiveSessionProgress,
  SECONDS_PER_PERCENT,
} from "@/context/AppContext";
import ChargingRing from "@/components/ChargingRing";

export default function SessionPage() {
  const router = useRouter();
  const {
    activeSession,
    stopChargingSession,
    sessionJustCompleted,
    clearSessionJustCompleted,
    walletBalance,
  } = useApp();

  // Redirect to /home if /session is opened with no active session and no completed summary
  useEffect(() => {
    if (!activeSession && !sessionJustCompleted) {
      router.replace("/home");
    }
  }, [activeSession, sessionJustCompleted, router]);

  // Live 300ms smooth ticker
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 300);
    return () => clearInterval(interval);
  }, [activeSession]);

  const [isStopping, setIsStopping] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If session just ended, show clean receipt/completion view
  if (sessionJustCompleted) {
    const isCompleted = sessionJustCompleted.reason === "completed";
    const isWalletDepleted = sessionJustCompleted.reason === "wallet_depleted";

    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col justify-between p-5 text-slate-900 select-none overflow-y-auto no-scrollbar">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full my-auto py-6"
        >
          {/* Status Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                isCompleted
                  ? "bg-[#7EF000] text-slate-950 shadow-[0_0_24px_rgba(126,240,0,0.5)] border-2 border-lime-400"
                  : isWalletDepleted
                  ? "bg-amber-100 text-amber-700 border-2 border-amber-300"
                  : "bg-slate-950 text-[#7EF000] shadow-md border border-slate-800"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 size={34} className="stroke-[2.5]" />
              ) : isWalletDepleted ? (
                <AlertTriangle size={32} className="stroke-[2.5]" />
              ) : (
                <Zap size={32} className="fill-[#7EF000] stroke-none" />
              )}
            </div>

            <h1 className="text-xl font-black text-slate-950 tracking-tight">
              {isCompleted
                ? "Charging Complete!"
                : isWalletDepleted
                ? "Session Stopped: Wallet Low"
                : "Charging Session Ended"}
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 max-w-[280px]">
              {isCompleted
                ? "Battery reached 100%. Connector unlocked and ready to unplug."
                : isWalletDepleted
                ? "Your wallet balance reached ₹0.00. Charging automatically halted to avoid overdraft."
                : "Session stopped. Payment deducted once from wallet."}
            </p>
          </div>

          {/* Session Summary Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Station
              </span>
              <span className="text-xs font-black text-slate-900 truncate max-w-[190px]">
                {sessionJustCompleted.sessionRecord.stationName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Energy
                </span>
                <span className="text-sm font-black text-slate-900">
                  {sessionJustCompleted.sessionRecord.kwh}{" "}
                  <span className="text-[10px] text-slate-500 font-bold">kWh</span>
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Duration
                </span>
                <span className="text-sm font-black text-slate-900">
                  {sessionJustCompleted.sessionRecord.durationMinutes}{" "}
                  <span className="text-[10px] text-slate-500 font-bold">min</span>
                </span>
              </div>

              <div className="bg-lime-50 border border-lime-200 rounded-xl p-2.5">
                <span className="text-[10px] font-black text-lime-800 uppercase tracking-wider block">
                  Total Cost
                </span>
                <span className="text-sm font-black text-slate-950">
                  ₹{sessionJustCompleted.sessionRecord.cost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Wallet size={13} className="text-slate-400" /> Wallet Balance
              </span>
              <span className="font-black text-slate-900">₹{walletBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {isWalletDepleted && (
              <button
                onClick={() => {
                  clearSessionJustCompleted();
                  router.push("/wallet");
                }}
                className="w-full bg-[#7EF000] hover:bg-[#72db00] text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(126,240,0,0.4)] transition-all cursor-pointer"
              >
                <Wallet size={15} />
                <span>Top Up Wallet</span>
              </button>
            )}

            <button
              onClick={() => {
                clearSessionJustCompleted();
                router.push("/history");
              }}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>View Session in History</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => {
                clearSessionJustCompleted();
                router.push("/discover");
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Back to Map
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="w-full h-full bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#7EF000] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Connecting to session...
        </p>
      </div>
    );
  }

  // Compute live progress from timestamp
  const progress = computeActiveSessionProgress(activeSession, now, walletBalance);

  const handleStop = () => {
    setIsStopping(true);
    stopChargingSession("user_stopped");
  };

  const powerRateKw = activeSession.speedKw || 60;
  const remainingCostWallet = Math.max(0, walletBalance - progress.cost);

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

        <div className="flex items-center gap-1.5 text-[11px] font-black bg-white text-slate-900 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
          <ShieldCheck size={14} className="text-[#7EF000]" />
          <span>Unified Telemetry</span>
        </div>
      </div>

      {/* ── Station Name & Port ── */}
      <div className="text-center mt-2 px-2">
        <h1 className="text-base font-black text-slate-900 truncate">
          {activeSession.stationName}
        </h1>
        <p className="text-xs text-slate-500 font-extrabold flex items-center justify-center gap-1 mt-0.5">
          <MapPin size={12} className="text-slate-400" />
          {activeSession.network || "Smart EV Hub"} · ₹{activeSession.pricePerKwh}/kWh
        </p>
      </div>

      {/* ── Animated Circular Charging Ring (smooth live battery) ── */}
      <ChargingRing
        batteryPercent={progress.currentBattery}
        powerKw={powerRateKw}
      />

      {/* ── Realistic Smooth Stats Grid (updated every ~300ms) ── */}
      <div className="grid grid-cols-2 gap-2.5 my-1">
        {/* Card 1: Rate & Time to 100% */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Zap size={11} className="text-slate-400" /> Charging Rate
          </span>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900 leading-tight">
              {powerRateKw} <span className="text-xs text-slate-500 font-bold">kW</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              ETA to 100%: ~{formatTime(progress.remainingSeconds)}
            </p>
          </div>
        </div>

        {/* Card 2: Time Elapsed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Clock size={11} className="text-slate-400" /> Time Elapsed
          </span>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900 leading-tight font-mono">
              {formatTime(progress.elapsedSeconds)}
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              +1% / {SECONDS_PER_PERCENT}s
            </p>
          </div>
        </div>

        {/* Card 3: Energy Delivered */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <BatteryCharging size={11} className="text-slate-400" /> Energy Added
          </span>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900 leading-tight">
              {progress.kwhDelivered.toFixed(2)}{" "}
              <span className="text-xs text-slate-500 font-bold">kWh</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              +{progress.addedPercent.toFixed(1)}% gained
            </p>
          </div>
        </div>

        {/* Card 4: Live Cost */}
        <div className="bg-white border-2 border-[#7EF000] rounded-2xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Wallet size={11} className="text-slate-400" /> Current Cost
          </span>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-950 leading-tight">
              ₹{progress.cost.toFixed(2)}
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              Bal: ₹{remainingCostWallet.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stop Charging Primary Button ── */}
      <div className="pt-2 pb-3">
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="w-full bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(126,240,0,0.45)] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
        >
          <Square size={16} className="fill-slate-950 stroke-none" />
          <span>{isStopping ? "Finalizing Session..." : "Stop Charging"}</span>
        </button>
      </div>
    </div>
  );
}
