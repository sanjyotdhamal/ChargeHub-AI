import React from "react";

export function StationCardSkeleton() {
  return (
    <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-3.5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-200 rounded-full" />
            <div className="h-3 w-12 bg-slate-200 rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded-full shrink-0" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <div className="h-3 w-20 bg-slate-200 rounded-md" />
        <div className="h-3 w-16 bg-slate-200 rounded-md" />
      </div>
    </div>
  );
}

export function StationMapSkeleton() {
  return (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      <div className="w-12 h-12 rounded-full border-4 border-[#7EF000] border-t-transparent animate-spin mb-3 z-10" />
      <p className="text-xs font-black text-slate-600 z-10 uppercase tracking-wider">
        Loading Charging Network...
      </p>
    </div>
  );
}
