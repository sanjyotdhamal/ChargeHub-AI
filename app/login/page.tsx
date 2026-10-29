"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WelcomeTransition from "@/components/WelcomeTransition";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [welcomeUser, setWelcomeUser] = useState<{ name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      setWelcomeUser({ name: result.user.name });
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      setFormError(result.error || "Invalid email or password");
    }
  };

  if (welcomeUser) {
    return <WelcomeTransition name={welcomeUser.name} nextUrl={nextParam} />;
  }

  const signupLink = nextParam
    ? `/signup?next=${encodeURIComponent(nextParam)}`
    : "/signup";

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-y-auto bg-[#F4F6F9]">
      {/* Background Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#7EF000]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full flex-1 flex flex-col justify-center max-w-sm mx-auto z-10 py-6"
      >
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-14 h-14 rounded-2xl bg-[#7EF000] text-slate-950 flex items-center justify-center shadow-[0_0_24px_rgba(126,240,0,0.5)] border-2 border-lime-400 mb-3"
          >
            <Zap size={28} className="fill-slate-950 stroke-none" />
          </motion.div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Log in to manage your EV charging & wallet
          </p>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-bold shadow-sm"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
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
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
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

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#7EF000] hover:bg-[#72db00] active:scale-[0.98] text-slate-950 rounded-xl font-black text-xs tracking-wide shadow-[0_4px_16px_rgba(126,240,0,0.4)] border border-lime-400 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-950" />
                <span>Logging in…</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer Switcher */}
      <div className="w-full text-center py-2 z-10 border-t border-slate-200/60">
        <p className="text-xs font-extrabold text-slate-500">
          New here?{" "}
          <Link
            href={signupLink}
            className="text-slate-950 hover:underline font-black decoration-lime-500 underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#F4F6F9]">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
