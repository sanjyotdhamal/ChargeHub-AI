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

  // Hide rules per requirements:
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

  const isStationPage = pathname?.startsWith("/station");
  // Position above bottom docked buttons on station detail, or just above bottom tab bar on other pages
  const bottomPositionClass = isStationPage ? "bottom-[74px]" : "bottom-2";

  return (
    <div
      className={`absolute left-0 right-0 ${bottomPositionClass} px-3 z-40 pointer-events-none flex justify-center`}
    >
      <AnimatePresence>
        <motion.div
          key="active-session-pill"
          initial={{ y: 35, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 35, opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={() => router.push("/session")}
          className="pointer-events-auto w-full max-w-[394px] bg-slate-950/95 backdrop-blur-md border border-lime-400/40 text-white rounded-2xl p-2 px-3 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35),0_0_20px_rgba(126,240,0,0.18)] cursor-pointer active:scale-[0.98] transition-transform select-none"
        >
          {/* Left: Pulsing Lightning Icon & Station Name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-7 h-7 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(126,240,0,0.6)]"
            >
              <Zap size={15} className="fill-slate-950 stroke-none" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7EF000]">
                  Charging Live
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
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
          <div className="flex items-center gap-2.5 shrink-0 pl-1 border-l border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-[#7EF000] tracking-tight">
                {Math.round(progress.currentBattery)}%
              </span>
              <span className="text-[10px] font-extrabold text-slate-300">
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
