"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { VehicleInput } from "@/lib/validations";

export interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber: string;
  vin: string;
  motorNumber: string;
  batteryCapacityKwh: number;
  claimedRangeKm: number;
  maxChargingPowerKw: number;
  connectorType: "CCS2" | "Type 2" | "CHAdeMO";
  isActive: boolean;
  createdAt?: string;
}

export const DEFAULT_FALLBACK_VEHICLE: VehicleItem = {
  id: "default-fallback",
  brand: "Generic EV",
  model: "EV Standard",
  variant: "",
  year: 2024,
  registrationNumber: "MH12EV0000",
  vin: "00000000000000000",
  motorNumber: "000000",
  batteryCapacityKwh: 40,
  claimedRangeKm: 300,
  maxChargingPowerKw: 50,
  connectorType: "CCS2",
  isActive: false,
};

interface VehicleContextType {
  vehicles: VehicleItem[];
  activeVehicle: VehicleItem | null;
  effectiveVehicle: VehicleItem;
  hasVehicle: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  addVehicle: (
    data: VehicleInput
  ) => Promise<{ success: boolean; vehicle?: VehicleItem; error?: string; fieldErrors?: Record<string, string> }>;
  updateVehicle: (
    id: string,
    data: VehicleInput
  ) => Promise<{ success: boolean; vehicle?: VehicleItem; error?: string; fieldErrors?: Record<string, string> }>;
  deleteVehicle: (id: string) => Promise<{ success: boolean; error?: string }>;
  setActiveVehicle: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/vehicles", {
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.warn("Could not load vehicles:", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const activeVehicle = vehicles.find((v) => v.isActive) || null;
  const effectiveVehicle = activeVehicle || DEFAULT_FALLBACK_VEHICLE;
  const hasVehicle = vehicles.length > 0;

  const addVehicle = async (data: VehicleInput) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: resData.error || "Failed to add vehicle",
          fieldErrors: resData.fieldErrors,
        };
      }

      await fetchVehicles();
      return { success: true, vehicle: resData.vehicle };
    } catch (err) {
      console.error("Add vehicle error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  const updateVehicle = async (id: string, data: VehicleInput) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: resData.error || "Failed to update vehicle",
          fieldErrors: resData.fieldErrors,
        };
      }

      await fetchVehicles();
      return { success: true, vehicle: resData.vehicle };
    } catch (err) {
      console.error("Update vehicle error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: resData.error || "Failed to delete vehicle",
        };
      }

      await fetchVehicles();
      return { success: true };
    } catch (err) {
      console.error("Delete vehicle error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  const setActiveVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}/activate`, {
        method: "POST",
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: resData.error || "Failed to activate vehicle",
        };
      }

      await fetchVehicles();
      return { success: true };
    } catch (err) {
      console.error("Activate vehicle error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        effectiveVehicle,
        hasVehicle,
        loading,
        refresh: fetchVehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        setActiveVehicle,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error("useVehicles must be used within a VehicleProvider");
  }
  return context;
}
