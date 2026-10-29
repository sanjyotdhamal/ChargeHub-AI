"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Car,
  Edit3,
  ShieldCheck,
  Sparkles,
  Lock,
  Plus,
  Bell,
  Radio,
  FileText,
  CreditCard,
  Globe,
  PhoneCall,
  Smartphone,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVehicles, VehicleItem } from "@/context/VehicleContext";
import StatsRow from "@/components/StatsRow";
import VehicleCard from "@/components/VehicleCard";
import VehicleDetailSheet from "@/components/VehicleDetailSheet";
import VehicleForm from "@/components/VehicleForm";
import PersonalDetailsSheet from "@/components/PersonalDetailsSheet";
import ChangePasswordSheet from "@/components/ChangePasswordSheet";
import PreferenceSelector from "@/components/PreferenceSelector";
import { VehicleInput } from "@/lib/validations";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const {
    vehicles,
    activeVehicle,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setActiveVehicle,
    loading: vehiclesLoading,
  } = useVehicles();

  // Sheet States
  const [showPersonalSheet, setShowPersonalSheet] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);

  // Logout & Feedback States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Avatar Initials
  const getInitials = (name?: string) => {
    if (!name) return "EV";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || "EV";
  };

  const handleSetActive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActivatingId(id);
    const res = await setActiveVehicle(id);
    setActivatingId(null);
    if (res.success) {
      showToast("Active vehicle switched successfully!");
      if (selectedVehicle && selectedVehicle.id === id) {
        setSelectedVehicle((prev) => (prev ? { ...prev, isActive: true } : null));
      }
    } else {
      showToast(res.error || "Failed to switch active vehicle");
    }
  };

  const handleSaveVehicle = async (data: VehicleInput) => {
    if (editingVehicle) {
      return updateVehicle(editingVehicle.id, data);
    }
    return addVehicle(data);
  };

  const handleToggleNotification = async (key: "chargingComplete" | "lowBattery" | "priceDrop") => {
    if (!user || savingNotif) return;
    const currentNotifs = user.notifications || {
      chargingComplete: true,
      lowBattery: true,
      priceDrop: false,
    };

    const updated = {
      ...currentNotifs,
      [key]: !currentNotifs[key],
    };

    setSavingNotif(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updated }),
      });
      if (res.ok) {
        await refreshUser();
        showToast("Notification preference updated!");
      }
    } catch {
      showToast("Could not update notifications");
    } finally {
      setSavingNotif(false);
    }
  };

  const isMaxVehicles = vehicles.length >= 5;

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col p-4 text-slate-950 select-none overflow-y-auto no-scrollbar pb-28 space-y-4">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-[#7EF000] px-4 py-2 rounded-2xl shadow-xl text-xs font-black border border-lime-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="w-2 h-2 rounded-full bg-[#7EF000] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Profile Header Card ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Initials Avatar */}
            <div className="w-13 h-13 rounded-2xl bg-[#7EF000] border-2 border-lime-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-950 truncate">
                  {user?.name || "EV Driver"}
                </h2>
                <ShieldCheck size={16} className="text-[#077A42] shrink-0" />
              </div>
              <p className="text-xs text-slate-600 font-extrabold mt-0.5 truncate">
                {user?.email || "No email available"}
              </p>
              {user?.phone && (
                <p className="text-[11px] text-slate-500 font-bold mt-0.5 truncate">
                  +91 {user.phone} {user.city ? `· ${user.city}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={() => setShowPersonalSheet(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-black p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
            aria-label="Edit personal details"
          >
            <Edit3 size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Member Tier & Reward Credits Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#077A42]" />
            <span className="font-black text-slate-900 text-xs">ChargeHub Gold Member</span>
          </div>

          <div className="bg-[#7EF000]/25 border border-lime-400/60 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black">
            Pioneer Status
          </div>
        </div>
      </div>

      {/* ── 2. Three-Card Stats Row ── */}
      <StatsRow />

      {/* ── 3. My Electric Vehicles (Garage) ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7EF000]/25 rounded-xl border border-lime-400/40 text-slate-950">
              <Car size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                My Electric Vehicles
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">
                {vehicles.length} of 5 registered
              </p>
            </div>
          </div>

          {/* Add Vehicle Button */}
          <button
            type="button"
            disabled={isMaxVehicles}
            onClick={() => {
              setEditingVehicle(null);
              setShowVehicleForm(true);
            }}
            className={`text-[11px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
              isMaxVehicles
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-[#7EF000] text-slate-950 hover:bg-[#70D800] border-lime-400 active:scale-95 shadow-xs"
            }`}
          >
            <Plus size={13} strokeWidth={3} />
            <span>Add EV</span>
          </button>
        </div>

        {/* Max Vehicles Notice */}
        {isMaxVehicles && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-2 text-[10px] font-bold text-slate-600 text-center">
            Garage limit reached (maximum 5 vehicles per account).
          </div>
        )}

        {/* Vehicle Cards List */}
        {vehiclesLoading ? (
          <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading your garage…
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
            <Car size={32} className="mx-auto text-slate-300 stroke-[1.5]" />
            <h4 className="text-xs font-black text-slate-900">No vehicles in your garage yet</h4>
            <p className="text-[11px] text-slate-500 font-bold max-w-[240px] mx-auto">
              Add your EV to unlock personalized range matching and optimized AI charger scoring.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingVehicle(null);
                setShowVehicleForm(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#7EF000] text-slate-950 font-black text-xs px-4 py-2 rounded-xl border border-lime-400 shadow-xs cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add Your First EV</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onOpenDetails={(veh) => setSelectedVehicle(veh)}
                onSetActive={handleSetActive}
                isActivating={activatingId === v.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. AI Charging Preference ── */}
      <PreferenceSelector onSavedToast={showToast} />

      {/* ── 5. Security & Authentication ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Security &amp; Account
        </h3>

        <div className="space-y-2">
          {/* Change Password Button */}
          <button
            type="button"
            onClick={() => setShowPasswordSheet(true)}
            className="w-full py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-black text-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                <Lock size={14} />
              </div>
              <div className="text-left">
                <div>Change Password</div>
                <div className="text-[10px] text-slate-500 font-bold">
                  Update your login security credentials
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── 6. Push & Live Notifications ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Notification Alerts
        </h3>

        <div className="space-y-2.5 text-xs font-bold text-slate-800">
          {/* Charging Complete Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <div>
                <div className="text-xs font-black">Charging Complete Alert</div>
                <div className="text-[10px] text-slate-500">Alert when vehicle reaches full charge</div>
              </div>
            </div>
            <button
              type="button"
              disabled={savingNotif}
              onClick={() => handleToggleNotification("chargingComplete")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                user?.notifications?.chargingComplete ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                  user?.notifications?.chargingComplete ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Low Battery Alert Toggle */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <div>
                <div className="text-xs font-black">Low Battery Warning</div>
                <div className="text-[10px] text-slate-500">Alert when SoC falls below 20%</div>
              </div>
            </div>
            <button
              type="button"
              disabled={savingNotif}
              onClick={() => handleToggleNotification("lowBattery")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                user?.notifications?.lowBattery ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                  user?.notifications?.lowBattery ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Price Drop Alert Toggle */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#077A42]" />
              <div>
                <div className="text-xs font-black">Off-Peak Tariff Alerts</div>
                <div className="text-[10px] text-slate-500">Alert when nearby hub rates drop</div>
              </div>
            </div>
            <button
              type="button"
              disabled={savingNotif}
              onClick={() => handleToggleNotification("priceDrop")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                user?.notifications?.priceDrop ? "bg-[#7EF000]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                  user?.notifications?.priceDrop ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 7. Settings Audit (Unimplemented Marked 'Coming Soon') ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Advanced Network Features
        </h3>

        <div className="space-y-2">
          {/* RFID Card Management */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between opacity-75">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-slate-400" />
              <div>
                <div className="text-xs font-black text-slate-800">Physical RFID Keycard</div>
                <div className="text-[10px] text-slate-500">Tap to start without mobile app</div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          {/* AutoCharge ISO 15118 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between opacity-75">
            <div className="flex items-center gap-2.5">
              <CreditCard size={16} className="text-slate-400" />
              <div>
                <div className="text-xs font-black text-slate-800">Plug &amp; Charge (ISO 15118)</div>
                <div className="text-[10px] text-slate-500">Auto authentication via vehicle MAC</div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          {/* GST & Corporate Invoicing */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between opacity-75">
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-slate-400" />
              <div>
                <div className="text-xs font-black text-slate-800">Corporate GST Billing</div>
                <div className="text-[10px] text-slate-500">Business input tax credit invoices</div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>

          {/* Multilingual Support */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between opacity-75">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-slate-400" />
              <div>
                <div className="text-xs font-black text-slate-800">Language (मराठी / हिन्दी)</div>
                <div className="text-[10px] text-slate-500">Regional localization support</div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* ── 8. Support & Roadside Help ── */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Support &amp; Roadside Help
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:18002098899"
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 transition-colors"
          >
            <PhoneCall size={18} className="text-[#077A42] stroke-[2.5]" />
            <span className="text-[11px] font-black text-slate-950">24x7 Roadside</span>
            <span className="text-[9px] text-slate-500 font-bold">1800-209-8899</span>
          </a>

          <button
            type="button"
            onClick={() => showToast("Opening WhatsApp Charging Support (+91 98220 11223)...")}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone size={18} className="text-emerald-600 stroke-[2.5]" />
            <span className="text-[11px] font-black text-slate-950">WhatsApp Bot</span>
            <span className="text-[9px] text-slate-500 font-bold">Instant Help</span>
          </button>
        </div>
      </div>

      {/* ── 9. Log Out & Version Info ── */}
      <div className="text-center pt-2 pb-6 space-y-3">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>

        <div className="text-[10px] text-slate-500 font-black">
          ChargeHub AI v2.5.0 · Unified Maharashtra EV Network
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL SHEETS
         ════════════════════════════════════════════════════════════════ */}

      {/* Vehicle Detail Sheet */}
      <VehicleDetailSheet
        vehicle={selectedVehicle}
        isOpen={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        onEdit={(veh) => {
          setSelectedVehicle(null);
          setEditingVehicle(veh);
          setShowVehicleForm(true);
        }}
        onSetActive={async (id) => {
          const res = await setActiveVehicle(id);
          if (res.success) {
            showToast("Active vehicle updated!");
            setSelectedVehicle((prev) => (prev ? { ...prev, isActive: true } : null));
          } else {
            showToast(res.error || "Failed to activate vehicle");
          }
        }}
        onDelete={async (id) => {
          const res = await deleteVehicle(id);
          if (res.success) {
            showToast("Vehicle deleted from your garage.");
          } else {
            showToast(res.error || "Failed to delete vehicle");
          }
        }}
      />

      {/* Add / Edit Vehicle Form Sheet */}
      <VehicleForm
        isOpen={showVehicleForm}
        onClose={() => {
          setShowVehicleForm(false);
          setEditingVehicle(null);
        }}
        initialVehicle={editingVehicle}
        onSave={handleSaveVehicle}
        onSuccessToast={showToast}
      />

      {/* Personal Details Sheet */}
      <PersonalDetailsSheet
        isOpen={showPersonalSheet}
        onClose={() => setShowPersonalSheet(false)}
        onSuccessToast={showToast}
      />

      {/* Change Password Sheet */}
      <ChangePasswordSheet
        isOpen={showPasswordSheet}
        onClose={() => setShowPasswordSheet(false)}
        onSuccessToast={showToast}
      />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center">
              <LogOut size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-950">
                Log out of ChargeHub AI?
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                You will need to sign in again to access your EV charging stations &amp; wallet.
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
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors shadow-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
