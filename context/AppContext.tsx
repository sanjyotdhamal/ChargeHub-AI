"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { LearnedUserHabit, inferHabitFromHistory } from "@/lib/scoring";

/**
 * Global realistic charging simulation constant:
 * Battery rises 1% every 3.5 seconds.
 */
export const SECONDS_PER_PERCENT = 3.5;

export type ActiveChargingSession = {
  stationId: string | number;
  stationName: string;
  network?: string;
  connectorType?: string;
  speedKw?: number;
  pricePerKwh: number;
  startedAt: number; // Unix epoch ms
  startPercent: number;
  vehicleBatteryCapacity: number;
};

export type ActiveSessionProgress = {
  currentBattery: number;
  addedPercent: number;
  kwhDelivered: number;
  cost: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isFull: boolean;
  isWalletDepleted: boolean;
};

/**
 * Computes live session progress directly from timestamps so charging progresses
 * continuously even when leaving screens, switching tabs, or refreshing.
 */
export function computeActiveSessionProgress(
  session: ActiveChargingSession,
  now: number = Date.now(),
  walletBalance: number = Infinity
): ActiveSessionProgress {
  const elapsedSeconds = Math.max(0, (now - session.startedAt) / 1000);
  const rawAddedPercent = elapsedSeconds / SECONDS_PER_PERCENT;
  const maxBatteryGain = Math.max(0, 100 - session.startPercent);

  // Check how much battery can be charged with the available wallet balance
  const kwhPerPercent = session.vehicleBatteryCapacity / 100;
  const maxAffordableKwh = session.pricePerKwh > 0 ? Math.max(0, walletBalance) / session.pricePerKwh : Infinity;
  const maxAffordablePercent = kwhPerPercent > 0 ? maxAffordableKwh / kwhPerPercent : Infinity;

  const isFull = rawAddedPercent >= maxBatteryGain;
  const isWalletDepleted = !isFull && rawAddedPercent >= maxAffordablePercent;

  const effectiveAddedPercent = Math.min(rawAddedPercent, maxBatteryGain, maxAffordablePercent);
  const currentBattery = Math.min(100, parseFloat((session.startPercent + effectiveAddedPercent).toFixed(1)));
  const kwhDelivered = parseFloat((effectiveAddedPercent * kwhPerPercent).toFixed(2));
  const cost = parseFloat((kwhDelivered * session.pricePerKwh).toFixed(2));

  const remainingPercent = Math.max(0, 100 - currentBattery);
  const remainingSeconds = Math.round(remainingPercent * SECONDS_PER_PERCENT);

  return {
    currentBattery,
    addedPercent: effectiveAddedPercent,
    kwhDelivered,
    cost,
    elapsedSeconds: Math.floor(elapsedSeconds),
    remainingSeconds,
    isFull,
    isWalletDepleted,
  };
}

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

// Preset Persona 1: Speed Seeker (prioritizes high-speed DC fast charging 60kW-120kW, tolerant of higher tariffs)
export const SPEED_SEEKER_HISTORY: ChargingSessionRecord[] = [
  {
    id: "speed-1",
    stationId: "demo-sp-1",
    stationName: "Jio-bp pulse - Mumbai-Pune Expressway, Khalapur",
    network: "Jio-bp pulse",
    date: "14 Nov 2026",
    kwh: 38.0,
    cost: 874, // ₹23/kWh
    durationMinutes: 24, // ~95 kW
    connectorType: "CCS2",
  },
  {
    id: "speed-2",
    stationId: "demo-sp-2",
    stationName: "Zeon Charging - Express Inn, Nashik Phata",
    network: "Zeon Charging",
    date: "10 Nov 2026",
    kwh: 34.5,
    cost: 828, // ₹24/kWh
    durationMinutes: 21, // ~98 kW
    connectorType: "CCS2",
  },
  {
    id: "speed-3",
    stationId: "demo-sp-3",
    stationName: "ChargeZone - Sayaji Hotel, Wakad",
    network: "ChargeZone",
    date: "05 Nov 2026",
    kwh: 29.0,
    cost: 667, // ₹23/kWh
    durationMinutes: 22, // ~79 kW
    connectorType: "CCS2",
  },
  {
    id: "speed-4",
    stationId: "demo-sp-4",
    stationName: "Jio-bp pulse - Urse Toll Plaza",
    network: "Jio-bp pulse",
    date: "28 Oct 2026",
    kwh: 36.0,
    cost: 828, // ₹23/kWh
    durationMinutes: 25, // ~86 kW
    connectorType: "CCS2",
  },
];

