"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Car,
  Check,
  Edit3,
  CreditCard,
  BatteryCharging,
  ShieldCheck,
  Leaf,
  Bell,
  Globe,
  PhoneCall,
  LogOut,
  ChevronRight,
  Sparkles,
  Radio,
  FileText,
  AlertTriangle,
  X,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const POPULAR_VEHICLES = [
  { model: "Tata Nexon EV Max", batteryCapacityKwh: 40.5, connectorType: "CCS2", rangeKm: 437 },
  { model: "MG ZS EV", batteryCapacityKwh: 50.3, connectorType: "CCS2", rangeKm: 461 },
  { model: "Mahindra XUV400", batteryCapacityKwh: 39.4, connectorType: "CCS2", rangeKm: 456 },
  { model: "Hyundai Ioniq 5", batteryCapacityKwh: 72.6, connectorType: "CCS2", rangeKm: 631 },
  { model: "Tata Punch EV", batteryCapacityKwh: 35.0, connectorType: "CCS2", rangeKm: 421 },
  { model: "BYD Atto 3", batteryCapacityKwh: 60.5, connectorType: "CCS2", rangeKm: 521 },
];

export default function ProfilePage() {
  const { logout } = useAuth();
  const {
    userProfile,
    updateUserProfile,
    vehicleProfile,
    updateVehicleProfile,
    batteryPercent,
    setBatteryPercent,
    walletBalance,
  } = useApp();

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editCity, setEditCity] = useState(userProfile.city);
  const [editPlate, setEditPlate] = useState(userProfile.vehiclePlate);

  // GST Form State
  const [editGst, setEditGst] = useState(userProfile.gstNumber);
  const [editCompany, setEditCompany] = useState(userProfile.companyName);

  // RFID Form State
  const [newRfidNumber, setNewRfidNumber] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openEditModal = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditPhone(userProfile.phone);
    setEditCity(userProfile.city);
    setEditPlate(userProfile.vehiclePlate);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editName,
      email: editEmail,
      phone: editPhone,
      city: editCity,
      vehiclePlate: editPlate,
    });
    setShowEditProfileModal(false);
    showToast("Profile details updated successfully!");
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      gstNumber: editGst,
      companyName: editCompany,
    });
    setShowGstModal(false);
    showToast("Business GST profile updated!");
  };

  const handleSaveRfid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfidNumber.trim()) return;
    updateUserProfile({
      rfidCardNumber: newRfidNumber.toUpperCase(),
      rfidEnabled: true,
    });
    setNewRfidNumber("");
    setShowRfidModal(false);
    showToast("RFID card linked and activated!");
  };

  return (
    <div className="w-full h-full bg-[#F4F6F9] overflow-y-auto no-scrollbar p-3.5 text-slate-900 select-none pb-28 space-y-3.5">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-base font-black text-slate-950 flex items-center gap-2">
          <User size={18} className="text-slate-950 stroke-[2.5]" />
          My Profile &amp; Settings
        </h1>

        <span className="text-[10px] font-black bg-[#7EF000] text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm border border-lime-400">
          Maharashtra EV Network
        </span>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="bg-[#7EF000] text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg border border-lime-400 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Driver Identity Profile Card (Fixed & Unclipped) ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm relative">
        <div className="flex items-center justify-between gap-3">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar with verified check */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#7EF000] text-slate-950 flex items-center justify-center text-lg font-black shadow-md border-2 border-lime-400">
                {userProfile.avatarInitials || "EH"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center border-2 border-white shadow-sm">
                <Check size={11} strokeWidth={3} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-950 truncate">
                  {userProfile.name}
                </h2>
                <ShieldCheck size={16} className="text-[#7EF000] fill-slate-950 shrink-0" />
              </div>
              <p className="text-xs text-slate-600 font-extrabold mt-0.5 truncate">
                {userProfile.phone}
              </p>
              <p className="text-[11px] text-slate-500 font-bold truncate">
                {userProfile.city}, Maharashtra · {userProfile.vehiclePlate}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            id="edit-profile-btn"
            onClick={openEditModal}
            className="bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black px-3.5 py-2 rounded-xl border border-lime-400 shadow-sm flex items-center gap-1.5 text-xs shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            <Edit3 size={13} strokeWidth={2.5} />
            <span>Edit</span>
          </button>
        </div>

        {/* Member Tier & Reward Credits Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#7EF000] fill-lime-400" />
            <span className="font-black text-slate-900 text-xs">{userProfile.memberTier}</span>
          </div>

          <div className="bg-[#7EF000]/20 border border-lime-400/50 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black">
            {userProfile.rewardPoints} Green Credits
          </div>
        </div>
      </div>

      {/* ── 2. My Electric Vehicle (Garage) ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7EF000]/20 rounded-xl border border-lime-400/40 text-slate-950">
              <Car size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                My Electric Vehicle
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">Plate: {userProfile.vehiclePlate}</p>
            </div>
          </div>

          <button
            onClick={() => setShowVehicleModal(true)}
            className="text-[11px] font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <span>Switch</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-slate-950">{vehicleProfile.model}</div>
            <div className="text-xs text-slate-500 font-extrabold mt-0.5">
              {vehicleProfile.batteryCapacityKwh} kWh Battery · {vehicleProfile.connectorType} Port
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-black text-[#7EF000] bg-slate-950 px-2.5 py-1 rounded-md inline-block">
              {batteryPercent}%
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">Current SoC</div>
          </div>
        </div>

        {/* Battery Level Adjustment Slider */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 mb-1">
            <span>Simulate State of Charge</span>
            <span className="text-slate-950 font-black">{batteryPercent}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7EF000]"
          />
        </div>
      </div>

      {/* ── 3. Smart Charging & Battery Protection ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <BatteryCharging size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Smart Battery Health &amp; Limits
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">Prolong lithium battery pack lifespan</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900">Target Charge Limit</span>
              <span className="text-[10px] text-slate-500 font-bold block">
                {userProfile.targetChargeLimit}% (Recommended: 80% daily)
              </span>
            </div>
            <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-950">
              {userProfile.targetChargeLimit}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={userProfile.targetChargeLimit}
            onChange={(e) => updateUserProfile({ targetChargeLimit: Number(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7EF000]"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 pt-1 text-xs font-bold text-slate-800">
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-black text-slate-900 text-xs">Auto-Stop at 80%</div>
              <div className="text-[10px] text-slate-500">Stop charging automatically to save idling fees</div>
            </div>
            <button
              onClick={() => updateUserProfile({ autoStopCharging: !userProfile.autoStopCharging })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                userProfile.autoStopCharging ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  userProfile.autoStopCharging ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
            <div>
              <div className="font-black text-slate-900 text-xs">Autocharge (Plug &amp; Charge)</div>
              <div className="text-[10px] text-slate-500">Charge begins automatically on cable plug-in</div>
            </div>
            <button
              onClick={() => updateUserProfile({ autochargeEnabled: !userProfile.autochargeEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                userProfile.autochargeEnabled ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  userProfile.autochargeEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. RFID Charge Card / Key Tag ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Radio size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                RFID Charge Card
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">Tap &amp; Charge without mobile network</p>
            </div>
          </div>

          <button
            onClick={() => setShowRfidModal(true)}
            className="text-[11px] font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
          >
            Pair Tag
          </button>
        </div>

        <div className="bg-slate-950 text-white rounded-2xl p-3.5 flex items-center justify-between relative overflow-hidden shadow-inner">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-[#7EF000]/15 blur-xl pointer-events-none" />
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ChargeHub Smart Tag
            </div>
            <div className="text-sm font-mono font-black text-[#7EF000] tracking-wider mt-0.5">
              {userProfile.rfidCardNumber || "CH-MH-8842"}
            </div>
            <div className="text-[9px] text-slate-300 mt-1 font-bold">Status: Active &amp; Linked</div>
          </div>

          <div className="text-right">
            <div className="w-8 h-8 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center font-black text-xs">
              <Radio size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Payment, Auto-Reload & GST Invoicing ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Billing &amp; Business GST
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">Tax invoices and auto-reloading</p>
            </div>
          </div>

          <Link
            href="/wallet"
            className="text-[11px] font-black bg-[#7EF000] text-slate-950 px-3 py-1.5 rounded-xl border border-lime-400 shadow-sm"
          >
            Wallet ₹{walletBalance}
          </Link>
        </div>

        <div className="space-y-2 text-xs font-bold text-slate-800">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <div>
              <div className="font-black text-slate-900 text-xs">Auto-Reload Wallet</div>
              <div className="text-[10px] text-slate-500">Add ₹500 automatically when balance &lt; ₹200</div>
            </div>
            <button
              onClick={() => updateUserProfile({ autoReloadWallet: !userProfile.autoReloadWallet })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                userProfile.autoReloadWallet ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  userProfile.autoReloadWallet ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-black text-slate-900 text-xs">GST Business Profile</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                {userProfile.gstNumber ? `${userProfile.companyName} (${userProfile.gstNumber})` : "Not Configured"}
              </div>
            </div>
            <button
              onClick={() => setShowGstModal(true)}
              className="text-[11px] font-black text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-xl border border-slate-200 cursor-pointer"
            >
              {userProfile.gstNumber ? "Edit GST" : "Add GST"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. Maharashtra Eco Impact Dashboard (Tile above Preferences, Now Clean White & Matches App) ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7EF000]/20 text-slate-950 border border-lime-400/40 rounded-xl">
              <Leaf size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Maharashtra Eco Impact
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">Your green mobility footprint across the state</p>
            </div>
          </div>

          <span className="text-[10px] font-black bg-[#7EF000]/25 text-slate-950 border border-lime-400 px-2.5 py-0.5 rounded-full">
            Top 5% Eco Driver
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-lg font-black text-emerald-600">1,420 kg</div>
            <div className="text-[10px] text-slate-600 font-black mt-0.5">CO₂ Displaced</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-lg font-black text-slate-950">8,240 km</div>
            <div className="text-[10px] text-slate-600 font-black mt-0.5">Clean Electric Run</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-lg font-black text-slate-950">68 Trees</div>
            <div className="text-[10px] text-slate-600 font-black mt-0.5">Trees Equivalent</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-lg font-black text-emerald-600">940 kWh</div>
            <div className="text-[10px] text-slate-600 font-black mt-0.5">Green Energy Used</div>
          </div>
        </div>
      </div>

      {/* ── 7. Preferences & Language ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Preferences &amp; Language
        </h3>

        <div className="space-y-2.5 text-xs font-bold text-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-500" />
              <span>Language</span>
            </div>
            <select
              value={userProfile.language}
              onChange={(e) =>
                updateUserProfile({
                  language: e.target.value as "English" | "मराठी" | "हिन्दी",
                })
              }
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-slate-950 focus:outline-none"
            >
              <option value="English">English</option>
              <option value="मराठी">मराठी (Marathi)</option>
              <option value="हिन्दी">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <div>
                <div className="text-xs font-black">Charging Push Alerts</div>
                <div className="text-[10px] text-slate-500">Alert at 80% and session end</div>
              </div>
            </div>
            <button
              onClick={() => {
                updateUserProfile({
                  notifications: {
                    ...userProfile.notifications,
                    eightyPercentAlert: !userProfile.notifications.eightyPercentAlert,
                  },
                });
                showToast("Notification preferences updated!");
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                userProfile.notifications.eightyPercentAlert ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  userProfile.notifications.eightyPercentAlert ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 8. 24x7 Maharashtra EV Helpline & Roadside Support ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Support &amp; Roadside Help
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:18002098899"
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 transition-colors"
          >
            <PhoneCall size={20} className="text-[#7EF000] stroke-[2.5]" />
            <span className="text-[11px] font-black text-slate-950">24x7 Roadside</span>
            <span className="text-[9px] text-slate-500 font-bold">1800-209-8899</span>
          </a>

          <button
            onClick={() => showToast("Opening WhatsApp Charging Support (+91 98220 11223)...")}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone size={20} className="text-green-600 stroke-[2.5]" />
            <span className="text-[11px] font-black text-slate-950">WhatsApp Bot</span>
            <span className="text-[9px] text-slate-500 font-bold">Instant Help</span>
          </button>
        </div>

        <button
          onClick={() => showToast("Diagnostic report sent to ChargeHub network operations!")}
          className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black text-slate-800 flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Report Faulty Charger in Maharashtra
          </span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* ── 9. Log Out & Version Info ── */}
      <div className="text-center pt-2 pb-6 space-y-3">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>

        <div className="text-[10px] text-slate-500 font-black">
          ChargeHub AI v2.4.0 · Unified Maharashtra EV Network
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          LOGOUT CONFIRMATION MODAL
         ════════════════════════════════════════════════════════════════ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center">
              <LogOut size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-950">
                Log out of ChargeHub AI?
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                You will need to sign in again to access your charging stations &amp; wallet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
         ════════════════════════════════════════════════════════════════ */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-3xl p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Edit3 size={18} className="text-slate-950" />
                Edit Profile
              </h2>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    City (Maharashtra)
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950"
                    placeholder="Pune"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    Vehicle Plate #
                  </label>
                  <input
                    type="text"
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950 uppercase"
                    placeholder="MH 12 TE 8421"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black py-3 rounded-xl text-xs shadow-md border border-lime-400 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CHANGE VEHICLE MODAL
         ════════════════════════════════════════════════════════════════ */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-3xl p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto no-scrollbar space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Car size={18} />
                Switch EV Vehicle
              </h2>
              <button
                onClick={() => setShowVehicleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              Select your electric vehicle to optimize charging speed &amp; battery AI curves:
            </p>

            <div className="space-y-2 pt-1">
              {POPULAR_VEHICLES.map((v) => {
                const isSelected = vehicleProfile.model === v.model;

                return (
                  <button
                    key={v.model}
                    onClick={() => {
                      updateVehicleProfile({
                        model: v.model,
                        batteryCapacityKwh: v.batteryCapacityKwh,
                        connectorType: v.connectorType,
                      });
                      setShowVehicleModal(false);
                      showToast(`Vehicle updated to ${v.model}!`);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#7EF000]/15 border-lime-400 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-950">{v.model}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {v.batteryCapacityKwh} kWh Battery · {v.connectorType} · ~{v.rangeKm} km
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#7EF000] text-slate-950 flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          LINK RFID CARD MODAL
         ════════════════════════════════════════════════════════════════ */}
      {showRfidModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Radio size={18} className="text-amber-500" />
                Pair RFID Tag
              </h2>
              <button
                onClick={() => setShowRfidModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              Enter the 10-digit serial number printed on the back of your ChargeHub RFID Card or Key Fob:
            </p>

            <form onSubmit={handleSaveRfid} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  RFID Serial Number
                </label>
                <input
                  type="text"
                  value={newRfidNumber}
                  onChange={(e) => setNewRfidNumber(e.target.value)}
                  placeholder="e.g. CH-MH-9940"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950 uppercase"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRfidModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black py-3 rounded-xl text-xs shadow-md border border-lime-400 cursor-pointer"
                >
                  Pair &amp; Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          BUSINESS GST MODAL
         ════════════════════════════════════════════════════════════════ */}
      {showGstModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                GST Invoicing Profile
              </h2>
              <button
                onClick={() => setShowGstModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              Add your GSTIN to automatically receive tax-compliant input invoices on all Maharashtra EV sessions:
            </p>

            <form onSubmit={handleSaveGst} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="e.g. Nexus Clean Mobility LLP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  15-digit GSTIN
                </label>
                <input
                  type="text"
                  value={editGst}
                  onChange={(e) => setEditGst(e.target.value)}
                  placeholder="27AABCT1234D1Z5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-black focus:outline-none focus:border-slate-950 uppercase"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGstModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#7EF000] hover:bg-[#70D800] text-slate-950 font-black py-3 rounded-xl text-xs shadow-md border border-lime-400 cursor-pointer"
                >
                  Save GST Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
