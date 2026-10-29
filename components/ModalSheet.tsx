"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ModalSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ModalSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Drawer Chassis */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-[430px] max-h-[92vh] bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t border-slate-200 z-10 flex flex-col overflow-hidden"
          >
            {/* Header / Grab Handle */}
            <div className="w-full pt-3 pb-2 px-5 border-b border-slate-100 flex flex-col items-center shrink-0 bg-white">
              <div className="w-10 h-1 bg-slate-300 rounded-full mb-3 cursor-pointer" onClick={onClose} />
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950 leading-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-[#F4F6F9]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
