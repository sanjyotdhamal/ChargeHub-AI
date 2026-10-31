"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Station } from "@/types/station";
import { useAuth } from "./AuthContext";

type StationsContextType = {
  stations: Station[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStationById: (id: number) => Promise<Station | null>;
};

const StationsContext = createContext<StationsContextType | undefined>(undefined);

export function StationsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    // If auth is still verifying, wait
    if (authLoading) return;

    // If unauthenticated, clear stations and stop
    if (!user) {
      setStations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stations", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Handled by AuthContext or router
          setError("Unauthorized");
          return;
        }
        throw new Error(`Failed to load stations: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.stations)) {
        setStations(data.stations);
      } else {
        setStations([]);
      }
    } catch (err: any) {
      console.error("StationsContext fetch error:", err);
      setError(err.message || "Failed to load charging stations");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const getStationById = useCallback(
    async (id: number): Promise<Station | null> => {
      // 1. Check in-memory list first
      const existing = stations.find((s) => s.id === id);
      if (existing) {
        return existing;
      }

      // 2. Fallback to API route if not in memory (direct link or page refresh)
      try {
        const res = await fetch(`/api/stations/${id}`);
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        return data.station || null;
      } catch (err) {
        console.error(`Error fetching station ${id}:`, err);
        return null;
      }
    },
    [stations]
  );

  return (
    <StationsContext.Provider
      value={{
        stations,
        loading,
        error,
        refresh: fetchStations,
        getStationById,
      }}
    >
      {children}
    </StationsContext.Provider>
  );
}

export function useStations() {
  const context = useContext(StationsContext);
  if (!context) {
    throw new Error("useStations must be used within a StationsProvider");
  }
  return context;
}
