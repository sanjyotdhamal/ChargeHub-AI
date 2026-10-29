"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  chargingPreference?: "balanced" | "fastest" | "cheapest" | "nearest";
  notifications?: {
    chargingComplete: boolean;
    lowBattery: boolean;
    priceDrop: boolean;
  };
}

export interface AuthResponseResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  user?: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponseResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResponseResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch (err) {
      console.warn("Could not check current auth session:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load current user session on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<AuthResponseResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Invalid email or password",
          fieldErrors: data.fieldErrors,
        };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: "Authentication failed" };
    } catch (err) {
      console.error("Login fetch error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponseResult> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Signup failed",
          fieldErrors: data.fieldErrors,
        };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: "Account creation failed" };
    } catch (err) {
      console.error("Signup fetch error:", err);
      return { success: false, error: "Something went wrong, please try again" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      router.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
