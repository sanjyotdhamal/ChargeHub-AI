"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

export type Transaction = {
  id: string;
  stationName?: string;
  network?: string;
  amount: number;
  type: "topup" | "charge";
  date: string;
};

export type ChargingSessionRecord = {
  id: string;
  stationId: number;
  stationName: string;
  network: string;
  date: string;
  kwh: number;
  cost: number;
  durationMinutes: number;
  connectorType: string;
};

export type VehicleProfile = {
  model: string;
  batteryCapacityKwh: number;
  connectorType: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  vehiclePlate: string;
  memberTier: string;
  rewardPoints: number;
  avatarInitials: string;
  rfidCardNumber: string;
  rfidEnabled: boolean;
  targetChargeLimit: number;
  autoStopCharging: boolean;
  autochargeEnabled: boolean;
  autoReloadWallet: boolean;
  autoReloadThreshold: number;
  gstNumber: string;
  companyName: string;
  language: "English" | "मराठी" | "हिन्दी";
  notifications: {
    chargingStarted: boolean;
    eightyPercentAlert: boolean;
    sessionCompleted: boolean;
    idleFeeAlert: boolean;
  };
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "Esther Howard",
  email: "esther.howard@chargehub.ai",
  phone: "+91 98220 44192",
  city: "Loni Kalbhor, Pune",
  state: "Maharashtra",
  vehiclePlate: "MH 12 TE 8421",
  memberTier: "ChargeHub Gold · Pioneer",
  rewardPoints: 1250,
  avatarInitials: "EH",
  rfidCardNumber: "CH-MH-8842",
  rfidEnabled: true,
  targetChargeLimit: 80,
  autoStopCharging: true,
  autochargeEnabled: true,
  autoReloadWallet: false,
  autoReloadThreshold: 200,
  gstNumber: "27AABCT1234D1Z5",
  companyName: "Nexus Clean Mobility LLP",
  language: "English",
  notifications: {
    chargingStarted: true,
    eightyPercentAlert: true,
    sessionCompleted: true,
    idleFeeAlert: true,
  },
};

type AppContextType = {
  walletBalance: number;
  addWalletMoney: (amount: number) => void;
  transactions: Transaction[];
  sessionHistory: ChargingSessionRecord[];
  addSessionRecord: (record: Omit<ChargingSessionRecord, "id">) => void;
  vehicleProfile: VehicleProfile;
  updateVehicleProfile: (profile: VehicleProfile) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  batteryPercent: number;
  setBatteryPercent: (percent: number) => void;
  deductWalletMoney: (amount: number) => boolean;
  isSplashActive: boolean;
  setIsSplashActive: (active: boolean) => void;
};