// Preset Persona 2: Budget Conscious (prioritizes low rates ₹11-14/kWh, slower AC or low-tariff DC)
export const BUDGET_SAVER_HISTORY: ChargingSessionRecord[] = [
  {
    id: "budget-1",
    stationId: "demo-bg-1",
    stationName: "MahaGenco Green Hub - Somwar Peth",
    network: "MahaGenco",
    date: "13 Nov 2026",
    kwh: 24.0,
    cost: 288, // ₹12/kWh
    durationMinutes: 70, // ~20 kW
    connectorType: "CCS2",
  },
  {
    id: "budget-2",
    stationId: "demo-bg-2",
    stationName: "Tata Power - Seasons Mall, Magarpatta",
    network: "Tata Power",
    date: "08 Nov 2026",
    kwh: 22.0,
    cost: 286, // ₹13/kWh
    durationMinutes: 65, // ~20 kW
    connectorType: "CCS2",
  },
  {
    id: "budget-3",
    stationId: "demo-bg-3",
    stationName: "BESCOM / MSEDCL Community Charger - Kothrud",
    network: "MSEDCL",
    date: "02 Nov 2026",
    kwh: 28.0,
    cost: 336, // ₹12/kWh
    durationMinutes: 80, // ~21 kW
    connectorType: "CCS2",
  },
  {
    id: "budget-4",
    stationId: "demo-bg-4",
    stationName: "Statiq Economy - PCMC Civic Center",
    network: "Statiq",
    date: "26 Oct 2026",
    kwh: 20.0,
    cost: 260, // ₹13/kWh
    durationMinutes: 58, // ~20 kW
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
  city: "Pune",
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
  // Manual range info (used when no vehicle is linked to the app)
  manualRangeKm: number | null;
  setManualRangeKm: (km: number | null) => void;
  manualBatteryCapacityKwh: number | null;
  setManualBatteryCapacityKwh: (kwh: number | null) => void;
  // Personalisation from History
  userHabit: LearnedUserHabit;
  activePersona: "default" | "speed" | "budget";
  setPersonaHabit: (persona: "default" | "speed" | "budget") => void;
  // Global Active Charging Session
  activeSession: ActiveChargingSession | null;
  startChargingSession: (params: {
    stationId: string | number;
    stationName: string;
    network?: string;
    connectorType?: string;
    speedKw?: number;
    pricePerKwh: number;
  }) => { success: boolean; error?: string };
  stopChargingSession: (reason?: "completed" | "wallet_depleted" | "user_stopped") => {
    sessionRecord: ChargingSessionRecord | null;
    finalBattery: number;
    finalCost: number;
    reason: string;
  };
  sessionJustCompleted: {
    sessionRecord: ChargingSessionRecord;
    reason: "completed" | "wallet_depleted" | "user_stopped";
  } | null;
  clearSessionJustCompleted: () => void;
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
  // Manual range info (used when no vehicle is linked to the app)
  const [manualRangeKm, setManualRangeKm] = useState<number | null>(null);
  const [manualBatteryCapacityKwh, setManualBatteryCapacityKwh] = useState<number | null>(null);
  // Persona habit state ("default" analyzes real sessionHistory; "speed" & "budget" test personas)
  const [activePersona, setActivePersona] = useState<"default" | "speed" | "budget">("default");
  // Active charging session persisted across views & reloads
  const [activeSession, setActiveSession] = useState<ActiveChargingSession | null>(null);
  const [sessionJustCompleted, setSessionJustCompleted] = useState<{
    sessionRecord: ChargingSessionRecord;
    reason: "completed" | "wallet_depleted" | "user_stopped";
  } | null>(null);

  const userHabit = useMemo(() => {
    if (activePersona === "speed") {
      return inferHabitFromHistory(SPEED_SEEKER_HISTORY);
    }
    if (activePersona === "budget") {
      return inferHabitFromHistory(BUDGET_SAVER_HISTORY);
    }
    return inferHabitFromHistory(sessionHistory);
  }, [activePersona, sessionHistory]);

  const setPersonaHabit = (persona: "default" | "speed" | "budget") => {
    setActivePersona(persona);
  };

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
      setActiveSession(null);
      setSessionJustCompleted(null);
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

      // Check active charging session
      const savedActiveSess = localStorage.getItem(`chargehub:${userId}:active_session`);
      if (savedActiveSess) {
        try {
          const parsedSess: ActiveChargingSession = JSON.parse(savedActiveSess);
          const bal = savedBalance !== null ? JSON.parse(savedBalance) : 1450;
          const prog = computeActiveSessionProgress(parsedSess, Date.now(), bal);
          if (prog.isFull || prog.isWalletDepleted) {
            // Concluded while browser was closed/refreshed
            const finalCost = prog.cost;
            const finalBattery = Math.min(100, Math.round(prog.currentBattery));
            const newBal = Math.max(0, bal - finalCost);
            setWalletBalance(newBal);
            setBatteryPercent(finalBattery);
            const rec: ChargingSessionRecord = {
              id: "sess-" + Date.now(),
              stationId: parsedSess.stationId,
              stationName: parsedSess.stationName,
              network: parsedSess.network || "ChargeHub Network",
              date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
              kwh: prog.kwhDelivered,
              cost: finalCost,
              durationMinutes: Math.max(1, Math.round(prog.elapsedSeconds / 60)),
              connectorType: parsedSess.connectorType || "CCS2",
            };
            setSessionHistory((prev) => [rec, ...prev]);
            const newTx: Transaction = {
              id: "tx-" + Date.now(),
              stationName: rec.stationName,
              network: rec.network,
              amount: finalCost,
              type: "charge",
              date: "Just now",
            };
            setTransactions((prev) => [newTx, ...prev]);
            setActiveSession(null);
            setSessionJustCompleted({
              sessionRecord: rec,
              reason: prog.isFull ? "completed" : "wallet_depleted",
            });
            localStorage.removeItem(`chargehub:${userId}:active_session`);
          } else {
            setActiveSession(parsedSess);
          }
        } catch (e) {
          console.warn("Could not parse saved active session", e);
        }
      } else {
        setActiveSession(null);
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
      if (activeSession) {
        localStorage.setItem(`chargehub:${userId}:active_session`, JSON.stringify(activeSession));
      } else {
        localStorage.removeItem(`chargehub:${userId}:active_session`);
      }
    } catch (err) {
      console.warn("Could not write to user localStorage", err);
    }
  }, [walletBalance, transactions, sessionHistory, vehicleProfile, userProfile, batteryPercent, activeSession, user, loadedUserId]);

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

  const stopChargingSession = useCallback(
    (reason: "completed" | "wallet_depleted" | "user_stopped" = "user_stopped") => {
      if (!activeSession) {
        return { sessionRecord: null, finalBattery: batteryPercent, finalCost: 0, reason };
      }

      const progress = computeActiveSessionProgress(activeSession, Date.now(), walletBalance);
      const finalBattery = Math.min(100, Math.round(progress.currentBattery));
      const finalCost = progress.cost;

      // Deduct cost from wallet ONCE
      deductWalletMoney(finalCost);
      // Update battery % in app
      setBatteryPercent(finalBattery);

      const record: ChargingSessionRecord = {
        id: "sess-" + Date.now(),
        stationId: activeSession.stationId,
        stationName: activeSession.stationName,
        network: activeSession.network || "ChargeHub Network",
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        kwh: progress.kwhDelivered,
        cost: finalCost,
        durationMinutes: Math.max(1, Math.round(progress.elapsedSeconds / 60)),
        connectorType: activeSession.connectorType || "CCS2",
      };

      setSessionHistory((prev) => [record, ...prev]);

      const newTx: Transaction = {
        id: "tx-" + Date.now(),
        stationName: record.stationName,
        network: record.network,
        amount: finalCost,
        type: "charge",
        date: "Just now",
      };
      setTransactions((prev) => [newTx, ...prev]);

      setActiveSession(null);
      setSessionJustCompleted({ sessionRecord: record, reason });

      return { sessionRecord: record, finalBattery, finalCost, reason };
    },
    [activeSession, batteryPercent, walletBalance, deductWalletMoney]
  );

  const startChargingSession = useCallback(
    (params: {
      stationId: string | number;
      stationName: string;
      network?: string;
      connectorType?: string;
      speedKw?: number;
      pricePerKwh: number;
    }) => {
      if (activeSession) {
        return { success: false, error: "Charging already in progress" };
      }

      const effectiveCapacity = manualBatteryCapacityKwh || vehicleProfile.batteryCapacityKwh || 40.5;
      const newSession: ActiveChargingSession = {
        stationId: params.stationId,
        stationName: params.stationName,
        network: params.network,
        connectorType: params.connectorType,
        speedKw: params.speedKw,
        pricePerKwh: params.pricePerKwh,
        startedAt: Date.now(),
        startPercent: batteryPercent,
        vehicleBatteryCapacity: effectiveCapacity,
      };

      setActiveSession(newSession);
      setSessionJustCompleted(null);
      return { success: true };
    },
    [activeSession, batteryPercent, manualBatteryCapacityKwh, vehicleProfile]
  );

  const clearSessionJustCompleted = useCallback(() => {
    setSessionJustCompleted(null);
  }, []);

  // Background monitor: Auto-finish when 100% full or when wallet runs out
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const progress = computeActiveSessionProgress(activeSession, Date.now(), walletBalance);
      if (progress.isFull) {
        stopChargingSession("completed");
      } else if (progress.isWalletDepleted) {
        stopChargingSession("wallet_depleted");
      }
    }, 400);

    return () => clearInterval(interval);
  }, [activeSession, walletBalance, stopChargingSession]);

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
        manualRangeKm,
        setManualRangeKm,
        manualBatteryCapacityKwh,
        setManualBatteryCapacityKwh,
        userHabit,
        activePersona,
        setPersonaHabit,
        activeSession,
        startChargingSession,
        stopChargingSession,
        sessionJustCompleted,
        clearSessionJustCompleted,
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
