"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Station } from "@/types/station";
import { useAuth } from "./AuthContext";

export type BBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type StationsContextType = {
  stations: Station[]; // All loaded stations across Maharashtra
  nearestStations: Station[]; // 200 stations nearest to current user/chosen location
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStationById: (id: number | string) => Promise<Station | null>;
  loadNearestForLocation: (lat: number, lng: number) => Promise<void>;
  fetchViewportStations: (bbox: BBox) => void;
  showDemo: boolean;
  setShowDemo: (show: boolean | ((prev: boolean) => boolean)) => void;
};

const StationsContext = createContext<StationsContextType | undefined>(undefined);

// Default coordinates: Pune
const DEFAULT_COORDS = { lat: 18.5204, lng: 73.8567 };

// Haversine formula to compute distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export function StationsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [nearestStations, setNearestStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState<boolean>(true);

  const activeCoordsRef = useRef<{ lat: number; lng: number }>(DEFAULT_COORDS);

  // Recalculate 200 nearest stations whenever stations list or active coordinates change
  const updateNearest = useCallback((allList: Station[], coords: { lat: number; lng: number }) => {
    const sorted = [...allList]
      .map((st) => ({
        ...st,
        distanceKm: haversineKm(coords.lat, coords.lng, st.lat, st.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 200);

    setNearestStations(sorted);
  }, []);

  // Fetch ALL stations from MongoDB (up to 5,000+ so all CSV stations are loaded)
  const fetchAllStations = useCallback(async () => {
    if (!user) {
      setStations([]);
      setNearestStations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stations?limit=5000", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized");
          return;
        }
        throw new Error(`Failed to load stations: ${res.statusText}`);
      }

      const data = await res.json();
      const loaded: Station[] = Array.isArray(data.stations) ? data.stations : [];
      setStations(loaded);
      updateNearest(loaded, activeCoordsRef.current);
    } catch (err: unknown) {
      console.error("StationsContext fetch error:", err);
      const message = err instanceof Error ? err.message : "Failed to load charging stations";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, updateNearest]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStations([]);
      setNearestStations([]);
      setLoading(false);
      return;
    }

    fetchAllStations();
  }, [user, authLoading, fetchAllStations]);

  // When location changes, update nearest stations list immediately
  const loadNearestForLocation = useCallback(
    async (lat: number, lng: number) => {
      activeCoordsRef.current = { lat, lng };
      if (stations.length > 0) {
        updateNearest(stations, { lat, lng });
      }
    },
    [stations, updateNearest]
  );

  // Bounding box viewport fetch (debounced helper if more stations exist)
  const fetchViewportStations = useCallback((_bbox: BBox) => {
    // All stations are already loaded into memory for instant pan/zoom rendering
  }, []);

  const getStationById = useCallback(
    async (id: number | string): Promise<Station | null> => {
      const existing = stations.find((s) => String(s.id) === String(id));
      if (existing) return existing;

      try {
        const res = await fetch(`/api/stations/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        const found = data.station || null;
        if (found) {
          setStations((prev) => {
            if (prev.some((s) => String(s.id) === String(found.id))) return prev;
            return [...prev, found];
          });
        }
        return found;
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
        nearestStations,
        loading,
        error,
        refresh: fetchAllStations,
        getStationById,
        loadNearestForLocation,
        fetchViewportStations,
        showDemo,
        setShowDemo,
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
