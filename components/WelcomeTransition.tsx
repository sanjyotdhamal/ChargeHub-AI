"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Check } from "lucide-react";
import { isValidRedirect } from "@/lib/redirect";

interface WelcomeTransitionProps {
  name: string;
  nextUrl?: string | null;
}

export default function WelcomeTransition({ name, nextUrl }: WelcomeTransitionProps) {
  const router = useRouter();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [plugConnected, setPlugConnected] = useState(false);
  const firstName = name.trim().split(" ")[0] || "Driver";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
    }
  }, []);

  useEffect(() => {
    const target = isValidRedirect(nextUrl) ? (nextUrl as string) : "/home";

    if (reducedMotion) {
      const timer = setTimeout(() => {
        router.replace(target);
      }, 700);
      return () => clearTimeout(timer);
    }

    // Plug connects at 700ms
    const plugTimer = setTimeout(() => {
      setPlugConnected(true);
    }, 700);

    // Complete transition and navigate at 2200ms
    const navTimer = setTimeout(() => {
      router.replace(target);
    }, 2250);

    return () => {
      clearTimeout(plugTimer);
      clearTimeout(navTimer);
    };
  }, [reducedMotion, router, nextUrl]);

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 z-50 bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-[#7EF000] flex items-center justify-center shadow-lg border-2 border-lime-400 mb-4">
          <Zap size={32} className="fill-slate-950 stroke-none" />
        </div>
        <h2 className="text-2xl font-black text-slate-950">Welcome, {firstName}!</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">Opening ChargeHub AI…</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#F4F6F9] flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7EF000]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 z-10"
      >
        <span className="w-2 h-2 rounded-full bg-[#7EF000] animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          Connected · Authenticated
        </span>
      </motion.div>

      {/* Center Stage: Car + Charging Animation + Battery Ring */}
      <div className="flex flex-col items-center justify-center z-10 w-full space-y-6">
        {/* Animated Battery Circle */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            {/* Progress Fill */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#7EF000"
              strokeWidth="7"
              strokeDasharray="264"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Icon & Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: plugConnected ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className="w-12 h-12 rounded-full bg-[#0F172A] text-[#7EF000] flex items-center justify-center shadow-md mb-1"
            >
              {plugConnected ? (
                <Check size={24} className="stroke-[3] text-[#7EF000]" />
              ) : (
                <Zap size={22} className="fill-[#7EF000] stroke-none" />
              )}
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[12px] font-black text-slate-900 tracking-tight"
            >
              100% Ready
            </motion.span>
          </div>
        </div>

        {/* EV Car & Charging Plug Slide-in */}
        <div className="relative w-full max-w-[280px] h-20 flex items-center justify-center">
          {/* EV Car */}
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.3, 0.64, 1] }}
            className="relative"
          >
            <svg width="78" height="42" viewBox="0 0 52 28" fill="none">
              <path
                d="M6 17 C6 17, 11 9, 20 8 C27 7, 33 8, 39 13 L44 14 C46 14.5, 47 16, 47 17.5 L47 20 C47 21, 46 21, 46 21 L43 21 C43 18, 39 18, 39 21 L15 21 C15 18, 11 18, 11 21 L3 21 C2 21, 2 19, 3 18 Z"
                fill="#0F172A"
              />
              <path
                d="M21 9.5 C21 9.5, 23 9, 28 9 C33 9, 36 11, 37 13 L22 13 Z"
                fill="#7EF000"
                opacity="0.9"
              />
              <circle cx="14" cy="21" r="4.2" fill="#1E293B" stroke="#7EF000" strokeWidth="1.8" />
              <circle cx="14" cy="21" r="1.8" fill="#7EF000" />
              <circle cx="41" cy="21" r="4.2" fill="#1E293B" stroke="#7EF000" strokeWidth="1.8" />
              <circle cx="41" cy="21" r="1.8" fill="#7EF000" />
              <circle cx="46.5" cy="16" r="1.2" fill="#FDE68A" />
              {/* Charge port */}
              <circle cx="9" cy="15" r="2" fill="#7EF000" />
            </svg>
          </motion.div>

          {/* Charging Plug Connection */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: plugConnected ? -38 : -50, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
          >
            <div className="flex items-center">
              <div className="w-5 h-2 bg-slate-700 rounded-l" />
              <div className="w-2 h-3 bg-[#7EF000] rounded-r shadow-[0_0_8px_#7EF000]" />
            </div>
          </motion.div>
        </div>

        {/* Personalized Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center space-y-1"
        >
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            Welcome, {firstName}!
          </h2>
          <p className="text-xs font-bold text-slate-500">
            Initializing your charging network…
          </p>
        </motion.div>
      </div>

      {/* Bottom Loading Progress Indicator */}
      <div className="w-full max-w-[200px] z-10">
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.1, ease: "linear" }}
            className="h-full bg-[#7EF000]"
          />
        </div>
      </div>
    </div>
  );
}