const DEFAULT_VEHICLE: VehicleProfile = {
  model: "Tata Nexon EV Max",
  batteryCapacityKwh: 40.5,
  connectorType: "CCS2",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "EV";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [walletBalance, setWalletBalance] = useState<number>(1450);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessionHistory, setSessionHistory] = useState<ChargingSessionRecord[]>([]);
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile>(DEFAULT_VEHICLE);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [batteryPercent, setBatteryPercent] = useState<number>(30);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  const prevUserRef = useRef<string | null>(null);

  // Load per-user state when authenticated user changes
  useEffect(() => {
    if (!user) {
      // User logged out: reset in-memory data
      setWalletBalance(1450);
      setTransactions([]);
      setSessionHistory([]);
      setVehicleProfile(DEFAULT_VEHICLE);
      setUserProfile(DEFAULT_USER_PROFILE);
      setBatteryPercent(30);
      setLoadedUserId(null);
      prevUserRef.current = null;
      return;
    }

    const userId = user.id;
    prevUserRef.current = userId;

    try {
      const savedBalance = localStorage.getItem(`chargehub:${userId}:wallet`);
      const savedTx = localStorage.getItem(`chargehub:${userId}:transactions`);
      const savedHist = localStorage.getItem(`chargehub:${userId}:session_history`);
      const savedVeh = localStorage.getItem(`chargehub:${userId}:vehicle_profile`);
      const savedUser = localStorage.getItem(`chargehub:${userId}:user_profile`);
      const savedBat = localStorage.getItem(`chargehub:${userId}:battery_percent`);

      if (savedBalance !== null) {
        setWalletBalance(JSON.parse(savedBalance));
      } else {
        setWalletBalance(1450);
      }

      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      } else {
        setTransactions([]);
      }

      if (savedHist) {
        setSessionHistory(JSON.parse(savedHist));
      } else {
        setSessionHistory([]);
      }

      if (savedVeh) {
        setVehicleProfile(JSON.parse(savedVeh));
      } else {
        setVehicleProfile(DEFAULT_VEHICLE);
      }

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserProfile({
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          name: user.name || parsed.name,
          email: user.email || parsed.email,
          avatarInitials: getInitials(user.name || parsed.name),
        });
      } else {
        setUserProfile({
          ...DEFAULT_USER_PROFILE,
          name: user.name,
          email: user.email,
          avatarInitials: getInitials(user.name),
        });
      }

      if (savedBat !== null) {
        setBatteryPercent(JSON.parse(savedBat));
      } else {
        setBatteryPercent(30);
      }
    } catch (err) {
      console.warn("Could not read user data from localStorage", err);
    } finally {
      setLoadedUserId(userId);
    }
  }, [user]);

  // Sync to per-user localStorage whenever data changes
  useEffect(() => {
    if (!user || loadedUserId !== user.id) return;
    const userId = user.id;

    try {
      localStorage.setItem(`chargehub:${userId}:wallet`, JSON.stringify(walletBalance));
      localStorage.setItem(`chargehub:${userId}:transactions`, JSON.stringify(transactions));
      localStorage.setItem(`chargehub:${userId}:session_history`, JSON.stringify(sessionHistory));
      localStorage.setItem(`chargehub:${userId}:vehicle_profile`, JSON.stringify(vehicleProfile));
      localStorage.setItem(`chargehub:${userId}:user_profile`, JSON.stringify(userProfile));
      localStorage.setItem(`chargehub:${userId}:battery_percent`, JSON.stringify(batteryPercent));
    } catch (err) {
      console.warn("Could not write to user localStorage", err);
    }
  }, [walletBalance, transactions, sessionHistory, vehicleProfile, userProfile, batteryPercent, user, loadedUserId]);

  const addWalletMoney = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    const newTx: Transaction = {
      id: "tx-" + Date.now(),
      amount,
      type: "topup",
      date: "Just now",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deductWalletMoney = (amount: number): boolean => {
    if (walletBalance < amount) {
      setWalletBalance((prev) => Math.max(0, prev - amount));
      return true;
    }
    setWalletBalance((prev) => prev - amount);
    return true;
  };

  const addSessionRecord = (record: Omit<ChargingSessionRecord, "id">) => {
    const newId = "sess-" + Date.now();
    const fullRecord: ChargingSessionRecord = { ...record, id: newId };

    setSessionHistory((prev) => [fullRecord, ...prev]);

    const newTx: Transaction = {
      id: "tx-" + Date.now(),
      stationName: record.stationName,
      network: record.network,
      amount: record.cost,
      type: "charge",
      date: "Just now",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateVehicleProfile = (profile: VehicleProfile) => {
    setVehicleProfile(profile);
  };

  const updateUserProfile = (partial: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.name && !partial.avatarInitials) {
        updated.avatarInitials = getInitials(partial.name);
      }
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        walletBalance,
        addWalletMoney,
        transactions,
        sessionHistory,
        addSessionRecord,
        vehicleProfile,
        updateVehicleProfile,
        userProfile,
        updateUserProfile,
        batteryPercent,
        setBatteryPercent,
        deductWalletMoney,
        isSplashActive,
        setIsSplashActive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
