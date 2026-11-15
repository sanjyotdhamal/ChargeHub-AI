"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Zap,
  Clock,
  BarChart2,
  Calendar,
  IndianRupee,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useApp, ChargingSessionRecord } from "@/context/AppContext";

interface MonthBucket {
  key: string; // e.g. "2026-11"
  shortName: string; // e.g. "Nov"
  label: string; // e.g. "Nov 2026"
  fullName: string; // e.g. "November 2026"
  totalCost: number;
  totalKwh: number;
  totalDurationMinutes: number;
  sessions: ChargingSessionRecord[];
}

// Helper to reliably parse date string to Date object
function parseSessionDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Custom regex fallback for "DD MMM YYYY" (e.g. "14 Nov 2026")
  const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const [, day, mon, yr] = match;
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = months.findIndex((m) => m === mon.toLowerCase().slice(0, 3));
    if (monthIdx !== -1) {
      return new Date(parseInt(yr, 10), monthIdx, parseInt(day, 10));
    }
  }

  return new Date();
}

export default function HistoryPage() {
  const { sessionHistory } = useApp();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("all");

  // Group all sessions dynamically by month & year
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const bucketsMap: Record<string, MonthBucket> = {};

    sessionHistory.forEach((sess) => {
      const date = parseSessionDate(sess.date);
      const year = date.getFullYear();
      const monthNum = date.getMonth(); // 0 to 11
      const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;

      const shortName = date.toLocaleDateString("en-US", { month: "short" });
      const label = `${shortName} ${year}`;
      const fullName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!bucketsMap[key]) {
        bucketsMap[key] = {
          key,
          shortName,
          label,
          fullName,
          totalCost: 0,
          totalKwh: 0,
          totalDurationMinutes: 0,
          sessions: [],
        };
      }

      bucketsMap[key].totalCost += sess.cost || 0;
      bucketsMap[key].totalKwh += sess.kwh || 0;
      bucketsMap[key].totalDurationMinutes += sess.durationMinutes || 0;
      bucketsMap[key].sessions.push(sess);
    });

    // Sort months descending (latest month first)
    const sortedBuckets = Object.values(bucketsMap).sort((a, b) => b.key.localeCompare(a.key));

    // For each month, also sort its sessions descending by date
    sortedBuckets.forEach((b) => {
      b.sessions.sort((s1, s2) => {
        const d1 = parseSessionDate(s1.date).getTime();
        const d2 = parseSessionDate(s2.date).getTime();
        return d2 - d1;
      });
      // Round kWh to 1 decimal place
      b.totalKwh = parseFloat(b.totalKwh.toFixed(1));
    });

    return sortedBuckets;
  }, [sessionHistory]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const spend = monthBuckets.reduce((acc, m) => acc + m.totalCost, 0);
    const kwh = monthBuckets.reduce((acc, m) => acc + m.totalKwh, 0);
    const mins = monthBuckets.reduce((acc, m) => acc + m.totalDurationMinutes, 0);
    return {
      spend,
      kwh: parseFloat(kwh.toFixed(1)),
      mins,
      sessionsCount: sessionHistory.length,
    };
  }, [monthBuckets, sessionHistory]);

  // Data for the bar chart (oldest to newest for natural left-to-right timeline)
  const chartMonths = useMemo(() => {
    return [...monthBuckets].reverse();
  }, [monthBuckets]);

  const maxChartAmount = useMemo(() => {
    const amounts = chartMonths.map((m) => m.totalCost);
    return Math.max(...amounts, 1);
  }, [chartMonths]);

  // Active filtered months to display
  const displayedBuckets = useMemo(() => {
    if (selectedMonthKey === "all") {
      return monthBuckets;
    }
    return monthBuckets.filter((m) => m.key === selectedMonthKey);
  }, [monthBuckets, selectedMonthKey]);

  const activeBucket = useMemo(() => {
    return monthBuckets.find((m) => m.key === selectedMonthKey);
  }, [monthBuckets, selectedMonthKey]);

  const getNetworkBadge = (network: string) => {
    if (network.includes("Tata")) return "bg-blue-100 text-blue-900 border-blue-300";
    if (network.includes("ChargeZone")) return "bg-teal-100 text-teal-900 border-teal-300";
    if (network.includes("Jio")) return "bg-lime-100 text-lime-900 border-lime-400";
    if (network.includes("Statiq")) return "bg-orange-100 text-orange-900 border-orange-300";
    if (network.includes("Zeon")) return "bg-purple-100 text-purple-900 border-purple-300";
    return "bg-slate-100 text-slate-900 border-slate-300";
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col p-4 text-slate-950 select-none overflow-y-auto no-scrollbar pb-28 space-y-4">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <History size={20} className="text-slate-950 stroke-[2.5]" />
            Charging History
          </h1>
          <p className="text-[11px] text-slate-600 font-bold mt-0.5">
            Month-wise spend & session logs
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black bg-[#7EF000] text-slate-950 px-2.5 py-1 rounded-full shadow-sm border border-lime-400">
            {sessionHistory.length} Sessions
          </span>
        </div>
      </div>

      {/* ── Summary Metrics Bar (All or Selected Month) ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-extrabold uppercase">
            <IndianRupee size={12} className="text-slate-700" />
            <span>{selectedMonthKey === "all" ? "Total Spend" : "Month Spend"}</span>
          </div>
          <div className="text-base font-black text-slate-950 mt-1">
            ₹{(activeBucket ? activeBucket.totalCost : overallTotals.spend).toLocaleString("en-IN")}
          </div>
          <div className="text-[9px] text-slate-500 font-bold mt-0.5">
            {activeBucket ? activeBucket.shortName : "Across all months"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-extrabold uppercase">
            <Zap size={12} className="text-lime-600 stroke-[2.5]" />
            <span>Energy (kWh)</span>
          </div>
          <div className="text-base font-black text-slate-950 mt-1">
            {activeBucket ? activeBucket.totalKwh : overallTotals.kwh}
          </div>
          <div className="text-[9px] text-slate-500 font-bold mt-0.5">
            {activeBucket ? `${activeBucket.sessions.length} sessions` : `${overallTotals.sessionsCount} sessions`}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-extrabold uppercase">
            <Clock size={12} className="text-slate-700" />
            <span>Duration</span>
          </div>
          <div className="text-base font-black text-slate-950 mt-1">
            {Math.round((activeBucket ? activeBucket.totalDurationMinutes : overallTotals.mins) / 60)} hrs
          </div>
          <div className="text-[9px] text-slate-500 font-bold mt-0.5">
            {(activeBucket ? activeBucket.totalDurationMinutes : overallTotals.mins) % 60} mins added
          </div>
        </div>
      </div>

      {/* ── Monthly Spend Interactive Bar Chart ── */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-black text-slate-950">
            <BarChart2 size={16} className="text-slate-950" />
            <span>Monthly Spend Overview</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">
            Tap a month to filter
          </span>
        </div>

        {/* Dynamic Chart Container */}
        {chartMonths.length > 0 ? (
          <div className="h-36 flex items-end justify-between gap-2.5 pt-4 px-1 border-b border-slate-200 pb-2">
            {chartMonths.map((item) => {
              const heightPercent = Math.max(12, Math.round((item.totalCost / maxChartAmount) * 100));
              const isSelected = selectedMonthKey === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedMonthKey(isSelected ? "all" : item.key)}
                  className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                  title={`${item.fullName}: ₹${item.totalCost}`}
                >
                  {/* Amount label */}
                  <div
                    className={`text-[9px] font-black transition-colors ${
                      isSelected ? "text-slate-950 font-black" : "text-slate-600 group-hover:text-slate-950"
                    }`}
                  >
                    ₹{item.totalCost}
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full bg-slate-100 rounded-t-lg h-24 flex items-end p-0.5 relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isSelected
                          ? "bg-[#7EF000] shadow-[0_4px_12px_rgba(126,240,0,0.5)] border border-lime-400"
                          : "bg-slate-300 group-hover:bg-slate-400"
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                      isSelected
                        ? "bg-[#7EF000] text-slate-950 border border-lime-400 shadow-xs"
                        : "text-slate-600 group-hover:text-slate-950"
                    }`}
                  >
                    {item.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 font-bold">
            No charging data recorded yet.
          </div>
        )}

        {/* Selected Month Status & Reset */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="font-bold text-slate-600">
            {selectedMonthKey === "all" ? (
              <span className="flex items-center gap-1 text-slate-700">
                <Layers size={13} /> Showing All Months ({monthBuckets.length})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-950 font-black">
                <Sparkles size={13} className="text-lime-600" /> Filtered to {activeBucket?.fullName}
              </span>
            )}
          </span>

          {selectedMonthKey !== "all" && (
            <button
              onClick={() => setSelectedMonthKey("all")}
              className="text-[10px] font-black text-slate-900 underline hover:text-black cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>
      </div>

      {/* ── Month Selection Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedMonthKey("all")}
          className={`shrink-0 text-[11px] font-black px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            selectedMonthKey === "all"
              ? "bg-[#0F172A] text-[#7EF000] border-slate-900 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
        >
          All Months ({sessionHistory.length})
        </button>

        {monthBuckets.map((bucket) => {
          const isSelected = selectedMonthKey === bucket.key;
          return (
            <button
              key={bucket.key}
              onClick={() => setSelectedMonthKey(isSelected ? "all" : bucket.key)}
              className={`shrink-0 text-[11px] font-black px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#0F172A] text-[#7EF000] border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span>{bucket.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-[#7EF000] text-slate-950 font-black" : "bg-slate-100 text-slate-600"
                }`}
              >
                ₹{bucket.totalCost}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Month-Wise Grouped Session List ── */}
      <div className="space-y-4 pt-1">
        {displayedBuckets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-2">
            <History size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-black text-slate-900">No Sessions Found</h3>
            <p className="text-xs text-slate-500">
              No charging sessions recorded for the selected filter.
            </p>
          </div>
        ) : (
          displayedBuckets.map((bucket) => (
            <div key={bucket.key} className="space-y-2.5">
              {/* ── Month Section Header Card ── */}
              <div className="bg-[#0F172A] text-white rounded-2xl p-3 flex items-center justify-between shadow-xs border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#7EF000]">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wide text-white">
                      {bucket.fullName}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {bucket.sessions.length} charging session{bucket.sessions.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-[#7EF000]">
                      ₹{bucket.totalCost.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                      {bucket.totalKwh} kWh delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Sessions in this Month ── */}
              <div className="space-y-2.5 pl-1">
                {bucket.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 space-y-2.5 hover:border-slate-300 shadow-sm transition-all"
                  >
                    {/* Header: Network badge + Date + Cost */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getNetworkBadge(
                              sess.network
                            )}`}
                          >
                            {sess.network}
                          </span>
                          <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {sess.date}
                          </span>
                        </div>
                        <h3 className="text-xs font-black text-slate-950 leading-tight">
                          {sess.stationName}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-950">
                          ₹{sess.cost}
                        </div>
                        <span className="text-[9px] text-slate-600 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {sess.connectorType}
                        </span>
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-800 pt-2 border-t border-slate-100 font-extrabold">
                      <span className="flex items-center gap-1 font-black text-slate-950">
                        <Zap size={13} className="text-lime-600 stroke-[2.5]" />
                        {sess.kwh} kWh
                      </span>

                      <span className="flex items-center gap-1 text-slate-700">
                        <Clock size={13} className="text-slate-500" />
                        {sess.durationMinutes} mins
                      </span>

                      <span className="text-[10px] text-slate-500 font-bold">
                        ₹{(sess.cost / Math.max(1, sess.kwh)).toFixed(1)}/kWh
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
