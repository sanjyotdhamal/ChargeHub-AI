"use client";

import React, { useEffect, useState } from "react";
import DiscoverPage from "./discover/page";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

// ─── Timing constants (all in ms / seconds) ───────────────────────────────
const ANIMATION_DURATION_S = 3.0;   // Car + progress bar travel time
const HOLD_AFTER_DONE_MS   = 400;   // Brief pause once car reaches end
const TOTAL_SPLASH_MS      = ANIMATION_DURATION_S * 1000 + HOLD_AFTER_DONE_MS; // 3400ms
const EXIT_FADE_S          = 0.5;   // Fade-out duration

export default function RootPage() {
  const router                      = useRouter();
  const { setIsSplashActive }       = useApp();
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [mounted, setMounted]       = useState<boolean>(false);
  const [exiting, setExiting]       = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const played = sessionStorage.getItem("ch_intro_played");
      if (!played) {
        setShowSplash(true);
        setIsSplashActive(true);

        // Step 1: after car finishes + hold, trigger exit fade
        const exitTimer = setTimeout(() => {
          setExiting(true);
        }, TOTAL_SPLASH_MS);

        // Step 2: after fade completes, unmount splash
        const doneTimer = setTimeout(() => {
          try { sessionStorage.setItem("ch_intro_played", "true"); } catch {}
          setShowSplash(false);
          setIsSplashActive(false);
          setExiting(false);
          router.replace("/discover");
        }, TOTAL_SPLASH_MS + EXIT_FADE_S * 1000);

        return () => {
          clearTimeout(exitTimer);
          clearTimeout(doneTimer);
        };
      } else {
        setIsSplashActive(false);
        router.replace("/discover");
      }
    } catch {
      setIsSplashActive(false);
      router.replace("/discover");
    }
  }, [router, setIsSplashActive]);

  const dismissSplash = () => {
    try { sessionStorage.setItem("ch_intro_played", "true"); } catch {}
    setExiting(true);
    setTimeout(() => {
      setShowSplash(false);
      setIsSplashActive(false);
      setExiting(false);
      router.replace("/discover");
    }, EXIT_FADE_S * 1000);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F4F6F9] overflow-hidden">
      {/* Main app always mounted underneath — zero white screen */}
      <DiscoverPage />

      {/* ── First-launch Splash Intro ── */}
      <AnimatePresence>
        {mounted && showSplash && (
          <motion.div
            key="intro-splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: EXIT_FADE_S, ease: "easeInOut" }}
            onClick={dismissSplash}
            className="absolute inset-0 z-50 bg-[#F4F6F9] flex flex-col items-center justify-between p-8 select-none text-slate-950 cursor-pointer"
          >
            {/* Ambient Lime Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7EF000]/30 rounded-full blur-3xl pointer-events-none" />

            {/* Skip Button */}
            <div className="w-full flex justify-end z-10">
              <button
                onClick={(e) => { e.stopPropagation(); dismissSplash(); }}
                className="text-[11px] font-black text-slate-700 hover:text-slate-950 bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
              >
                <span>Skip</span>
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </div>

            {/* Branding Center */}
            <div className="flex flex-col items-center text-center z-10 space-y-5">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 rounded-3xl bg-[#7EF000] text-slate-950 flex items-center justify-center shadow-[0_0_48px_rgba(126,240,0,0.55)] border-2 border-lime-400"
              >
                <Zap size={40} className="fill-slate-950 stroke-none" />
              </motion.div>

              {/* App Name */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55, ease: "easeOut" }}
              >
                <h1 className="text-3xl font-black text-slate-950 tracking-tight">
                  ChargeHub{" "}
                  <span className="bg-[#7EF000] text-slate-950 px-1.5 py-0.5 rounded-xl border border-lime-400">
                    AI
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-extrabold tracking-wide mt-2">
                  Unified Smart EV Charging Network · Maharashtra
                </p>
              </motion.div>

              {/* Tag chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="flex items-center gap-2 flex-wrap justify-center"
              >
                {["Tata Power", "Statiq", "ChargeZone", "Jio-bp"].map((n) => (
                  <span
                    key={n}
                    className="text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm"
                  >
                    {n}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── Driving EV Road Animation ── */}
            <div className="w-full relative z-10 space-y-3">
              {/* Status text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-center text-[11px] font-black text-slate-500 uppercase tracking-widest"
              >
                Loading EV Network…
              </motion.p>

              {/* Road track */}
              <div className="w-full relative py-5">
                {/* Road */}
                <div className="w-full h-2 bg-slate-200 rounded-full relative overflow-visible shadow-inner">
                  {/* Progress fill */}
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: ANIMATION_DURATION_S, ease: "easeInOut" }}
                    className="h-full bg-[#7EF000] rounded-full shadow-[0_0_12px_rgba(126,240,0,0.7)]"
                  />
                </div>

                {/* EV Car driving along the track */}
                <motion.div
                  initial={{ x: "-5%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: ANIMATION_DURATION_S, ease: "easeInOut" }}
                  className="absolute top-0 left-0 -translate-y-1/2 mt-1"
                  style={{ translateY: "-50%" }}
                >
                  <div className="relative drop-shadow-md">
                    {/* EV Car SVG */}
                    <svg width="52" height="30" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Body */}
                      <path
                        d="M6 17 C6 17, 11 9, 20 8 C27 7, 33 8, 39 13 L44 14 C46 14.5, 47 16, 47 17.5 L47 20 C47 21, 46 21, 46 21 L43 21 C43 18, 39 18, 39 21 L15 21 C15 18, 11 18, 11 21 L3 21 C2 21, 2 19, 3 18 Z"
                        fill="#0F172A"
                      />
                      {/* Window */}
                      <path
                        d="M21 9.5 C21 9.5, 23 9, 28 9 C33 9, 36 11, 37 13 L22 13 Z"
                        fill="#7EF000"
                        opacity="0.85"
                      />
                      {/* Rear wheel */}
                      <circle cx="14" cy="21" r="4" fill="#1E293B" stroke="#7EF000" strokeWidth="1.5" />
                      <circle cx="14" cy="21" r="1.5" fill="#7EF000" />
                      {/* Front wheel */}
                      <circle cx="41" cy="21" r="4" fill="#1E293B" stroke="#7EF000" strokeWidth="1.5" />
                      <circle cx="41" cy="21" r="1.5" fill="#7EF000" />
                      {/* Headlight */}
                      <circle cx="46.5" cy="16" r="1.2" fill="#FDE68A" />
                      {/* Charging bolt on body */}
                      <path d="M26 12 L24 15 L26.5 15 L24.5 19 L28 14.5 L25.5 14.5 Z" fill="#7EF000" />
                    </svg>

                    {/* Speed motion lines behind car */}
                    <motion.div
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                      className="absolute top-1/2 -left-5 -translate-y-1/2 flex flex-col gap-0.5"
                    >
                      <div className="w-4 h-0.5 bg-slate-400 rounded-full" />
                      <div className="w-3 h-0.5 bg-slate-300 rounded-full" />
                      <div className="w-5 h-0.5 bg-slate-400 rounded-full" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Road dashes */}
                <div className="w-full flex justify-around mt-1 px-2 overflow-hidden">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 + 0.2 }}
                      className="w-6 h-0.5 bg-slate-300 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Bottom tagline */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-center text-[10px] font-extrabold text-slate-400 tracking-wide"
              >
                Tap anywhere to skip
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}