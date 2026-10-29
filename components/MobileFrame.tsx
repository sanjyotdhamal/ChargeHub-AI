"use client";

import React from "react";
import BottomTabBar from "./BottomTabBar";
import ErrorBoundary from "./ErrorBoundary";

export default function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-white md:bg-[#F8FAFC] flex items-center justify-center font-sans antialiased select-none text-slate-950 overflow-hidden p-0 md:py-6 md:px-4">
      {/* ── iPhone 16 Pro Max Chassis Container ── */}
      <div className="relative w-full max-w-[430px] h-screen md:h-[915px] md:max-h-[96vh] bg-[#F4F6F9] flex flex-col overflow-hidden md:rounded-[54px] md:border-[10px] md:border-[#0F172A] md:shadow-[0_25px_70px_rgba(15,23,42,0.16),0_0_0_1px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/10">
        
        {/* ── Hardware Buttons (Desktop Frame View) ── */}
        {/* Left Side: Action Button */}
        <div className="hidden md:block absolute -left-[14px] top-[100px] w-[4px] h-[28px] bg-[#1E293B] rounded-l-sm shadow-sm" />
        {/* Left Side: Volume Up */}
        <div className="hidden md:block absolute -left-[14px] top-[145px] w-[4px] h-[52px] bg-[#1E293B] rounded-l-sm shadow-sm" />
        {/* Left Side: Volume Down */}
        <div className="hidden md:block absolute -left-[14px] top-[210px] w-[4px] h-[52px] bg-[#1E293B] rounded-l-sm shadow-sm" />
        {/* Right Side: Power Button */}
        <div className="hidden md:block absolute -right-[14px] top-[165px] w-[4px] h-[75px] bg-[#1E293B] rounded-r-sm shadow-sm" />
        {/* Right Side: Camera Control Sensor */}
        <div className="hidden md:block absolute -right-[14px] top-[600px] w-[4px] h-[45px] bg-[#334155] rounded-r-sm border-l border-slate-400 shadow-sm" />

        {/* ── iPhone 16 Pro Max Dynamic Island & Status Bar ── */}
        <div className="w-full h-12 bg-[#F4F6F9] px-7 pt-3 pb-1 flex items-center justify-between z-50 shrink-0 text-[12px] font-black text-slate-950 tracking-tight relative border-b border-slate-200/50">
          {/* iOS Clock */}
          <span className="font-black text-[13px] text-slate-950 pl-1">9:41</span>

          {/* Dynamic Island Pill Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[120px] h-[32px] bg-black rounded-full flex items-center justify-between px-3 shadow-md z-50 pointer-events-none">
            {/* Camera Lens Reflection */}
            <div className="w-3 h-3 rounded-full bg-[#0a0d12] border border-[#1f242d] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#040810]" />
            </div>
            {/* Sensor Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#0d1017] border border-[#1a1f29]" />
          </div>

          {/* iOS Status Icons */}
          <div className="flex items-center gap-1.5 pr-1">
            {/* Cellular signal */}
            <svg width="15" height="11" viewBox="0 0 17 11" fill="none" className="text-slate-950">
              <rect x="0" y="8" width="2.5" height="3" rx="0.5" fill="currentColor" />
              <rect x="4.5" y="5.5" width="2.5" height="5.5" rx="0.5" fill="currentColor" />
              <rect x="9" y="3" width="2.5" height="8" rx="0.5" fill="currentColor" />
              <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-black text-slate-950 tracking-wider">5G</span>
            {/* Battery Icon */}
            <div className="w-5.5 h-2.5 rounded-[4px] border border-slate-950 p-[1.5px] flex items-center">
              <div className="w-full h-full bg-slate-950 rounded-[2px]" />
            </div>
          </div>
        </div>

        {/* ── Main App Content Screen protected by ErrorBoundary ── */}
        <div className="flex-1 relative flex flex-col overflow-hidden w-full bg-[#F4F6F9]">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>

        {/* ── Global Bottom Navigation Dock ── */}
        <BottomTabBar />

        {/* ── iOS Home Indicator Bar ── */}
        <div className="w-full bg-[#F4F6F9] py-1 flex items-center justify-center z-50 shrink-0">
          <div className="w-[130px] h-[4px] bg-slate-950 rounded-full" />
        </div>
      </div>
    </div>
  );
}
