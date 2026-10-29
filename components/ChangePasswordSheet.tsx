"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import ModalSheet from "./ModalSheet";

interface ChangePasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export default function ChangePasswordSheet({
  isOpen,
  onClose,
  onSuccessToast,
}: ChangePasswordSheetProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Real-time checks
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isDifferent = newPassword.length > 0 && newPassword !== currentPassword;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (!hasMinLength || !hasLetter || !hasNumber) {
      errors.newPassword = "Password must be at least 8 characters with letters & numbers";
    } else if (!isDifferent) {
      errors.newPassword = "New password must be different from current password";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(data.error || "Failed to change password");
        return;
      }

      onSuccessToast?.("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err) {
      console.error("Change password error:", err);
      setFormError("Something went wrong, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      subtitle="Keep your ChargeHub AI account secure"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-4" noValidate>
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-bold shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            Current Password *
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={isSubmitting}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {fieldErrors.currentPassword && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            New Password *
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={isSubmitting}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.newPassword}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
            Confirm New Password *
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              disabled={isSubmitting}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[10px] font-bold text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Rules Checklist */}
        <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 space-y-1.5 text-[10px] font-bold text-slate-600">
          <span className="block text-slate-900 uppercase font-black mb-1">
            Password Security Rules:
          </span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className={hasMinLength ? "text-emerald-600" : "text-slate-400"} />
            <span className={hasMinLength ? "text-emerald-800" : ""}>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className={hasLetter && hasNumber ? "text-emerald-600" : "text-slate-400"} />
            <span className={hasLetter && hasNumber ? "text-emerald-800" : ""}>Contains letters &amp; numbers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className={isDifferent ? "text-emerald-600" : "text-slate-400"} />
            <span className={isDifferent ? "text-emerald-800" : ""}>Different from current password</span>
          </div>
          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className={passwordsMatch ? "text-emerald-600" : "text-slate-400"} />
              <span className={passwordsMatch ? "text-emerald-800" : ""}>Passwords match</span>
            </div>
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
              <span>Updating Password…</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </form>
    </ModalSheet>
  );
}
