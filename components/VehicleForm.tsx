"use client";

import React, { useState, useEffect } from "react";
import { Search, Zap, Check, AlertCircle, Loader2, Sparkles, HelpCircle } from "lucide-react";
import ModalSheet from "./ModalSheet";
import PlateBadge from "./PlateBadge";
import { EV_PRESETS, EvPreset } from "@/data/evPresets";
import { VehicleItem } from "@/context/VehicleContext";
import { VehicleInput, normalizeRegistrationNumber, REGISTRATION_REGEX, VIN_REGEX, MOTOR_REGEX } from "@/lib/validations";

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleInput) => Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  initialVehicle?: VehicleItem | null;
  onSuccessToast?: (msg: string) => void;
}

export default function VehicleForm({
  isOpen,
  onClose,
  onSave,
  initialVehicle,
  onSuccessToast,
}: VehicleFormProps) {
  const isEditing = Boolean(initialVehicle);
  const currentYear = new Date().getFullYear();

  // Search & Preset State
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Form Fields State
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState<number>(currentYear);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vin, setVin] = useState("");
  const [motorNumber, setMotorNumber] = useState("");
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(40.5);
  const [claimedRangeKm, setClaimedRangeKm] = useState<number>(400);
  const [maxChargingPowerKw, setMaxChargingPowerKw] = useState<number>(50);
  const [connectorType, setConnectorType] = useState<"CCS2" | "Type 2" | "CHAdeMO">("CCS2");

  // Form Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset or fill on open / change
  useEffect(() => {
    if (initialVehicle) {
      setBrand(initialVehicle.brand);
      setModel(initialVehicle.model);
      setVariant(initialVehicle.variant || "");
      setYear(initialVehicle.year);
      setRegistrationNumber(initialVehicle.registrationNumber);
      setVin(initialVehicle.vin);
      setMotorNumber(initialVehicle.motorNumber);
      setBatteryCapacityKwh(initialVehicle.batteryCapacityKwh);
      setClaimedRangeKm(initialVehicle.claimedRangeKm);
      setMaxChargingPowerKw(initialVehicle.maxChargingPowerKw);
      setConnectorType(initialVehicle.connectorType);
      setSelectedPresetId("custom");
    } else {
      // Default to first preset
      const preset = EV_PRESETS[0];
      setBrand(preset.brand);
      setModel(preset.model);
      setVariant(preset.variant);
      setYear(preset.year);
      setRegistrationNumber("");
      setVin("MAL123456789ABCDE");
      setMotorNumber("MTR884210");
      setBatteryCapacityKwh(preset.batteryCapacityKwh);
      setClaimedRangeKm(preset.claimedRangeKm);
      setMaxChargingPowerKw(preset.maxChargingPowerKw);
      setConnectorType(preset.connectorType);
      setSelectedPresetId(preset.id);
    }
    setFormError(null);
    setFieldErrors({});
  }, [initialVehicle, isOpen]);

  const handleSelectPreset = (preset: EvPreset) => {
    setSelectedPresetId(preset.id);
    setBrand(preset.brand);
    setModel(preset.model);
    setVariant(preset.variant);
    setYear(preset.year);
    setBatteryCapacityKwh(preset.batteryCapacityKwh);
    setClaimedRangeKm(preset.claimedRangeKm);
    setMaxChargingPowerKw(preset.maxChargingPowerKw);
    setConnectorType(preset.connectorType);
  };

  const handleSelectOther = () => {
    setSelectedPresetId("other");
    setBrand("");
    setModel("");
    setVariant("");
  };

  // Filter presets by search term
  const filteredPresets = EV_PRESETS.filter(
    (p) =>
      p.brand.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.model.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.variant.toLowerCase().includes(presetSearch.toLowerCase())
  );

  // Live checks
  const cleanReg = normalizeRegistrationNumber(registrationNumber);
  const isRegValid = REGISTRATION_REGEX.test(cleanReg);
  const isVinValid = VIN_REGEX.test(vin.trim().toUpperCase());
  const isMotorValid = MOTOR_REGEX.test(motorNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!brand.trim()) errors.brand = "Brand is required";
    if (!model.trim()) errors.model = "Model is required";
    if (!cleanReg) {
      errors.registrationNumber = "Registration number is required";
    } else if (!isRegValid) {
      errors.registrationNumber = "Format must be like MH12AB1234";
    }

    if (!vin.trim()) {
      errors.vin = "VIN is required";
    } else if (!isVinValid) {
      errors.vin = "17 characters, no I, O, or Q";
    }

    if (!motorNumber.trim()) {
      errors.motorNumber = "Motor No. is required";
    } else if (!isMotorValid) {
      errors.motorNumber = "6 to 15 alphanumeric characters";
    }

    if (batteryCapacityKwh < 5 || batteryCapacityKwh > 150) {
      errors.batteryCapacityKwh = "Must be between 5 and 150 kWh";
    }

    if (claimedRangeKm < 50 || claimedRangeKm > 1000) {
      errors.claimedRangeKm = "Must be between 50 and 1000 km";
    }

    if (maxChargingPowerKw < 3 || maxChargingPowerKw > 350) {
      errors.maxChargingPowerKw = "Must be between 3 and 350 kW";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload: VehicleInput = {
      brand: brand.trim(),
      model: model.trim(),
      variant: variant.trim(),
      year: Number(year),
      registrationNumber: cleanReg,
      vin: vin.trim().toUpperCase(),
      motorNumber: motorNumber.trim(),
      batteryCapacityKwh: Number(batteryCapacityKwh),
      claimedRangeKm: Number(claimedRangeKm),
      maxChargingPowerKw: Number(maxChargingPowerKw),
      connectorType,
    };

    setIsSubmitting(true);
    const result = await onSave(payload);
    setIsSubmitting(false);

    if (result.success) {
      onSuccessToast?.(
        isEditing
          ? `${payload.brand} ${payload.model} updated successfully!`
          : `${payload.brand} ${payload.model} added to your garage!`
      );
      onClose();
    } else {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      setFormError(result.error || "Failed to save vehicle details.");
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Electric Vehicle" : "Add New Electric Vehicle"}
      subtitle={isEditing ? "Update your EV specifications" : "Register your EV in ChargeHub AI"}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-6" noValidate>
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-bold shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* ── SECTION 1: CHOOSE YOUR EV (PRESETS) ── */}
        {!isEditing && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#077A42]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Section 1 · Choose Your EV
                </h4>
              </div>
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Typical values, you can edit
              </span>
            </div>

            {/* Preset Search Filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                placeholder="Search Nexon, Punch, Comet, ZS EV, Atto 3…"
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Horizontal Preset Carousel / Grid */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex-shrink-0 text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="text-xs font-black truncate max-w-[125px]">
                      {preset.brand} {preset.model}
                    </div>
                    <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-[#7EF000]" : "text-slate-500"}`}>
                      {preset.batteryCapacityKwh} kWh · {preset.connectorType}
                    </div>
                  </button>
                );
              })}

              {/* Other Option */}
              <button
                type="button"
                onClick={handleSelectOther}
                className={`flex-shrink-0 text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedPresetId === "other"
                    ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                    : "border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-xs font-black">+ Other</div>
                <div className="text-[10px] font-bold text-slate-500">Manual Entry</div>
              </button>
            </div>
          </div>
        )}

        {/* ── SECTION 2: VEHICLE DETAILS ── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>Section {isEditing ? "1" : "2"} · Vehicle Details</span>
          </h4>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Tata, MG"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {fieldErrors.brand && (
                <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Nexon.ev"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {fieldErrors.model && (
                <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.model}</p>
              )}
            </div>
          </div>

          {/* Variant & Year */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Variant (Optional)
              </label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Long Range / Tech LUX"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Registration Year
              </label>
              <input
                type="number"
                min={2015}
                max={currentYear + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Registration Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-slate-700">
                Registration Number *
              </label>
              {cleanReg && (
                <span className={`text-[10px] font-black ${isRegValid ? "text-emerald-700" : "text-amber-600"}`}>
                  {isRegValid ? "✓ Valid Indian Plate" : "Format: MH12AB1234"}
                </span>
              )}
            </div>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MH12AB1234"
              disabled={isSubmitting}
              className="w-full px-3 py-2 font-mono font-black uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {cleanReg && isRegValid && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500">Preview:</span>
                <PlateBadge registrationNumber={cleanReg} size="sm" />
              </div>
            )}
            {fieldErrors.registrationNumber && (
              <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.registrationNumber}</p>
            )}
          </div>

          {/* VIN & Motor No. */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                VIN / Chassis (17 chars) *
              </label>
              <input
                type="text"
                maxLength={17}
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="17-character VIN"
                disabled={isSubmitting}
                className="w-full px-3 py-2 font-mono text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {fieldErrors.vin && (
                <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.vin}</p>
              )}
            </div>

            <div>
              {/* NOTE: Strictly "Motor No." without the word "engine" */}
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Motor No. *
              </label>
              <input
                type="text"
                value={motorNumber}
                onChange={(e) => setMotorNumber(e.target.value)}
                placeholder="e.g. MTR884210"
                disabled={isSubmitting}
                className="w-full px-3 py-2 font-mono text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {fieldErrors.motorNumber && (
                <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.motorNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: BATTERY & CHARGING ── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>Section {isEditing ? "2" : "3"} · Battery &amp; Charging</span>
          </h4>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-black uppercase text-slate-700 mb-1">
                Battery (kWh) *
              </label>
              <input
                type="number"
                step="0.1"
                min={5}
                max={150}
                value={batteryCapacityKwh}
                onChange={(e) => setBatteryCapacityKwh(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
              />
              {fieldErrors.batteryCapacityKwh && (
                <p className="text-[9px] font-bold text-red-600 mt-1">{fieldErrors.batteryCapacityKwh}</p>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-slate-700 mb-1">
                Range (km) *
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                value={claimedRangeKm}
                onChange={(e) => setClaimedRangeKm(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
              />
              {fieldErrors.claimedRangeKm && (
                <p className="text-[9px] font-bold text-red-600 mt-1">{fieldErrors.claimedRangeKm}</p>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-slate-700 mb-1">
                Max DC (kW) *
              </label>
              <input
                type="number"
                min={3}
                max={350}
                value={maxChargingPowerKw}
                onChange={(e) => setMaxChargingPowerKw(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
              />
              {fieldErrors.maxChargingPowerKw && (
                <p className="text-[9px] font-bold text-red-600 mt-1">{fieldErrors.maxChargingPowerKw}</p>
              )}
            </div>
          </div>

          {/* Connector Type Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
              Primary Charging Connector *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["CCS2", "Type 2", "CHAdeMO"] as const).map((type) => {
                const isSelected = connectorType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setConnectorType(type)}
                    className={`py-2 px-1 text-center rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-[#7EF000] shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 pb-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-[#7EF000] hover:bg-[#70D800] active:scale-98 text-slate-950 rounded-2xl font-black text-sm tracking-wide shadow-[0_6px_20px_rgba(126,240,0,0.45)] border border-lime-400 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-950" />
                <span>Saving EV Details…</span>
              </>
            ) : (
              <span>{isEditing ? "Update Electric Vehicle" : "Add Vehicle to Garage"}</span>
            )}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
