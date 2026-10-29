"use client";

import React, { useState } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function WalletPage() {
  const { walletBalance, addWalletMoney, transactions } = useApp();
  const [selectedPayment, setSelectedPayment] = useState<string>("mastercard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddMoney = (amount: number) => {
    addWalletMoney(amount);
    setToastMessage(`₹${amount} added successfully to your Unified EV Wallet!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const paymentMethods = [
    { id: "mastercard", name: "Mastercard", last4: "8435", icon: "💳" },
    { id: "visa", name: "Visa Card", last4: "4594", icon: "💳" },
    { id: "paypal", name: "PayPal", last4: "0528", icon: "🅿️" },
    { id: "gpay", name: "Google Pay", last4: "GPay", icon: "🟢" },
  ];

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col p-4 text-slate-950 select-none overflow-y-auto no-scrollbar pb-28 space-y-4">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-lg font-black text-slate-950 flex items-center gap-2">
          <Wallet size={22} className="text-slate-950" />
          Wallet & Payment
        </h1>

        <div className="flex items-center gap-1 text-[11px] font-black bg-[#7EF000] text-slate-950 px-3 py-1 rounded-full shadow-sm border border-lime-400">
          <ShieldCheck size={13} className="text-slate-950" />
          <span>All Networks</span>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="bg-[#7EF000] text-slate-950 px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md animate-in fade-in">
          <Check size={16} className="shrink-0 text-slate-950" />
          <span className="text-slate-950">{toastMessage}</span>
        </div>
      )}

      {/* ── Balance Card ── */}
      <div className="w-full bg-white text-slate-950 border-2 border-[#7EF000] rounded-2xl p-4 shadow-[0_8px_24px_rgba(126,240,0,0.12)] relative">
        {/* Decorative glow */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#7EF000]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Balance</span>
          <div className="w-7 h-7 rounded-xl bg-[#7EF000] text-slate-950 flex items-center justify-center shadow-sm border border-lime-400">
            <Wallet size={14} strokeWidth={2.5} />
          </div>
        </div>

        {/* Balance amount */}
        <div className="relative z-10 mb-3">
          <div className="text-3xl font-black text-slate-950 tracking-tight leading-none">
            ₹{walletBalance.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-[#5BB800] font-extrabold mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7EF000] animate-pulse inline-block" />
            Funds ready · Accepted at all networks
          </p>
        </div>

        {/* Network chips */}
        <div className="relative z-10 bg-[#F4F6F9] rounded-xl p-2.5 border border-slate-200 flex flex-col gap-1">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-wide">ChargeHub Pay — Unified EV Wallet</p>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] bg-teal-100 text-teal-900 border border-teal-300 px-1.5 py-0.5 rounded-full font-black">Tata Power</span>
            <span className="text-[9px] bg-orange-100 text-orange-900 border border-orange-300 px-1.5 py-0.5 rounded-full font-black">Statiq</span>
            <span className="text-[9px] bg-blue-100 text-blue-900 border border-blue-300 px-1.5 py-0.5 rounded-full font-black">ChargeZone</span>
            <span className="text-[9px] bg-green-100 text-green-900 border border-green-300 px-1.5 py-0.5 rounded-full font-black">Jio-bp</span>
          </div>
        </div>
      </div>

      {/* ── Quick Add Money Section ── */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 px-1">
          Quick Wallet Top-Up
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {[500, 1000, 2000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleAddMoney(amount)}
              className="bg-white hover:bg-slate-50 border-2 border-[#7EF000] text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-1 text-xs shadow-sm transition-all active:scale-95"
            >
              <Plus size={15} className="text-slate-950 stroke-[3]" />
              <span className="text-slate-950 font-black">₹{amount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Payment Method Selector ── */}
      <div className="space-y-2 pt-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 px-1">
          Select Payment Method
        </h2>

        <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-2 shadow-sm">
          {paymentMethods.map((method) => {
            const isSelected = selectedPayment === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#7EF000]/15 border-[#7EF000] shadow-sm"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{method.icon}</span>
                  <div>
                    <div className="text-xs font-black text-slate-950">{method.name}</div>
                    <div className="text-[10px] text-slate-600 font-extrabold">
                      •••• •••• {method.last4}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-slate-950 bg-slate-950" : "border-slate-400"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#7EF000]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Transaction History (High Contrast Text) ── */}
      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 px-1">
          Recent Transactions ({transactions.length})
        </h2>

        <div className="space-y-2">
          {transactions.map((tx) => {
            const isTopup = tx.type === "topup";
            return (
              <div
                key={tx.id}
                className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl border ${
                      isTopup
                        ? "bg-[#7EF000] border-lime-400 text-slate-950"
                        : "bg-slate-100 border-slate-300 text-slate-950"
                    }`}
                  >
                    {isTopup ? <ArrowDownLeft size={16} strokeWidth={2.5} /> : <ArrowUpRight size={16} strokeWidth={2.5} />}
                  </div>

                  <div>
                    {/* Dark Crisp Title */}
                    <div className="text-xs font-black text-slate-950">
                      {isTopup ? "Wallet Top Up" : tx.stationName || "EV Charging"}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.network && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                          {tx.network}
                        </span>
                      )}
                      {/* Dark Crisp Date Subtext */}
                      <span className="text-[10px] text-slate-600 font-extrabold">{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Dark Crisp Amount */}
                <div
                  className={`text-xs font-black ${
                    isTopup ? "text-emerald-700 font-black text-sm" : "text-slate-950 font-black text-sm"
                  }`}
                >
                  {isTopup ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
