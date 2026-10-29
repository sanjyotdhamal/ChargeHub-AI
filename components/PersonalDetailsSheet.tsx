"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Lock, AlertCircle, Loader2 } from "lucide-react";
import ModalSheet from "./ModalSheet";
import { useAuth } from "@/context/AuthContext";
import { PHONE_REGEX } from "@/lib/validations";

interface PersonalDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export default function PersonalDetailsSheet({
  isOpen,
  onClose,
  onSuccessToast,
}: PersonalDetailsSheetProps) {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setCity(user.city || "");
    }
    setFormError(null);
    setFieldErrors({});
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedCity = city.trim();

    if (!trimmedName) {
      errors.name = "Full name is required";
    } else if (trimmedName.length < 2 || trimmedName.length > 60) {
      errors.name = "Name must be between 2 and 60 characters";
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (trimmedCity && trimmedCity.length > 60) {
      errors.city = "City cannot exceed 60 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          city: trimmedCity,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(data.error || "Failed to update profile details");
        return;
      }

      await refreshUser();
      onSuccessToast?.("Personal details updated successfully!");
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      setFormError("Something went wrong, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personal Details"
      subtitle="Update your driver profile & contact information"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-4" noValidate>
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-bold shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Read-Only Email */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>Registered Email</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Lock size={11} />
              Read-only
            </span>
          </div>
          <div className="text-xs font-bold text-slate-700 truncate select-all">
            {user?.email || "user@example.com"}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Esther Howard"
              disabled={isSubmitting}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {fieldErrors.name && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            Mobile Number (India)
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile (e.g. 9822044192)"
              disabled={isSubmitting}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {fieldErrors.phone && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.phone}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            City / Region
          </label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune, Maharashtra"
              disabled={isSubmitting}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {fieldErrors.city && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.city}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 bg-[#7EF000] hover:bg-[#70D800] active:scale-98 text-slate-950 rounded-xl font-black text-xs tracking-wide shadow-[0_4px_16px_rgba(126,240,0,0.4)] border border-lime-400 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin text-slate-950" />
              <span>Saving Details…</span>
            </>
          ) : (
            <span>Save Personal Details</span>
          )}
        </button>
      </form>
    </ModalSheet>
  );
}
