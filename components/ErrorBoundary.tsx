"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ChargeHub AI caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 text-center bg-[#F4F6F9] text-slate-900 select-none">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-base font-black text-slate-950 mb-1">
            Display Recovery
          </h2>
          <p className="text-xs text-slate-600 font-extrabold mb-4 max-w-xs leading-relaxed">
            A temporary display issue occurred. Tap below to reload the app seamlessly.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 bg-[#7EF000] text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-md border border-lime-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reload ChargeHub</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
