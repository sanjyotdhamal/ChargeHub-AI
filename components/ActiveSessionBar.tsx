"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, Clock } from "lucide-react";
import { useApp, computeActiveSessionProgress } from "@/context/AppContext";

export default function ActiveSessionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeSession, walletBalance, isSplashActive } = useApp();

  // High-frequency live ticker (every 300ms) for smooth real-time numbers
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 300);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Hide rules:
  // Shown on Home/Explore, Discover, Station detail, Wallet, History, Profile.
  // Hidden on /session, splash, login, and signup.
  const isHidden =
    !activeSession ||
    isSplashActive ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname?.startsWith("/session");

  if (isHidden || !activeSession) {
    return null;
  }

  const progress = computeActiveSessionProgress(activeSession, now, walletBalance);

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute top-2 left-0 right-0 px-3 z-50 pointer-events-none flex justify-center">
      <AnimatePresence>
        <motion.div
          key="active-session-top-pill"
          initial={{ y: -35, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -35, opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          onClick={() => router.push("/session")}
          className="pointer-events-auto w-full max-w-[398px] bg-slate-950/95 backdrop-blur-xl border-2 border-lime-400/60 text-white rounded-2xl p-2.5 px-3.5 flex items-center justify-between shadow-[0_14px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(126,240,0,0.25)] cursor-pointer active:scale-[0.98] transition-transform select-none"
        >
          {/* Left: Pulsing Lightning Icon & Station Details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(126,240,0,0.7)]"
            >
              <Zap size={16} className="fill-slate-950 stroke-none" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7EF000]">
                  Charging in Progress
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-0.5 font-mono">
                  <Clock size={10} className="text-slate-400" />
                  {formatElapsed(progress.elapsedSeconds)}
                </span>
              </div>
              <p className="text-xs font-black text-white truncate leading-tight mt-0.5">
                {activeSession.stationName}
              </p>
            </div>
          </div>

          {/* Right: Live Battery %, Live Cost, and Chevron */}
          <div className="flex items-center gap-2.5 shrink-0 pl-2.5 border-l border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-[#7EF000] tracking-tight">
                {Math.round(progress.currentBattery)}%
              </span>
              <span className="text-[11px] font-black text-slate-100 font-mono">
                ₹{progress.cost.toFixed(2)}
              </span>
            </div>

            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
              <ChevronRight size={13} className="stroke-[3]" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
