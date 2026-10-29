"use client";

import React from "react";
import { History, Zap, Clock, BarChart2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function HistoryPage() {
  const { sessionHistory } = useApp();

  // Monthly summary aggregation for CSS Bar Chart
  const monthlyData = [
    { month: "Jun", amount: 680 },
    { month: "Jul", amount: 920 },
    { month: "Aug", amount: 1150 },
    { month: "Sep", amount: 1420 },
    { month: "Oct", amount: 1845 },
  ];

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount));

  const getNetworkBadge = (network: string) => {
    if (network.includes("Tata")) return "bg-teal-100 text-teal-900 border-teal-300";
    if (network.includes("Statiq")) return "bg-orange-100 text-orange-900 border-orange-300";
    if (network.includes("ChargeZone")) return "bg-blue-100 text-blue-900 border-blue-300";
    return "bg-slate-100 text-slate-900 border-slate-300";
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col p-4 text-slate-950 select-none overflow-y-auto no-scrollbar pb-28 space-y-4">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-lg font-black text-slate-950 flex items-center gap-2">
          <History size={20} className="text-slate-950" />
          Charging History
        </h1>

        <span className="text-[10px] font-black bg-[#7EF000] text-slate-950 px-2.5 py-1 rounded-full shadow-sm border border-lime-400">
          {sessionHistory.length} Sessions
        </span>
      </div>

      {/* ── Monthly Spend Bar Chart ── */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-black text-slate-950">
            <BarChart2 size={16} className="text-slate-950" />
            <span>Monthly Charging Overview</span>
          </div>
          <span className="text-[10px] text-slate-700 font-extrabold">Pune Network</span>
        </div>

        {/* Bar Chart Container */}
        <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-200">
          {monthlyData.map((item) => {
            const heightPercent = Math.round((item.amount / maxAmount) * 100);
            const isCurrentMonth = item.month === "Oct";

            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="text-[9px] font-black text-slate-700 group-hover:text-slate-950 transition-colors">
                  ₹{item.amount}
                </div>

                {/* Animated CSS Bar */}
                <div className="w-full bg-slate-100 rounded-t-lg h-24 flex items-end p-0.5 relative overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isCurrentMonth
                        ? "bg-[#7EF000] shadow-[0_4px_12px_rgba(126,240,0,0.4)] border border-lime-400"
                        : "bg-slate-300 group-hover:bg-slate-400"
                    }`}
                  />
                </div>

                <span
                  className={`text-[10px] font-black ${
                    isCurrentMonth ? "text-slate-950 bg-[#7EF000] px-1.5 rounded-md border border-lime-400" : "text-slate-700"
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sessions List ── */}
      <div className="space-y-2 pt-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 px-1">
          Recent Sessions ({sessionHistory.length})
        </h2>

        <div className="space-y-2.5">
          {sessionHistory.map((sess) => (
            <div
              key={sess.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 space-y-2 hover:border-slate-300 shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${getNetworkBadge(
                        sess.network
                      )}`}
                    >
                      {sess.network}
                    </span>
                    <span className="text-[10px] text-slate-600 font-extrabold">{sess.date}</span>
                  </div>
                  <h3 className="text-xs font-black text-slate-950">{sess.stationName}</h3>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-950">₹{sess.cost}</div>
                  <span className="text-[9px] text-slate-600 font-extrabold">
                    {sess.connectorType}
                  </span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center gap-4 text-[11px] text-slate-800 pt-2 border-t border-slate-100 font-extrabold">
                <span className="flex items-center gap-1 font-black text-slate-950">
                  <Zap size={13} className="text-slate-950 stroke-[2.5]" />
                  {sess.kwh} kWh
                </span>

                <span className="flex items-center gap-1 text-slate-700">
                  <Clock size={13} className="text-slate-700" />
                  {sess.durationMinutes} mins
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
