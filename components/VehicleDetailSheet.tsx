"use client";

import React, { useState } from "react";
import { Zap, Eye, EyeOff, CheckCircle2, Edit3, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import ModalSheet from "./ModalSheet";
import PlateBadge from "./PlateBadge";
import { VehicleItem } from "@/context/VehicleContext";

interface VehicleDetailSheetProps {
  vehicle: VehicleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: VehicleItem) => void;
  onSetActive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function VehicleDetailSheet({
  vehicle,
  isOpen,
  onClose,
  onEdit,
  onSetActive,
  onDelete,
}: VehicleDetailSheetProps) {
  const [showVin, setShowVin] = useState(false);
  const [showMotorNo, setShowMotorNo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  if (!vehicle) return null;

  const maskValue = (val: string, show: boolean) => {
    if (show) return val;
    if (!val || val.length <= 4) return "••••";
    return "•••••••••••••" + val.slice(-4);
  };

  const handleActivate = async () => {
    setIsActivating(true);
    await onSetActive(vehicle.id);
    setIsActivating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(vehicle.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${vehicle.brand} ${vehicle.model}`}
      subtitle={vehicle.variant || `${vehicle.year} Model`}
    >
      <div className="space-y-4">
        {/* Plate & Active Status Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <PlateBadge registrationNumber={vehicle.registrationNumber} size="md" />
            <p className="text-[10px] text-slate-500 font-bold mt-1.5">
              Registration Year: {vehicle.year}
            </p>
          </div>

          {vehicle.isActive ? (
            <div className="flex items-center gap-1.5 bg-[#7EF000] text-slate-950 px-3 py-1.5 rounded-full border border-lime-400 text-xs font-black shadow-xs">
              <CheckCircle2 size={14} className="stroke-[3]" />
              <span>Active EV</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isActivating}
              onClick={handleActivate}
              className="bg-slate-950 hover:bg-slate-800 text-[#7EF000] px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isActivating ? "Activating…" : "Set as Active"}
            </button>
          )}
        </div>

        {/* Battery & Charging Specs Grid */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
            Battery &amp; Charging Specs
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="text-sm font-black text-slate-950">
                {vehicle.batteryCapacityKwh}
              </div>
              <div className="text-[9px] font-extrabold uppercase text-slate-500">
                kWh Pack
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="text-sm font-black text-slate-950">
                {vehicle.claimedRangeKm}
              </div>
              <div className="text-[9px] font-extrabold uppercase text-slate-500">
                km Range
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="text-sm font-black text-slate-950">
                {vehicle.maxChargingPowerKw}
              </div>
              <div className="text-[9px] font-extrabold uppercase text-slate-500">
                kW Max DC
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span>Primary Connector Port:</span>
            <span className="font-black text-slate-950 bg-white border border-slate-300 px-2.5 py-0.5 rounded-lg">
              {vehicle.connectorType}
            </span>
          </div>
        </div>

        {/* Sensitive Identifiers (VIN & Motor No.) */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Vehicle Identifiers
            </h4>
            <div className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Masked for privacy</span>
            </div>
          </div>

          {/* VIN */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                VIN / Chassis No.
              </div>
              <div className="font-mono font-black text-slate-900 tracking-wider text-[11px] mt-0.5">
                {maskValue(vehicle.vin, showVin)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVin(!showVin)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              aria-label={showVin ? "Hide VIN" : "Show VIN"}
            >
              {showVin ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Motor No. (NOTE: "Motor No." used, strictly no "engine") */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Motor No.
              </div>
              <div className="font-mono font-black text-slate-900 tracking-wider text-[11px] mt-0.5">
                {maskValue(vehicle.motorNumber, showMotorNo)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMotorNo(!showMotorNo)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              aria-label={showMotorNo ? "Hide Motor Number" : "Show Motor Number"}
            >
              {showMotorNo ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(vehicle);
            }}
            className="py-3 px-3 bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <Edit3 size={14} />
            <span>Edit Vehicle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="py-3 px-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

        {/* Delete Confirmation Sub-modal */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-black text-red-950">
                  Delete {vehicle.brand} {vehicle.model}?
                </h5>
                <p className="text-[11px] font-bold text-red-800 mt-0.5 leading-snug">
                  {vehicle.isActive
                    ? "⚠️ Warning: This is your currently ACTIVE vehicle. Deleting it will automatically switch another vehicle as active."
                    : "This vehicle will be permanently removed from your garage."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors shadow-xs"
              >
                {isDeleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
