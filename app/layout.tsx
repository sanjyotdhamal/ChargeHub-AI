import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { VehicleProvider } from "@/context/VehicleContext";
import MobileFrame from "@/components/MobileFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChargeHub AI — Smart Unified EV Charging Platform",
  description:
    "AI-powered unified EV charging platform aggregating Tata Power, Statiq, ChargeZone and more across Maharashtra in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#F8FAFC]`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC]">
        <AuthProvider>
          <VehicleProvider>
            <AppProvider>
              <MobileFrame>{children}</MobileFrame>
            </AppProvider>
          </VehicleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
