"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WelcomeTransition from "@/components/WelcomeTransition";

function SignupForm() {
  const { signup } = useAuth();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [welcomeUser, setWelcomeUser] = useState<{ name: string } | null>(null);

  // Real-time password requirement checks
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2 || name.trim().length > 60) {
      errors.name = "Name must be between 2 and 60 characters";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (!hasMinLength || !hasLetter || !hasNumber) {
      errors.password = "Password must be at least 8 characters with letters & numbers";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await signup(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      setWelcomeUser({ name: result.user.name });
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      setFormError(result.error || "Failed to create account. Please try again.");
    }
  };

  if (welcomeUser) {
    return <WelcomeTransition name={welcomeUser.name} nextUrl={nextParam} />;
  }

  const loginLink = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}`
    : "/login";

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-y-auto bg-[#F4F6F9]">
      {/* Background Glow */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#7EF000]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full flex-1 flex flex-col justify-center max-w-sm mx-auto z-10 py-4"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-13 h-13 rounded-2xl bg-[#7EF000] text-slate-950 flex items-center justify-center shadow-[0_0_24px_rgba(126,240,0,0.5)] border-2 border-lime-400 mb-2.5 p-2.5"
          >
            <Zap size={26} className="fill-slate-950 stroke-none" />
          </motion.div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Create an account
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Join the smart EV charging network
          </p>
        </div>

        {/* Form Error Alert */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-bold shadow-sm"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </motion.div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                id="name"
                type="text"
                name="name"
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Esther Howard"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-2 bg-white border ${
                  fieldErrors.name
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-950/10"
                } rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] font-bold text-red-600 mt-1 pl-1">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-2 bg-white border ${
                  fieldErrors.email
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-950/10"
                } rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] font-bold text-red-600 mt-1 pl-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-10 py-2 bg-white border ${
                  fieldErrors.password
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-950/10"
                } rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] font-bold text-red-600 mt-1 pl-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-10 py-2 bg-white border ${
                  fieldErrors.confirmPassword
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-950/10"
                } rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] font-bold text-red-600 mt-1 pl-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Rules Checklist */}
          <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1 text-[10px] font-extrabold text-slate-600">
            <span className="block text-slate-900 uppercase tracking-wider font-black mb-1">
              Password Requirements:
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                size={12}
                className={hasMinLength ? "text-emerald-600" : "text-slate-400"}
              />
              <span className={hasMinLength ? "text-emerald-700" : ""}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                size={12}
                className={hasLetter && hasNumber ? "text-emerald-600" : "text-slate-400"}
              />
              <span className={hasLetter && hasNumber ? "text-emerald-700" : ""}>
                Contains at least 1 letter and 1 number
              </span>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  size={12}
                  className={passwordsMatch ? "text-emerald-600" : "text-slate-400"}
                />
                <span className={passwordsMatch ? "text-emerald-700" : ""}>
                  Passwords match
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#7EF000] hover:bg-[#72db00] active:scale-[0.98] text-slate-950 rounded-xl font-black text-xs tracking-wide shadow-[0_4px_16px_rgba(126,240,0,0.4)] border border-lime-400 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-950" />
                <span>Creating account…</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer Switcher */}
      <div className="w-full text-center py-2 z-10 border-t border-slate-200/60">
        <p className="text-xs font-extrabold text-slate-500">
          Already have an account?{" "}
          <Link
            href={loginLink}
            className="text-slate-950 hover:underline font-black decoration-lime-500 underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#F4F6F9]">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
