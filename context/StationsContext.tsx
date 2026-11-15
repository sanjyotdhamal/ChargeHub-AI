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
  stations: Station[]; // Merged stations (nearest + current view), deduplicated by ID
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

export function StationsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [nearestStations, setNearestStations] = useState<Station[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState<boolean>(true);

  const activeCoordsRef = useRef<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const viewportTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to merge new stations into existing array by id without duplicates
  const mergeStations = useCallback((newItems: Station[]) => {
    setStations((prev) => {
      const existingMap = new Map<string, Station>();
      prev.forEach((s) => existingMap.set(String(s.id), s));
      newItems.forEach((s) => existingMap.set(String(s.id), s));
      return Array.from(existingMap.values());
    });
  }, []);

  // 1. Load up to 200 nearest stations for a specific coordinate
  const loadNearestForLocation = useCallback(
    async (lat: number, lng: number) => {
      activeCoordsRef.current = { lat, lng };
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radiusKm: "500",
          limit: "200",
        });

        const res = await fetch(`/api/stations?${queryParams.toString()}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Unauthorized");
            return;
          }
          throw new Error(`Failed to load nearest stations: ${res.statusText}`);
        }

        const data = await res.json();
        const loaded: Station[] = Array.isArray(data.stations) ? data.stations : [];
        setNearestStations(loaded);
        mergeStations(loaded);
      } catch (err: unknown) {
        console.error("loadNearestForLocation error:", err);
        const message = err instanceof Error ? err.message : "Failed to load nearest stations";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [user, mergeStations]
  );

  // 2. Fetch stations in current viewport bounding box (debounced 400ms, max 500)
  const fetchViewportStations = useCallback(
    (bbox: BBox) => {
      if (!user) return;

      if (viewportTimerRef.current) {
        clearTimeout(viewportTimerRef.current);
      }

      viewportTimerRef.current = setTimeout(async () => {
        try {
          const bboxParam = `${bbox.minLng.toFixed(5)},${bbox.minLat.toFixed(5)},${bbox.maxLng.toFixed(5)},${bbox.maxLat.toFixed(5)}`;
          const queryParams = new URLSearchParams({
            bbox: bboxParam,
            limit: "500",
          });

          const res = await fetch(`/api/stations?${queryParams.toString()}`);
          if (!res.ok) return;

          const data = await res.json();
          if (data && Array.isArray(data.stations)) {
            mergeStations(data.stations);
          }
        } catch (err) {
          console.error("fetchViewportStations error:", err);
        }
      }, 400); // 400ms debounce
    },
    [user, mergeStations]
  );

  // Initial load when user authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNearestStations([]);
      setStations([]);
      setLoading(false);
      return;
    }

    loadNearestForLocation(activeCoordsRef.current.lat, activeCoordsRef.current.lng);
  }, [user, authLoading, loadNearestForLocation]);

  const refresh = useCallback(async () => {
    await loadNearestForLocation(activeCoordsRef.current.lat, activeCoordsRef.current.lng);
  }, [loadNearestForLocation]);

  const getStationById = useCallback(
    async (id: number | string): Promise<Station | null> => {
      // 1. Check in-memory list first
      const existing = stations.find((s) => String(s.id) === String(id));
      if (existing) {
        return existing;
      }

      // 2. Fallback to API route if not in memory
      try {
        const res = await fetch(`/api/stations/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        const found = data.station || null;
        if (found) {
          mergeStations([found]);
        }
        return found;
      } catch (err) {
        console.error(`Error fetching station ${id}:`, err);
        return null;
      }
    },
    [stations, mergeStations]
  );

  return (
    <StationsContext.Provider
      value={{
        stations,
        nearestStations,
        loading,
        error,
        refresh,
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
