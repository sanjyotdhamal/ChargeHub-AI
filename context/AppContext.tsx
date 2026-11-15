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
  stationId: number | string;
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

export const DEFAULT_SESSION_HISTORY: ChargingSessionRecord[] = [
  {
    id: "sess-2026-11-14",
    stationId: "demo-1",
    stationName: "Tata Power - Viviana Mall, Thane",
    network: "Tata Power",
    date: "14 Nov 2026",
    kwh: 28.4,
    cost: 568,
    durationMinutes: 38,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-11-09",
    stationId: "demo-2",
    stationName: "Jio-bp pulse - Mumbai-Pune Expressway, Khalapur",
    network: "Jio-bp pulse",
    date: "09 Nov 2026",
    kwh: 34.2,
    cost: 718,
    durationMinutes: 42,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-11-03",
    stationId: "demo-3",
    stationName: "ChargeZone - Phoenix Marketcity, Viman Nagar",
    network: "ChargeZone",
    date: "03 Nov 2026",
    kwh: 22.5,
    cost: 495,
    durationMinutes: 30,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-10-28",
    stationId: "demo-4",
    stationName: "Zeon Charging - Hotel Center Point, Lonavala",
    network: "Zeon Charging",
    date: "28 Oct 2026",
    kwh: 31.0,
    cost: 682,
    durationMinutes: 40,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-10-21",
    stationId: "demo-5",
    stationName: "Statiq - Amanora Mall, Hadapsar",
    network: "Statiq",
    date: "21 Oct 2026",
    kwh: 25.8,
    cost: 542,
    durationMinutes: 35,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-10-14",
    stationId: "demo-6",
    stationName: "Tata Power - Seasons Mall, Magarpatta",
    network: "Tata Power",
    date: "14 Oct 2026",
    kwh: 18.2,
    cost: 364,
    durationMinutes: 25,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-10-05",
    stationId: "demo-7",
    stationName: "Jio-bp pulse - Urse Toll Plaza, Pune Expressway",
    network: "Jio-bp pulse",
    date: "05 Oct 2026",
    kwh: 29.5,
    cost: 620,
    durationMinutes: 39,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-09-26",
    stationId: "demo-8",
    stationName: "Tata Power - Westend Mall, Aundh",
    network: "Tata Power",
    date: "26 Sep 2026",
    kwh: 24.0,
    cost: 480,
    durationMinutes: 32,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-09-18",
    stationId: "demo-9",
    stationName: "ChargeZone - Sayaji Hotel, Wakad",
    network: "ChargeZone",
    date: "18 Sep 2026",
    kwh: 30.6,
    cost: 673,
    durationMinutes: 41,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-09-10",
    stationId: "demo-10",
    stationName: "Zeon Charging - Express Inn, Nashik Phata",
    network: "Zeon Charging",
    date: "10 Sep 2026",
    kwh: 27.2,
    cost: 598,
    durationMinutes: 36,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-08-29",
    stationId: "demo-11",
    stationName: "Statiq - KOPA Mall, Koregaon Park",
    network: "Statiq",
    date: "29 Aug 2026",
    kwh: 21.4,
    cost: 450,
    durationMinutes: 28,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-08-15",
    stationId: "demo-12",
    stationName: "Tata Power - Grand Highstreet, Hinjewadi",
    network: "Tata Power",
    date: "15 Aug 2026",
    kwh: 33.1,
    cost: 662,
    durationMinutes: 44,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-08-04",
    stationId: "demo-13",
    stationName: "Jio-bp pulse - Balewadi High Street",
    network: "Jio-bp pulse",
    date: "04 Aug 2026",
    kwh: 26.8,
    cost: 563,
    durationMinutes: 35,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-07-24",
    stationId: "demo-14",
    stationName: "ChargeZone - The Pavillion, Senapati Bapat Rd",
    network: "ChargeZone",
    date: "24 Jul 2026",
    kwh: 19.5,
    cost: 429,
    durationMinutes: 26,
    connectorType: "CCS2",
  },
  {
    id: "sess-2026-07-11",
    stationId: "demo-15",
    stationName: "Tata Power - Ginger Hotel, Wakad",
    network: "Tata Power",
    date: "11 Jul 2026",
    kwh: 23.0,
    cost: 460,
    durationMinutes: 31,
    connectorType: "CCS2",
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-topup-nov",
    amount: 2000,
    type: "topup",
    date: "10 Nov 2026",
  },
  {
    id: "tx-sess-1",
    stationName: "Tata Power - Viviana Mall, Thane",
    network: "Tata Power",
    amount: 568,
    type: "charge",
    date: "14 Nov 2026",
  },
  {
    id: "tx-sess-2",
    stationName: "Jio-bp pulse - Mumbai-Pune Expressway, Khalapur",
    network: "Jio-bp pulse",
    amount: 718,
    type: "charge",
    date: "09 Nov 2026",
  },
  {
    id: "tx-sess-3",
    stationName: "ChargeZone - Phoenix Marketcity, Viman Nagar",
    network: "ChargeZone",
    amount: 495,
    type: "charge",
    date: "03 Nov 2026",
  },
  {
    id: "tx-topup-oct",
    amount: 2500,
    type: "topup",
    date: "02 Oct 2026",
  },
  {
    id: "tx-sess-4",
    stationName: "Zeon Charging - Hotel Center Point, Lonavala",
    network: "Zeon Charging",
    amount: 682,
    type: "charge",
    date: "28 Oct 2026",
  },
  {
    id: "tx-sess-5",
    stationName: "Statiq - Amanora Mall, Hadapsar",
    network: "Statiq",
    amount: 542,
    type: "charge",
    date: "21 Oct 2026",
  },
];

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
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [sessionHistory, setSessionHistory] = useState<ChargingSessionRecord[]>(DEFAULT_SESSION_HISTORY);
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
      setTransactions(DEFAULT_TRANSACTIONS);
      setSessionHistory(DEFAULT_SESSION_HISTORY);
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
        const parsedTx = JSON.parse(savedTx);
        setTransactions(Array.isArray(parsedTx) && parsedTx.length > 0 ? parsedTx : DEFAULT_TRANSACTIONS);
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
      }

      if (savedHist) {
        const parsedHist = JSON.parse(savedHist);
        setSessionHistory(Array.isArray(parsedHist) && parsedHist.length > 0 ? parsedHist : DEFAULT_SESSION_HISTORY);
      } else {
        setSessionHistory(DEFAULT_SESSION_HISTORY);
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
